using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using WebPhimApi.Data;
using WebPhimApi.DTOs;

namespace WebPhimApi.Services;

public class ShowtimeService(AppDbContext db, IConnectionMultiplexer redis)
{
    private IDatabase Cache => redis.GetDatabase();

    public async Task<List<ShowtimeDetailResponse>> GetAllAsync() =>
        await db.Showtimes
            .Include(s => s.Movie)
            .Include(s => s.Room)
            .Select(s => ToResponse(s))
            .ToListAsync();

    public async Task<List<ShowtimeDetailResponse>> GetByMovieAsync(int movieId, string? date = null)
    {
        var query = db.Showtimes
            .Include(s => s.Movie)
            .Include(s => s.Room)
            .Where(s => s.MovieId == movieId);

        if (!string.IsNullOrEmpty(date) && DateTime.TryParseExact(date, "yyyy-MM-dd", null, System.Globalization.DateTimeStyles.None, out var parsedDate))
        {
            query = query.Where(s => s.StartTime.Date == parsedDate.Date);
        }

        return await query.Select(s => ToResponse(s)).ToListAsync();
    }

    public async Task<List<MovieWithShowtimesResponse>> GetByDateAsync(string date)
    {
        if (!DateTime.TryParseExact(date, "yyyy-MM-dd", null, System.Globalization.DateTimeStyles.None, out var parsedDate))
        {
            return [];
        }

        var showtimes = await db.Showtimes
            .Include(s => s.Movie)
            .Include(s => s.Room)
            .Where(s => s.StartTime.Date == parsedDate.Date)
            .ToListAsync();

        return showtimes.GroupBy(s => s.Movie)
            .Select(g => new MovieWithShowtimesResponse(
                g.Key.MovieId,
                g.Key.Title,
                g.Key.Poster,
                g.Key.Duration,
                g.Key.Genre,
                g.Key.AgeRating,
                g.Select(s => new ShowtimeBasicInfo(
                    s.ShowtimeId, 
                    s.StartTime, 
                    s.Room.Name, 
                    s.Status == Entities.ShowtimeStatus.cancelled || s.Status == Entities.ShowtimeStatus.completed || DateTime.Now > s.StartTime.AddMinutes(15)
                )).ToList()
            ))
            .ToList();
    }

    public async Task<ShowtimeDetailResponse?> GetDetailAsync(int showtimeId)
    {
        var s = await db.Showtimes
            .Include(s => s.Movie)
            .Include(s => s.Room)
            .FirstOrDefaultAsync(s => s.ShowtimeId == showtimeId);

        return s is null ? null : ToResponse(s);
    }

    public async Task<List<SeatStatusResponse>> GetSeatStatusesAsync(int showtimeId)
    {
        var showtime = await db.Showtimes
            .Include(s => s.Room)
            .FirstOrDefaultAsync(s => s.ShowtimeId == showtimeId)
            ?? throw new KeyNotFoundException($"Showtime {showtimeId} không tồn tại");

        var seats = await db.Seats
            .Include(s => s.SeatType)
            .Where(s => s.RoomId == showtime.Room.RoomId)
            .ToListAsync();

        var redisHashKey = $"showtime:{showtimeId}:seats";
        var responses = new List<SeatStatusResponse>();

        foreach (var seat in seats)
        {
            var seatKey = $"{seat.RowName}{seat.SeatNumber}";
            var redisStatus = await Cache.HashGetAsync(redisHashKey, seatKey);
            var status = redisStatus.HasValue ? redisStatus.ToString() : "AVAILABLE";

            var price = showtime.BasePrice + seat.SeatType.Surcharge;
            responses.Add(new SeatStatusResponse(
                seat.SeatId, seat.RowName, seat.SeatNumber,
                status, seat.SeatType.Name, price
            ));
        }

        return responses;
    }

    public async Task<List<AdminShowtimeResponse>> GetAdminShowtimesAsync(string date, int? roomId)
    {
        if (!DateTime.TryParseExact(date, "yyyy-MM-dd", null, System.Globalization.DateTimeStyles.None, out var parsedDate))
        {
            return [];
        }

        var query = db.Showtimes
            .Include(s => s.Movie)
            .Include(s => s.Room)
            .Where(s => s.StartTime.Date == parsedDate.Date);

        if (roomId.HasValue)
        {
            query = query.Where(s => s.RoomId == roomId.Value);
        }

        var list = await query.ToListAsync();
        
        var responseList = new List<AdminShowtimeResponse>();
        foreach (var s in list)
        {
            var soldCount = await db.BookingSeats.CountAsync(bs => bs.ShowtimeId == s.ShowtimeId);
            responseList.Add(new AdminShowtimeResponse
            {
                ShowtimeId = s.ShowtimeId,
                MovieId = s.MovieId,
                MovieTitle = s.Movie.Title,
                RoomName = s.Room.Name,
                RoomId = s.RoomId,
                StartTime = s.StartTime,
                EndTime = s.EndTime ?? s.StartTime.AddMinutes(s.Movie.Duration ?? 90),
                Duration = s.Movie.Duration ?? 90,
                BasePrice = s.BasePrice,
                Status = s.Status.ToString().ToLower(),
                SoldSeats = soldCount,
                TotalSeats = s.Room.TotalSeats ?? 0
            });
        }

        return responseList;
    }

    public async Task<AdminShowtimeResponse?> CreateShowtimeAsync(CreateShowtimeRequest request)
    {
        var movie = await db.Movies.FindAsync(request.MovieId);
        var room = await db.Rooms.FindAsync(request.RoomId);
        if (movie is null || room is null) return null;

        var duration = movie.Duration ?? 90;
        var endTime = request.StartTime.AddMinutes(duration + request.BufferTimeMinutes);

        var showtime = new Entities.Showtime
        {
            MovieId = request.MovieId,
            RoomId = request.RoomId,
            StartTime = request.StartTime,
            EndTime = endTime,
            BufferTimeMinutes = request.BufferTimeMinutes,
            BasePrice = request.BasePrice,
            Status = Entities.ShowtimeStatus.active
        };

        await db.Showtimes.AddAsync(showtime);
        await db.SaveChangesAsync();

        return new AdminShowtimeResponse
        {
            ShowtimeId = showtime.ShowtimeId,
            MovieId = showtime.MovieId,
            MovieTitle = movie.Title,
            RoomName = room.Name,
            RoomId = showtime.RoomId,
            StartTime = showtime.StartTime,
            EndTime = showtime.EndTime.Value,
            Duration = duration,
            BasePrice = showtime.BasePrice,
            Status = "active",
            SoldSeats = 0,
            TotalSeats = room.TotalSeats ?? 0
        };
    }

    public async Task<AdminShowtimeResponse?> UpdateShowtimeAsync(int id, CreateShowtimeRequest request)
    {
        var showtime = await db.Showtimes
            .Include(s => s.Movie)
            .Include(s => s.Room)
            .FirstOrDefaultAsync(s => s.ShowtimeId == id);
        if (showtime is null) return null;

        var movie = await db.Movies.FindAsync(request.MovieId);
        var room = await db.Rooms.FindAsync(request.RoomId);
        if (movie is null || room is null) return null;

        var duration = movie.Duration ?? 90;
        var endTime = request.StartTime.AddMinutes(duration + request.BufferTimeMinutes);

        showtime.MovieId = request.MovieId;
        showtime.RoomId = request.RoomId;
        showtime.StartTime = request.StartTime;
        showtime.EndTime = endTime;
        showtime.BufferTimeMinutes = request.BufferTimeMinutes;
        showtime.BasePrice = request.BasePrice;

        await db.SaveChangesAsync();

        var soldCount = await db.BookingSeats.CountAsync(bs => bs.ShowtimeId == showtime.ShowtimeId);

        return new AdminShowtimeResponse
        {
            ShowtimeId = showtime.ShowtimeId,
            MovieId = showtime.MovieId,
            MovieTitle = movie.Title,
            RoomName = room.Name,
            RoomId = showtime.RoomId,
            StartTime = showtime.StartTime,
            EndTime = showtime.EndTime.Value,
            Duration = duration,
            BasePrice = showtime.BasePrice,
            Status = showtime.Status.ToString().ToLower(),
            SoldSeats = soldCount,
            TotalSeats = room.TotalSeats ?? 0
        };
    }

    public async Task<bool> CancelShowtimeAsync(int id)
    {
        var showtime = await db.Showtimes.FindAsync(id);
        if (showtime is null) return false;

        showtime.Status = Entities.ShowtimeStatus.cancelled;
        await db.SaveChangesAsync();
        return true;
    }

    public async Task AutoGenerateShowtimesAsync(AutoGenerateShowtimesRequest request)
    {
        var movie = await db.Movies.FindAsync(request.MovieId)
            ?? throw new KeyNotFoundException("Không tìm thấy phim.");

        var duration = movie.Duration ?? 90;
        var totalSlotMinutes = duration + request.CleaningMinutes;

        // Parse date and open/close times
        if (!DateTime.TryParseExact($"{request.Date} {request.OpenTime}", "yyyy-MM-dd HH:mm:ss", null, System.Globalization.DateTimeStyles.None, out var openDateTime))
        {
            throw new ArgumentException("Định dạng ngày hoặc giờ mở cửa không hợp lệ.");
        }

        if (!DateTime.TryParseExact($"{request.Date} {request.CloseTime}", "yyyy-MM-dd HH:mm:ss", null, System.Globalization.DateTimeStyles.None, out var closeDateTime))
        {
            throw new ArgumentException("Định dạng giờ đóng cửa không hợp lệ.");
        }

        foreach (var roomId in request.RoomIds)
        {
            var room = await db.Rooms.FindAsync(roomId);
            if (room is null) continue;

            // Clear any existing active showtimes for this room and date to prevent overlaps
            var existingShowtimes = await db.Showtimes
                .Where(s => s.RoomId == roomId && s.StartTime.Date == openDateTime.Date && s.Status == Entities.ShowtimeStatus.active)
                .ToListAsync();
            
            db.Showtimes.RemoveRange(existingShowtimes);
            await db.SaveChangesAsync();

            var current = openDateTime;
            while (current.AddMinutes(duration) <= closeDateTime)
            {
                var endTime = current.AddMinutes(duration + request.CleaningMinutes);
                var showtime = new Entities.Showtime
                {
                    MovieId = request.MovieId,
                    RoomId = roomId,
                    StartTime = current,
                    EndTime = endTime,
                    BufferTimeMinutes = request.CleaningMinutes,
                    BasePrice = request.BasePrice,
                    Status = Entities.ShowtimeStatus.active
                };

                await db.Showtimes.AddAsync(showtime);
                current = current.AddMinutes(totalSlotMinutes);
            }
        }

        await db.SaveChangesAsync();
    }

    private static ShowtimeDetailResponse ToResponse(Entities.Showtime s) => new(
        s.ShowtimeId, s.MovieId, s.Movie.Title,
        s.Movie.Poster, s.Room.Name, s.StartTime,
        s.BasePrice, s.Movie.Duration, s.Movie.Genre, s.Movie.AgeRating,
        s.Status == Entities.ShowtimeStatus.cancelled || s.Status == Entities.ShowtimeStatus.completed || DateTime.Now > s.StartTime.AddMinutes(15)
    );
}
