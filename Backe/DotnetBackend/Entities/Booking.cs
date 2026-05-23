using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebPhimApi.Entities;

[Table("bookings")]
public class Booking
{
    [Key]
    [Column("booking_id")]
    public int BookingId { get; set; }

    [Column("order_id")]
    public int OrderId { get; set; }

    [Column("showtime_id")]
    public int ShowtimeId { get; set; }

    // Navigation
    [ForeignKey(nameof(OrderId))]
    public Order Order { get; set; } = null!;

    [ForeignKey(nameof(ShowtimeId))]
    public Showtime Showtime { get; set; } = null!;

    public ICollection<BookingSeat> BookingSeats { get; set; } = [];
}
