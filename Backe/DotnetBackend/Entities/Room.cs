using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebPhimApi.Entities;

[Table("rooms")]
public class Room
{
    [Key]
    [Column("room_id")]
    public int RoomId { get; set; }

    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = null!;

    [Column("total_seats")]
    public int? TotalSeats { get; set; }

    [Column(TypeName = "enum('active','maintenance')")]
    public RoomStatus Status { get; set; } = RoomStatus.active;

    // Navigation
    public ICollection<Seat> Seats { get; set; } = [];
    public ICollection<Showtime> Showtimes { get; set; } = [];
}

public enum RoomStatus { active, maintenance }
