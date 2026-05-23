using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using WebPhimApi.Data;
using WebPhimApi.DTOs;
using WebPhimApi.Entities;
using Order = WebPhimApi.Entities.Order;

namespace WebPhimApi.Services;

public class BookingService(AppDbContext db, IConnectionMultiplexer redis, ILogger<BookingService> logger)
{
    private const int BookingTtlMinutes = 10;
    private IDatabase Cache => redis.GetDatabase();

    /// <summary>
    /// Tạo booking: lock ghế bằng Redis distributed lock, lưu DB, đánh dấu LOCKED.
    /// Tương đương BookingService.bookSeats() dùng Redisson RLock.
    /// </summary>
    public async Task<CreateBookingResponse> BookSeatsAsync(BookingRequest request)
    {
        var showtime = await db.Showtimes
            .Include(s => s.Room)
            .FirstOrDefaultAsync(s => s.ShowtimeId == request.ShowtimeId)
            ?? throw new KeyNotFoundException("Suất chiếu không tồn tại");

        if (showtime.Status == ShowtimeStatus.cancelled)
            throw new InvalidOperationException("Suất chiếu đã bị hủy");

        if (showtime.Status == ShowtimeStatus.completed || DateTime.Now > showtime.StartTime.AddMinutes(15))
            throw new InvalidOperationException("Suất chiếu đã quá thời gian đặt vé (15 phút sau khi bắt đầu)");

        var user = await db.Users.FindAsync(request.UserId)
            ?? throw new KeyNotFoundException("Người dùng không tồn tại");

        // ── 1. Parse seat keys ──────────────────────────────────────────
        var roomId = showtime.Room.RoomId;
        var seatKeys = request.SeatIds;
        var redisHashKey = $"showtime:{request.ShowtimeId}:seats";

        // ── 2. Acquire Redis locks per seat (distributed lock) ──────────
        var lockKeys = seatKeys.Select(k => $"lock:showtime:{request.ShowtimeId}:seat:{k}").ToList();
        var acquiredLocks = new List<string>();

        try
        {
            foreach (var lockKey in lockKeys)
            {
                var locked = await Cache.StringSetAsync(
                    lockKey, "1",
                    TimeSpan.FromSeconds(10),
                    When.NotExists);

                if (!locked)
                    throw new InvalidOperationException("Ghế đang được người khác giữ, vui lòng thử lại");

                acquiredLocks.Add(lockKey);
            }

            // ── 3. Check seat availability in Redis ─────────────────────
            foreach (var seatKey in seatKeys)
            {
                var status = await Cache.HashGetAsync(redisHashKey, seatKey);
                if (status.HasValue)
                    throw new InvalidOperationException($"Ghế {seatKey} đã được đặt hoặc đang bị giữ");
            }

            // ── 4. Load seats from DB ───────────────────────────────────
            var seats = await db.Seats
                .Include(s => s.SeatType)
                .Where(s => s.RoomId == roomId && seatKeys.Contains(s.RowName + s.SeatNumber.ToString()))
                .ToListAsync();

            if (seats.Count != seatKeys.Count)
                throw new InvalidOperationException("Một hoặc nhiều ghế không tồn tại trong phòng này");

            // ── 5. Calculate price & Prepare BookingSeats ────────────────
            decimal totalAmount = 0;
            var bookingSeats = new List<BookingSeat>();

            // Xử lý ghế thường và VIP (non-couple)
            var normalSeats = seats.Where(s => s.SeatType.Name.ToLower() != "couple" && s.SeatType.Name != "đôi").ToList();
            foreach (var s in normalSeats)
            {
                decimal price = showtime.BasePrice + s.SeatType.Surcharge;
                totalAmount += price;
                bookingSeats.Add(new BookingSeat
                {
                    SeatId = s.SeatId,
                    Price = price
                });
            }

            // Xử lý ghế đôi (Couple) theo nhóm hàng
            var coupleSeatsByRow = seats
                .Where(s => s.SeatType.Name.ToLower() == "couple" || s.SeatType.Name == "đôi")
                .GroupBy(s => s.RowName);

            foreach (var group in coupleSeatsByRow)
            {
                // Sắp xếp các ghế đôi theo số ghế tăng dần để ghép đôi chính xác
                var sortedCouple = group.OrderBy(s => s.SeatNumber).ToList();
                int i = 0;
                while (i < sortedCouple.Count)
                {
                    var seat1 = sortedCouple[i];
                    var seat2 = (i + 1 < sortedCouple.Count) ? sortedCouple[i + 1] : null;

                    decimal pairPrice = showtime.BasePrice + seat1.SeatType.Surcharge;
                    totalAmount += pairPrice;

                    if (seat2 != null)
                    {
                        // Chia đôi giá trị ghế đôi cho mỗi ghế thành phần để tổng khớp chuẩn totalAmount
                        decimal splitPrice = pairPrice / 2;
                        bookingSeats.Add(new BookingSeat { SeatId = seat1.SeatId, Price = splitPrice });
                        bookingSeats.Add(new BookingSeat { SeatId = seat2.SeatId, Price = splitPrice });
                        i += 2;
                    }
                    else
                    {
                        // Ghế đôi lẻ không tìm thấy cặp đi kèm
                        bookingSeats.Add(new BookingSeat { SeatId = seat1.SeatId, Price = pairPrice });
                        i += 1;
                    }
                }
            }

            var expiredAt = DateTime.UtcNow.AddMinutes(BookingTtlMinutes);

            // ── 6. Save Order ───────────────────────────────────────────
            var order = new Order
            {
                OrderCode = "TEMP_" + Guid.NewGuid().ToString("N").Substring(0, 6),
                UserId = user.UserId,
                TotalAmount = totalAmount,
                FinalAmount = totalAmount,
                Status = OrderStatus.pending,
                PaymentMethod = "QR",
                ExpiredAt = expiredAt,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            db.Orders.Add(order);
            await db.SaveChangesAsync();

            // Update orderCode after getting real ID
            order.OrderCode = "DH" + order.OrderId;
            await db.SaveChangesAsync();

            // ── 7. Save Booking ─────────────────────────────────────────
            var booking = new Booking
            {
                OrderId = order.OrderId,
                ShowtimeId = showtime.ShowtimeId
            };
            db.Bookings.Add(booking);
            await db.SaveChangesAsync();

            // ── 8. Save BookingSeats ────────────────────────────────────
            foreach (var bs in bookingSeats)
            {
                bs.BookingId = booking.BookingId;
                bs.ShowtimeId = showtime.ShowtimeId;
            }

            db.BookingSeats.AddRange(bookingSeats);
            await db.SaveChangesAsync();

            // ── 9. Mark seats LOCKED in Redis ───────────────────────────
            foreach (var seatKey in seatKeys)
                await Cache.HashSetAsync(redisHashKey, seatKey, "LOCKED");

            logger.LogInformation("Booking thành công: bookingId={BookingId}, orderCode={OrderCode}",
                booking.BookingId, order.OrderCode);

            return new CreateBookingResponse(booking.BookingId, order.OrderCode, order.Status.ToString());
        }
        finally
        {
            // ── 10. Release all locks ───────────────────────────────────
            foreach (var lockKey in acquiredLocks)
                await Cache.KeyDeleteAsync(lockKey);
        }
    }

    public async Task<PagedResult<MyTicketDTO>> GetMyTicketsAsync(int userId, int page, int pageSize)
    {
        var query = db.Orders
            .Include(o => o.Bookings)
                .ThenInclude(b => b.Showtime)
                    .ThenInclude(s => s.Room)
            .Include(o => o.Bookings)
                .ThenInclude(b => b.Showtime)
                    .ThenInclude(s => s.Movie)
            .Include(o => o.Bookings)
                .ThenInclude(b => b.BookingSeats)
                    .ThenInclude(bs => bs.Seat)
            .Where(o => o.UserId == userId && o.Status == OrderStatus.paid)
            .OrderByDescending(o => o.CreatedAt);

        var totalCount = await query.CountAsync();
        
        var orders = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = orders.Select(o => 
        {
            var firstBooking = o.Bookings.FirstOrDefault();
            var showtime = firstBooking?.Showtime;
            var movie = showtime?.Movie;
            
            var seats = o.Bookings
                .SelectMany(b => b.BookingSeats)
                .Select(bs => bs.Seat.RowName + bs.Seat.SeatNumber)
                .ToList();

            return new MyTicketDTO
            {
                OrderId = o.OrderId,
                OrderCode = o.OrderCode,
                TotalAmount = o.FinalAmount,
                Status = o.Status.ToString(),
                CreatedAt = o.CreatedAt,
                MovieTitle = movie?.Title ?? "Unknown",
                MoviePoster = movie?.Poster ?? "",
                DisplayTags = movie?.Genre ?? "",
                RoomName = showtime?.Room?.Name ?? "Unknown Room",
                ShowtimeStart = showtime?.StartTime ?? DateTime.MinValue,
                Seats = seats
            };
        }).ToList();

        return new PagedResult<MyTicketDTO>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }
}
