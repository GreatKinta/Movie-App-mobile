using System.Text;
using dotenv.net;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using StackExchange.Redis;
using WebPhimApi.Configuration;
using WebPhimApi.Data;

// Load .env file
DotEnv.Load();

var builder = WebApplication.CreateBuilder(args);

// ──────────────────────────────────────────────
// 1. CORS  (tương đương CorsConfig.java)
// ──────────────────────────────────────────────
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173"];

builder.Services.AddCors(options =>
{
    options.AddPolicy("WebPhimPolicy", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials());
});

// ──────────────────────────────────────────────
// 2. DATABASE (tương đương Spring Data JPA)
// ──────────────────────────────────────────────
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")!
    .Replace("${DB_HOST}", Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost")
    .Replace("${DB_PORT}", Environment.GetEnvironmentVariable("DB_PORT") ?? "3306")
    .Replace("${DB_NAME}", Environment.GetEnvironmentVariable("DB_NAME") ?? "webphim")
    .Replace("${DB_USER}", Environment.GetEnvironmentVariable("DB_USER") ?? "root")
    .Replace("${DB_PASSWORD}", Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// ──────────────────────────────────────────────
// 3. JWT AUTH (tương đương Spring Security + JwtUtil)
// ──────────────────────────────────────────────
var jwtSettings = new JwtSettings
{
    Secret = Environment.GetEnvironmentVariable("JWT_SECRET")
        ?? builder.Configuration["Jwt:Secret"]
        ?? throw new InvalidOperationException("JWT_SECRET not configured"),
    Issuer = builder.Configuration["Jwt:Issuer"] ?? "WebPhimApi",
    Audience = builder.Configuration["Jwt:Audience"] ?? "WebPhimClient",
    ExpirationDays = int.Parse(builder.Configuration["Jwt:ExpirationDays"] ?? "7")
};

builder.Services.AddSingleton(jwtSettings);
builder.Services.AddSingleton<JwtService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret)),
            ValidateIssuer = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtSettings.Audience,
            ClockSkew = TimeSpan.Zero
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                if (context.Request.Cookies.ContainsKey("jwt"))
                {
                    context.Token = context.Request.Cookies["jwt"];
                }
                return Task.CompletedTask;
            },
            OnChallenge = ctx =>
            {
                ctx.HandleResponse();
                ctx.Response.StatusCode = 401;
                ctx.Response.ContentType = "application/json";
                return ctx.Response.WriteAsync("{\"message\":\"Unauthorized\"}");
            }
        };
    });

builder.Services.AddAuthorization();

// ──────────────────────────────────────────────
// 4. REDIS (tương đương RedisConfig.java)
// ──────────────────────────────────────────────
var redisConfig = builder.Configuration["Redis:ConnectionString"]!
    .Replace("${REDIS_HOST}", Environment.GetEnvironmentVariable("REDIS_HOST") ?? "127.0.0.1")
    .Replace("${REDIS_PORT}", Environment.GetEnvironmentVariable("REDIS_PORT") ?? "6380")
    .Replace("${REDIS_PASSWORD}", Environment.GetEnvironmentVariable("REDIS_PASSWORD") ?? "");

builder.Services.AddSingleton<IConnectionMultiplexer>(
    ConnectionMultiplexer.Connect(redisConfig));

// ──────────────────────────────────────────────
// 5. SERVICES & CONTROLLERS
// ──────────────────────────────────────────────
builder.Services.AddScoped<WebPhimApi.Services.AuthService>();
builder.Services.AddScoped<WebPhimApi.Services.MovieService>();
builder.Services.AddScoped<WebPhimApi.Services.ShowtimeService>();
builder.Services.AddScoped<WebPhimApi.Services.BookingService>();
builder.Services.AddScoped<WebPhimApi.Services.PaymentService>();
builder.Services.AddScoped<WebPhimApi.Services.AdminBookingService>();
builder.Services.AddScoped<WebPhimApi.Services.AdminTicketService>();
builder.Services.AddScoped<WebPhimApi.Services.IAdminRoomService, WebPhimApi.Services.AdminRoomService>();

// Background service: tự động giải phóng ghế khi order hết hạn
builder.Services.AddHostedService<WebPhimApi.Services.BookingCleanupService>();

builder.Services.AddControllers();

// ──────────────────────────────────────────────
// 6. BUILD APP
// ──────────────────────────────────────────────
var app = builder.Build();

app.UseCors("WebPhimPolicy");
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Auto-migrate database column avatar_url if not exists
try
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.ExecuteSqlRaw("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) NULL;");
}
catch (Exception)
{
    // Ignore if column already exists
}

app.Run();
