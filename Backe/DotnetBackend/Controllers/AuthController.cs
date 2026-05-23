using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.IO;
using WebPhimApi.DTOs;
using WebPhimApi.Services;

namespace WebPhimApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AuthService authService) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (token, error) = await authService.LoginAsync(request);
        if (error is not null) return Unauthorized(new { message = error });

        // Set HttpOnly cookie (tương đương Spring ResponseCookie)
        Response.Cookies.Append("jwt", token!.AccessToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = false,  // true trên production HTTPS
            SameSite = SameSiteMode.Strict,
            Expires = DateTimeOffset.UtcNow.AddDays(7)
        });

        return Ok(token);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (token, error) = await authService.RegisterAsync(request);
        if (error is not null) return BadRequest(new { message = error });

        Response.Cookies.Append("jwt", token!.AccessToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = false,
            SameSite = SameSiteMode.Strict,
            Expires = DateTimeOffset.UtcNow.AddDays(7)
        });

        return Ok(token);
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMe()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdStr, out var userId))
            return Unauthorized();

        var user = await authService.GetMeAsync(userId);
        return user is null ? NotFound() : Ok(user);
    }

    [HttpPut("update")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdStr, out var userId))
            return Unauthorized();

        var (updatedUser, error) = await authService.UpdateProfileAsync(userId, request);
        if (error is not null) return BadRequest(new { message = error });

        return Ok(updatedUser);
    }

    [HttpPost("upload-avatar")]
    [Authorize]
    public async Task<IActionResult> UploadAvatar([FromForm] IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Vui lòng chọn ảnh đại diện" });

            // Validate extension
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var extension = Path.GetExtension(file.FileName).ToLower();
            if (!allowedExtensions.Contains(extension))
                return BadRequest(new { message = "Định dạng file không hợp lệ. Chỉ chấp nhận JPG, JPEG, PNG, WEBP." });

            // Create directories
            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "avatars");
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var avatarUrl = $"/uploads/avatars/{uniqueFileName}";

            // Directly update the user's AvatarUrl in the database
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out var userId))
                return Unauthorized();

            var user = await authService.GetMeAsync(userId);
            if (user == null) return NotFound();

            var (updatedUser, error) = await authService.UpdateProfileAsync(userId, new UpdateProfileRequest(user.FullName ?? "", user.PhoneNumber ?? "", avatarUrl));
            if (error is not null) return BadRequest(new { message = error });

            return Ok(updatedUser);
        }
        catch (System.Exception ex)
        {
            return StatusCode(500, new { message = $"Lỗi xử lý server: {ex.Message}" });
        }
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Append("jwt", "", new CookieOptions
        {
            HttpOnly = true,
            Secure = false,
            SameSite = SameSiteMode.Strict,
            Expires = DateTimeOffset.UtcNow.AddDays(-1)
        });
        return Ok(new { message = "Đăng xuất thành công" });
    }
}
