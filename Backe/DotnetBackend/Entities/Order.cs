using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebPhimApi.Entities;

[Table("orders")]
public class Order
{
    [Key]
    [Column("order_id")]
    public int OrderId { get; set; }

    [Required]
    [MaxLength(50)]
    [Column("order_code")]
    public string OrderCode { get; set; } = null!;

    [Column("user_id")]
    public int UserId { get; set; }

    [Required]
    [Column("total_amount", TypeName = "decimal(10,2)")]
    public decimal TotalAmount { get; set; }

    [Column("discount_amount", TypeName = "decimal(10,2)")]
    public decimal DiscountAmount { get; set; } = 0;

    [Required]
    [Column("final_amount", TypeName = "decimal(10,2)")]
    public decimal FinalAmount { get; set; }

    [Column(TypeName = "enum('pending','paid','cancelled','expired','refunded')")]
    public OrderStatus Status { get; set; } = OrderStatus.pending;

    [MaxLength(50)]
    [Column("payment_method")]
    public string? PaymentMethod { get; set; }

    [Required]
    [Column("expired_at")]
    public DateTime ExpiredAt { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;

    public ICollection<Booking> Bookings { get; set; } = [];
}

public enum OrderStatus { pending, paid, cancelled, expired, refunded }
