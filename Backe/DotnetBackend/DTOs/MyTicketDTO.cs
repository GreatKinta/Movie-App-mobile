using System.Text.Json.Serialization;

namespace WebPhimApi.DTOs;

public class MyTicketDTO
{
    public int OrderId { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    
    // Movie & Showtime details
    public string MovieTitle { get; set; } = string.Empty;
    public string MoviePoster { get; set; } = string.Empty;
    public string DisplayTags { get; set; } = string.Empty; // e.g. "2D", specific tags
    
    public string RoomName { get; set; } = string.Empty;
    public DateTime ShowtimeStart { get; set; }
    
    public List<string> Seats { get; set; } = [];
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = [];
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}
