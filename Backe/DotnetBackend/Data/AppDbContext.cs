using Microsoft.EntityFrameworkCore;
using WebPhimApi.Entities;

namespace WebPhimApi.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Movie> Movies => Set<Movie>();
    public DbSet<Room> Rooms => Set<Room>();
    public DbSet<SeatType> SeatTypes => Set<SeatType>();
    public DbSet<Seat> Seats => Set<Seat>();
    public DbSet<Showtime> Showtimes => Set<Showtime>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<BookingSeat> BookingSeats => Set<BookingSeat>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Unique constraints
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username).IsUnique();
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email).IsUnique();

        modelBuilder.Entity<Order>()
            .HasIndex(o => o.OrderCode).IsUnique();

        // Composite unique: room + row + number
        modelBuilder.Entity<Seat>()
            .HasIndex(s => new { s.RoomId, s.RowName, s.SeatNumber })
            .IsUnique()
            .HasDatabaseName("uq_room_seat");

        // Composite unique: showtime + seat
        modelBuilder.Entity<BookingSeat>()
            .HasIndex(bs => new { bs.ShowtimeId, bs.SeatId })
            .IsUnique()
            .HasDatabaseName("uq_showtime_seat");

        // Enum conversions
        modelBuilder.Entity<User>()
            .Property(u => u.Role)
            .HasConversion<string>();

        modelBuilder.Entity<Movie>()
            .Property(m => m.Status)
            .HasConversion<string>();

        modelBuilder.Entity<Room>()
            .Property(r => r.Status)
            .HasConversion<string>();

        modelBuilder.Entity<Showtime>()
            .Property(s => s.Status)
            .HasConversion<string>();

        modelBuilder.Entity<Order>()
            .Property(o => o.Status)
            .HasConversion<string>();

        // Auto-update timestamps removed to prevent DBNull cast exception on INSERT,
        // since EF Core will now explicitly send the CreatedAt and UpdatedAt values defined in the Order object.
    }
}
