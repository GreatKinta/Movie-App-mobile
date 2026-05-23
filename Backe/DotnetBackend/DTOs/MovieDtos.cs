using System.Text.Json.Serialization;

namespace WebPhimApi.DTOs;

public record MovieResponse(
    [property: JsonPropertyName("id")] int MovieId,
    string Title,
    string? Description,
    int? Duration,
    string? Poster,
    string? Banner,
    string Genre,
    string ReleaseDate,
    string? Director,
    string? CastMembers,
    string AgeRating,
    double Rating,
    string Status
);

public record CreateMovieRequest(
    string Title,
    string? Description,
    int? Duration,
    string? Poster,
    string? Banner,
    string Genre = "Chưa cập nhật",
    string ReleaseDate = "Chưa cập nhật",
    string? Director = null,
    string? CastMembers = null,
    string AgeRating = "P",
    string Status = "showing"
);
