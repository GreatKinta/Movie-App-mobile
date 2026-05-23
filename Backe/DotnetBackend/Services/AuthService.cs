using Microsoft.EntityFrameworkCore;
using WebPhimApi.Configuration;
using WebPhimApi.Data;
using WebPhimApi.DTOs;
using WebPhimApi.Entities;

namespace WebPhimApi.Services;

public class AuthService(AppDbContext db, JwtService jwtService)
{
    public async Task<(AuthResponse? token, string? error)> LoginAsync(LoginRequest request)
    {
        var user = await db.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email || u.Username == request.Email);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return (null, "Email hoặc mật khẩu không đúng");

        var token = jwtService.GenerateToken(user);
        return (new AuthResponse(token), null);
    }

    public async Task<(AuthResponse? token, string? error)> RegisterAsync(RegisterRequest request)
    {
        if (await db.Users.AnyAsync(u => u.Username == request.Username))
            return (null, "Username đã tồn tại");

        if (await db.Users.AnyAsync(u => u.Email == request.Email))
            return (null, "Email đã được sử dụng");

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FullName = request.FullName,
            PhoneNumber = request.PhoneNumber,
            Role = UserRole.customer,
            CreatedAt = DateTime.UtcNow
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        var token = jwtService.GenerateToken(user);
        return (new AuthResponse(token), null);
    }

    public async Task<UserInfoResponse?> GetMeAsync(int userId)
    {
        var user = await db.Users.FindAsync(userId);
        if (user is null) return null;

        return new UserInfoResponse(
            user.UserId, user.Username, user.Email,
            user.FullName, user.PhoneNumber, user.AvatarUrl, user.Role.ToString()
        );
    }

    public async Task<(UserInfoResponse? response, string? error)> UpdateProfileAsync(int userId, UpdateProfileRequest request)
    {
        var user = await db.Users.FindAsync(userId);
        if (user is null) return (null, "Không tìm thấy người dùng");

        user.FullName = request.FullName;
        user.PhoneNumber = request.PhoneNumber;
        if (request.AvatarUrl != null)
        {
            user.AvatarUrl = request.AvatarUrl;
        }

        db.Users.Update(user);
        await db.SaveChangesAsync();

        return (new UserInfoResponse(
            user.UserId, user.Username, user.Email,
            user.FullName, user.PhoneNumber, user.AvatarUrl, user.Role.ToString()
        ), null);
    }
}
