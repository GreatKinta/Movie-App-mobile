using System.Text.Json.Serialization;

namespace WebPhimApi.DTOs;

public record ShowtimeDetailResponse(
    int ShowtimeId,
    int MovieId,
    string MovieTitle,
    string? Poster,
    string RoomName,
    DateTime StartTime,
    decimal BasePrice,
    int? Duration,
    string Genre,
    string AgeRating,
    bool IsLocked
);

public record SeatStatusResponse(
    [property: JsonPropertyName("id")] int SeatId,
    string RowName,
    int SeatNumber,
    string Status,          // AVAILABLE | LOCKED | SOLD
    string SeatTypeName,
    decimal Price
);

public record MovieWithShowtimesResponse(
    int Id,
    string Title,
    string? Poster,
    int? Duration,
    string Genre,
    string AgeRating,
    List<ShowtimeBasicInfo> Showtimes
);

public record ShowtimeBasicInfo(
    int Id,
    DateTime StartTime,
    string RoomName,
    bool IsLocked
);

public class CreateShowtimeRequest
{
    public int MovieId { get; set; }
    public int RoomId { get; set; }
    public DateTime StartTime { get; set; }
    public decimal BasePrice { get; set; }
    public int BufferTimeMinutes { get; set; } = 15;
}

public class AutoGenerateShowtimesRequest
{
    public int MovieId { get; set; }
    public List<int> RoomIds { get; set; } = [];
    public string Date { get; set; } = string.Empty; // "YYYY-MM-DD"
    public string OpenTime { get; set; } = "08:00:00"; // "HH:MM:SS"
    public string CloseTime { get; set; } = "23:00:00"; // "HH:MM:SS"
    public decimal BasePrice { get; set; }
    public int CleaningMinutes { get; set; } = 15;
}

public class AdminShowtimeResponse
{
    public int ShowtimeId { get; set; }
    public int MovieId { get; set; }
    public string MovieTitle { get; set; } = string.Empty;
    public string RoomName { get; set; } = string.Empty;
    public int RoomId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public int Duration { get; set; }
    public decimal BasePrice { get; set; }
    public string Status { get; set; } = "active"; // active | cancelled
    public int SoldSeats { get; set; }
    public int TotalSeats { get; set; }
}
