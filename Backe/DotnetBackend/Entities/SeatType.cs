using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebPhimApi.Entities;

[Table("seat_types")]
public class SeatType
{
    [Key]
    [Column("seat_type_id")]
    public int SeatTypeId { get; set; }

    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = null!;

    [Column(TypeName = "decimal(10,2)")]
    public decimal Surcharge { get; set; }

    // Navigation
    public ICollection<Seat> Seats { get; set; } = [];
}
