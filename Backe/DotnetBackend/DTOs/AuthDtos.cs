using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace WebPhimApi.DTOs;

public record LoginRequest(
    [Required(ErrorMessage = "Email không được để trống")]
    [EmailAddress(ErrorMessage = "Email không hợp lệ")]
    string Email,
    [Required(ErrorMessage = "Mật khẩu không được để trống")]
    string Password
);

public record RegisterRequest(
    [Required][MinLength(3)][MaxLength(50)] string Username,
    [Required][EmailAddress] string Email,
    [Required][MinLength(6)] string Password,
    [Required] string FullName,
    string? PhoneNumber
);

public record AuthResponse(
    string AccessToken,
    string TokenType = "Bearer",
    long ExpiresIn = 604800
);

public record UserInfoResponse(
    [property: JsonPropertyName("id")] int UserId,
    string Username,
    string Email,
    string? FullName,
    string? PhoneNumber,
    string? AvatarUrl,
    string Role
);

public record UpdateProfileRequest(
    [Required(ErrorMessage = "Họ tên không được để trống")]
    string FullName,
    [Required(ErrorMessage = "Số điện thoại không được để trống")]
    [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
    string PhoneNumber,
    string? AvatarUrl
);
