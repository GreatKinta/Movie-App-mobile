using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebPhimApi.Entities;

[Table("users")]
public class User
{
    [Key]
    [Column("user_id")]
    public int UserId { get; set; }

    [Required]
    [MaxLength(50)]
    public string Username { get; set; } = null!;

    [Required]
    [MaxLength(255)]
    [Column("password_hash")]
    public string PasswordHash { get; set; } = null!;

    [Required]
    [MaxLength(100)]
    public string Email { get; set; } = null!;

    [MaxLength(100)]
    [Column("full_name")]
    public string? FullName { get; set; }

    [MaxLength(15)]
    [Column("phone_number")]
    public string? PhoneNumber { get; set; }

    [MaxLength(500)]
    [Column("avatar_url")]
    public string? AvatarUrl { get; set; }

    [Column(TypeName = "enum('admin','staff','customer')")]
    public UserRole Role { get; set; } = UserRole.customer;

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    // Navigation
    public ICollection<Order> Orders { get; set; } = [];
}

public enum UserRole { admin, staff, customer }
