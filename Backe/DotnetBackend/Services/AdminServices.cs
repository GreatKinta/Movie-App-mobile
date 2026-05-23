using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using WebPhimApi.Data;
using WebPhimApi.DTOs;
using WebPhimApi.Entities;
using Order = WebPhimApi.Entities.Order;

namespace WebPhimApi.Services;

/// <summary>
/// Xử lý đặt vé tại quầy cho Admin/Staff.
/// </summary>
public class AdminBookingService(AppDbContext db, IConnectionMultiplexer redis, ILogger<AdminBookingService> logger)
{
    private IDatabase Cache => redis.GetDatabase();

    public async Task<AdminBookingResponse> BookTicketsAtCounterAsync(AdminBookingRequest request)
    {
        var showtime = await db.Showtimes
            .Include(s => s.Room)
            .FirstOrDefaultAsync(s => s.ShowtimeId == request.ShowtimeId)
            ?? throw new KeyNotFoundException("Suất chiếu không tồn tại");

        // Admin có thể đặt không cần user (đặt tại quầy)
        int userId = request.UserId ?? 1;

        var roomId = showtime.Room.RoomId;
        var seatKeys = request.SeatIds;
        var redisHashKey = $"showtime:{request.ShowtimeId}:seats";

        // Check redis availability
        foreach (var seatKey in seatKeys)
        {
            var status = await Cache.HashGetAsync(redisHashKey, seatKey);
            if (status.HasValue && status != "AVAILABLE")
                throw new InvalidOperationException($"Ghế {seatKey} đã được đặt");
        }

        var seats = await db.Seats
            .Include(s => s.SeatType)
            .Where(s => s.RoomId == roomId && seatKeys.Contains(s.RowName + s.SeatNumber.ToString()))
            .ToListAsync();

        // ── Calculate price & Prepare BookingSeats ────────────────
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

        // Đặt tại quầy → paid ngay lập tức
        var order = new Order
        {
            OrderCode = "TEMP",
            UserId = userId,
            TotalAmount = totalAmount,
            FinalAmount = totalAmount,
            Status = OrderStatus.paid,
            PaymentMethod = request.PaymentMethod,
            ExpiredAt = DateTime.UtcNow.AddMinutes(15),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.Orders.Add(order);
        await db.SaveChangesAsync();
        order.OrderCode = "DH" + order.OrderId;
        await db.SaveChangesAsync();

        var booking = new Booking { OrderId = order.OrderId, ShowtimeId = showtime.ShowtimeId };
        db.Bookings.Add(booking);
        await db.SaveChangesAsync();

        foreach (var bs in bookingSeats)
        {
            bs.BookingId = booking.BookingId;
            bs.ShowtimeId = showtime.ShowtimeId;
        }

        db.BookingSeats.AddRange(bookingSeats);
        await db.SaveChangesAsync();

        // Mark SOLD immediately (cash/counter payment = instant)
        foreach (var seatKey in seatKeys)
            await Cache.HashSetAsync(redisHashKey, seatKey, "SOLD");

        logger.LogInformation("Admin tạo vé tại quầy: orderCode={OrderCode}", order.OrderCode);

        return new AdminBookingResponse(booking.BookingId, order.OrderCode, order.Status.ToString(), request.PaymentMethod);
    }
}

/// <summary>
/// Xử lý quét vé (check-in) cho Admin/Staff.
/// </summary>
public class AdminTicketService(AppDbContext db, ILogger<AdminTicketService> logger)
{
    public async Task<ScanResultResponse> ScanTicketAsync(string orderCode)
    {
        var order = await db.Orders
            .Include(o => o.User)
            .FirstOrDefaultAsync(o => o.OrderCode == orderCode)
            ?? throw new KeyNotFoundException($"Không tìm thấy đơn hàng '{orderCode}'");

        if (order.Status != OrderStatus.paid)
            throw new InvalidOperationException($"Đơn hàng chưa được thanh toán (status: {order.Status})");

        var bookings = await db.Bookings
            .Include(b => b.Showtime).ThenInclude(s => s.Movie)
            .Include(b => b.Showtime).ThenInclude(s => s.Room)
            .Where(b => b.OrderId == order.OrderId)
            .ToListAsync();

        if (bookings.Count == 0)
            throw new InvalidOperationException("Không tìm thấy booking cho đơn hàng này");

        var firstShowtime = bookings[0].Showtime;
        var seatInfos = new List<SeatInfo>();
        var allBookingSeats = new List<BookingSeat>();
        bool alreadyCheckedIn = false;

        foreach (var booking in bookings)
        {
            var seats = await db.BookingSeats
                .Include(bs => bs.Seat).ThenInclude(s => s.SeatType)
                .Where(bs => bs.BookingId == booking.BookingId)
                .ToListAsync();

            allBookingSeats.AddRange(seats);

            foreach (var bs in seats)
            {
                if (bs.IsCheckedIn) alreadyCheckedIn = true;
                seatInfos.Add(new SeatInfo(
                    $"{bs.Seat.RowName}{bs.Seat.SeatNumber}",
                    bs.Seat.SeatType.Name,
                    bs.Price,
                    bs.IsCheckedIn
                ));
            }
        }

        // Idempotent: chỉ check-in lần đầu
        if (!alreadyCheckedIn)
        {
            foreach (var bs in allBookingSeats)
                bs.IsCheckedIn = true;
            await db.SaveChangesAsync();
            logger.LogInformation("Check-in thành công: orderCode={OrderCode}", orderCode);
        }
        else
        {
            logger.LogWarning("Vé đã được check-in trước đó: orderCode={OrderCode}", orderCode);
        }

        return new ScanResultResponse(
            order.OrderCode,
            order.Status.ToString(),
            firstShowtime.Movie.Title,
            firstShowtime.StartTime,
            firstShowtime.Room.Name,
            order.FinalAmount,
            order.User?.FullName,
            order.User?.PhoneNumber,
            seatInfos,
            alreadyCheckedIn
        );
    }
}
