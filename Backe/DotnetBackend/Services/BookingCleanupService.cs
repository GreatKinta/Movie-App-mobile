using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using WebPhimApi.Data;
using WebPhimApi.Entities;

namespace WebPhimApi.Services;

/// <summary>
/// Chạy ngầm mỗi 60 giây:
/// 1. Tìm các order pending đã hết hạn → đánh dấu 'expired'
/// 2. Xóa booking_seats tương ứng để giải phóng ghế
/// 3. Xóa các Redis lock/hash key liên quan
/// </summary>
public class BookingCleanupService(
    IServiceScopeFactory scopeFactory,
    IConnectionMultiplexer redis,
    ILogger<BookingCleanupService> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromSeconds(60);
    private IDatabase Cache => redis.GetDatabase();

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("BookingCleanupService started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CleanupExpiredBookingsAsync();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error in BookingCleanupService");
            }

            await Task.Delay(Interval, stoppingToken);
        }
    }

    private async Task CleanupExpiredBookingsAsync()
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var now = DateTime.UtcNow;

        // Tìm tất cả order pending đã hết hạn
        var expiredOrders = await db.Orders
            .Where(o => o.Status == OrderStatus.pending && o.ExpiredAt < now)
            .Include(o => o.Bookings)
                .ThenInclude(b => b.BookingSeats)
            .ToListAsync();

        if (expiredOrders.Count == 0) return;

        logger.LogInformation("Found {Count} expired orders to clean up", expiredOrders.Count);

        foreach (var order in expiredOrders)
        {
            foreach (var booking in order.Bookings)
            {
                var showtimeId = booking.ShowtimeId;
                var seatSeats = booking.BookingSeats.ToList();

                // Xóa booking_seats → giải phóng ghế (unique constraint)
                db.BookingSeats.RemoveRange(seatSeats);

                // Xóa Redis hash và lock key cho từng ghế
                foreach (var bs in seatSeats)
                {
                    var redisHashKey = $"showtime:{showtimeId}:seats";
                    // Lấy seat key từ DB để xóa hash field
                    var seat = await db.Seats.FindAsync(bs.SeatId);
                    if (seat is not null)
                    {
                        var seatKey = seat.RowName + seat.SeatNumber.ToString();
                        await Cache.HashDeleteAsync(redisHashKey, seatKey);
                        await Cache.KeyDeleteAsync($"lock:showtime:{showtimeId}:seat:{seatKey}");
                    }
                }
            }

            order.Status = OrderStatus.expired;
            order.UpdatedAt = now;
        }

        await db.SaveChangesAsync();

        logger.LogInformation("Cleanup done: {Count} orders marked expired, seats released", expiredOrders.Count);
    }
}
