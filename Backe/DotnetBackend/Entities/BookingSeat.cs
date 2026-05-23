using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebPhimApi.Entities;

[Table("booking_seats")]
public class BookingSeat
{
    [Key]
    public int Id { get; set; }

    [Column("booking_id")]
    public int BookingId { get; set; }

    [Column("showtime_id")]
    public int ShowtimeId { get; set; }

    [Column("seat_id")]
    public int SeatId { get; set; }

    [Required]
    [Column(TypeName = "decimal(10,2)")]
    public decimal Price { get; set; }

    [Column("is_checked_in")]
    public bool IsCheckedIn { get; set; } = false;

    // Navigation
    [ForeignKey(nameof(BookingId))]
    public Booking Booking { get; set; } = null!;

    [ForeignKey(nameof(ShowtimeId))]
    public Showtime Showtime { get; set; } = null!;

    [ForeignKey(nameof(SeatId))]
    public Seat Seat { get; set; } = null!;
}
