using System.ComponentModel.DataAnnotations;

namespace WebPhimApi.DTOs;

// ── Customer ─────────────────────────────────────────────────────────────────

public record BookingRequest(
    [Required] int UserId,
    [Required] int ShowtimeId,
    [Required][MinLength(1)] List<string> SeatIds
);

public record CreateBookingResponse(
    int BookingId,
    string OrderCode,
    string Status
);

public record BookingStatusResponse(
    int? BookingId,
    string Status,
    bool Paid
);

// ── Admin / Staff ─────────────────────────────────────────────────────────────

public record AdminBookingRequest(
    int? UserId,
    [Required] int ShowtimeId,
    [Required][MinLength(1)] List<string> SeatIds,
    string PaymentMethod = "CASH"
);

public record AdminBookingResponse(
    int BookingId,
    string OrderCode,
    string Status,
    string PaymentMethod
);

public record TicketScanRequest(
    [Required] string OrderCode
);

public record ScanResultResponse(
    string OrderCode,
    string Status,
    string MovieTitle,
    DateTime Showtime,
    string Room,
    decimal TotalAmount,
    string? CustomerName,
    string? CustomerPhone,
    List<SeatInfo> Seats,
    bool IsFullyCheckedIn
);

public record SeatInfo(
    string SeatLabel,
    string SeatType,
    decimal Price,
    bool IsCheckedIn
);
