using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using WebPhimApi.Data;
using WebPhimApi.DTOs;
using WebPhimApi.Entities;
using System.Text.RegularExpressions;
using Order = WebPhimApi.Entities.Order;

namespace WebPhimApi.Services;

public partial class PaymentService(
    AppDbContext db,
    IConnectionMultiplexer redis,
    ILogger<PaymentService> logger)
{
    private IDatabase Cache => redis.GetDatabase();

    [GeneratedRegex(@"(?i)(DH\d+)", RegexOptions.Compiled)]
    private static partial Regex OrderCodePattern();

    public async Task ProcessWebhookAsync(SePayWebhookRequest request)
    {
        logger.LogInformation("=== Nhận webhook SePay: gateway={Gateway}, amount={Amount}, content='{Content}'",
            request.Gateway, request.TransferAmount, request.Content);

        var orderCode = ExtractOrderCode(request.Content);
        if (orderCode is null)
        {
            logger.LogWarning("Không tìm thấy mã DH trong nội dung: '{Content}'", request.Content);
            return;
        }

        var order = await db.Orders.FirstOrDefaultAsync(o => o.OrderCode == orderCode);
        if (order is null)
        {
            logger.LogWarning("Không tìm thấy order với orderCode='{OrderCode}'", orderCode);
            return;
        }

        if (order.Status != OrderStatus.pending)
        {
            logger.LogInformation("Order '{OrderCode}' đã ở trạng thái '{Status}', bỏ qua.", orderCode, order.Status);
            return;
        }

        if (request.TransferAmount >= order.FinalAmount)
        {
            order.Status = OrderStatus.paid;
            order.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            logger.LogInformation("✅ Order '{OrderCode}' thanh toán THÀNH CÔNG. Nhận: {Amount}, Cần: {Final}",
                orderCode, request.TransferAmount, order.FinalAmount);

            await ProcessSeatsOnPaymentSuccessAsync(order);
        }
        else
        {
            logger.LogWarning("⚠️ Order '{OrderCode}' thiếu tiền. Nhận: {Amount}, Cần: {Final}",
                orderCode, request.TransferAmount, order.FinalAmount);
        }
    }

    private async Task ProcessSeatsOnPaymentSuccessAsync(Order order)
    {
        var bookings = await db.Bookings
            .Include(b => b.Showtime)
            .Where(b => b.OrderId == order.OrderId)
            .ToListAsync();

        if (bookings.Count == 0) return;

        var showtimeId = bookings[0].ShowtimeId;
        var redisHashKey = $"showtime:{showtimeId}:seats";

        foreach (var booking in bookings)
        {
            var bookingSeats = await db.BookingSeats
                .Include(bs => bs.Seat)
                .Where(bs => bs.BookingId == booking.BookingId)
                .ToListAsync();

            foreach (var bs in bookingSeats)
            {
                var seatKey = $"{bs.Seat.RowName}{bs.Seat.SeatNumber}";
                await Cache.HashSetAsync(redisHashKey, seatKey, "SOLD");
                logger.LogInformation("✅ Ghế {SeatKey} đã SOLD vĩnh viễn (orderId={OrderId})", seatKey, order.OrderId);
            }
        }
    }

    public async Task<BookingStatusResponse> GetBookingStatusAsync(string orderCode)
    {
        var order = await db.Orders.FirstOrDefaultAsync(o => o.OrderCode == orderCode);
        if (order is null)
            return new BookingStatusResponse(null, "not_found", false);

        return new BookingStatusResponse(
            order.OrderId,
            order.Status.ToString(),
            order.Status == OrderStatus.paid
        );
    }

    private static string? ExtractOrderCode(string content)
    {
        if (string.IsNullOrWhiteSpace(content)) return null;
        var match = OrderCodePattern().Match(content);
        return match.Success ? match.Groups[1].Value.ToUpperInvariant() : null;
    }
}
