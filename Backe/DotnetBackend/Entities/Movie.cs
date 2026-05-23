using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebPhimApi.Entities;

[Table("movies")]
public class Movie
{
    [Key]
    [Column("movie_id")]
    public int MovieId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = null!;

    [Column(TypeName = "text")]
    public string? Description { get; set; }

    [Column("duration_minutes")]
    public int? Duration { get; set; }

    [Column("trailer_duration_minutes")]
    public int TrailerDuration { get; set; } = 10;

    [MaxLength(255)]
    [Column("poster_url")]
    public string? Poster { get; set; }

    public string? Banner { get; set; }

    public string Genre { get; set; } = "Chưa cập nhật";

    [Column("release_date")]
    public string ReleaseDate { get; set; } = "Chưa cập nhật";

    public string? Director { get; set; }

    [Column("cast_members")]
    public string? CastMembers { get; set; }

    [MaxLength(10)]
    [Column("age_rating")]
    public string AgeRating { get; set; } = "P";

    public double Rating { get; set; } = 0.0;

    [Column(TypeName = "enum('showing','coming')")]
    public MovieStatus Status { get; set; } = MovieStatus.showing;

    // Navigation
    public ICollection<Showtime> Showtimes { get; set; } = [];
}

public enum MovieStatus { showing, coming }
