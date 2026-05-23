using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebPhimApi.Entities;

[Table("seats")]
public class Seat
{
    [Key]
    [Column("seat_id")]
    public int SeatId { get; set; }

    [Column("room_id")]
    public int RoomId { get; set; }

    [Column("seat_type_id")]
    public int SeatTypeId { get; set; }

    [Required]
    [MaxLength(2)]
    [Column("row_name")]
    public string RowName { get; set; } = null!;

    [Column("seat_number")]
    public int SeatNumber { get; set; }

    // Navigation
    [ForeignKey(nameof(RoomId))]
    public Room Room { get; set; } = null!;

    [ForeignKey(nameof(SeatTypeId))]
    public SeatType SeatType { get; set; } = null!;
}
