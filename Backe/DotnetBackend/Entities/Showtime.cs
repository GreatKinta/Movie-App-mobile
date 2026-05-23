using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebPhimApi.Entities;

[Table("showtimes")]
public class Showtime
{
    [Key]
    [Column("showtime_id")]
    public int ShowtimeId { get; set; }

    [Column("movie_id")]
    public int MovieId { get; set; }

    [Column("room_id")]
    public int RoomId { get; set; }

    [Required]
    [Column("start_time")]
    public DateTime StartTime { get; set; }

    [Column("end_time")]
    public DateTime? EndTime { get; set; }

    [Column("buffer_time_minutes")]
    public int BufferTimeMinutes { get; set; } = 15;

    [Required]
    [Column("base_price", TypeName = "decimal(10,2)")]
    public decimal BasePrice { get; set; }

    [Column(TypeName = "enum('active','cancelled','completed')")]
    public ShowtimeStatus Status { get; set; } = ShowtimeStatus.active;

    [MaxLength(100)]
    [Column("batch_id")]
    public string? BatchId { get; set; }

    // Navigation
    [ForeignKey(nameof(MovieId))]
    public Movie Movie { get; set; } = null!;

    [ForeignKey(nameof(RoomId))]
    public Room Room { get; set; } = null!;

    public ICollection<Booking> Bookings { get; set; } = [];
    public ICollection<BookingSeat> BookingSeats { get; set; } = [];
}

public enum ShowtimeStatus { active, cancelled, completed }
