using Microsoft.EntityFrameworkCore;
using WebPhimApi.Data;
using WebPhimApi.DTOs;
using WebPhimApi.Entities;

namespace WebPhimApi.Services;

public interface IAdminRoomService
{
    Task<List<RoomResponse>> GetAllRoomsAsync();
    Task<PagedResult<RoomResponse>> GetPagedRoomsAsync(int pageNumber, int pageSize, string? search);
    Task<RoomResponse?> GetRoomByIdAsync(int roomId);
    Task<RoomResponse?> UpdateRoomAsync(int roomId, CreateRoomRequest request);
    Task<RoomResponse> CreateRoomAsync(CreateRoomRequest request);
    Task<List<SeatResponse>> GetSeatsByRoomIdAsync(int roomId);
    Task<List<SeatTypeResponse>> GetAllSeatTypesAsync();
    Task UpdateSeatTypesAsync(int roomId, UpdateSeatTypeRequest request);
    Task DeleteRoomAsync(int roomId);
    Task GenerateSeatGridAsync(int roomId, int rows, int columns);
    Task ClearSeatGridAsync(int roomId);
}

public class AdminRoomService(AppDbContext context) : IAdminRoomService
{
    // ─── GET: Tất cả rạp ─────────────────────────────────────────
    public async Task<List<RoomResponse>> GetAllRoomsAsync()
    {
        return await context.Rooms
            .OrderBy(r => r.RoomId)
            .Select(r => new RoomResponse
            {
                RoomId    = r.RoomId,
                Name      = r.Name,
                TotalSeats = r.TotalSeats,
                Status    = r.Status.ToString()
            })
            .ToListAsync();
    }

    // ─── GET: Phân trang phòng ────────────────────────────────────
    public async Task<PagedResult<RoomResponse>> GetPagedRoomsAsync(int pageNumber, int pageSize, string? search)
    {
        var query = context.Rooms.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(r => r.Name.Contains(search));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderBy(r => r.RoomId)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new RoomResponse
            {
                RoomId    = r.RoomId,
                Name      = r.Name,
                TotalSeats = r.TotalSeats,
                Status    = r.Status.ToString()
            })
            .ToListAsync();

        return new PagedResult<RoomResponse>
        {
            Items = items,
            TotalCount = totalCount,
            Page = pageNumber,
            PageSize = pageSize
        };
    }

    // ─── GET: Chi tiết một phòng ──────────────────────────────────
    public async Task<RoomResponse?> GetRoomByIdAsync(int roomId)
    {
        var r = await context.Rooms.FindAsync(roomId);
        if (r is null) return null;

        return new RoomResponse
        {
            RoomId    = r.RoomId,
            Name      = r.Name,
            TotalSeats = r.TotalSeats,
            Status    = r.Status.ToString()
        };
    }

    // ─── PUT: Cập nhật phòng ──────────────────────────────────────
    public async Task<RoomResponse?> UpdateRoomAsync(int roomId, CreateRoomRequest request)
    {
        var room = await context.Rooms.FindAsync(roomId);
        if (room is null) return null;

        room.Name = request.Name;
        room.TotalSeats = request.TotalSeats;
        room.Status = request.Status;

        await context.SaveChangesAsync();

        return new RoomResponse
        {
            RoomId    = room.RoomId,
            Name      = room.Name,
            TotalSeats = room.TotalSeats,
            Status    = room.Status.ToString()
        };
    }

    // ─── POST: Tạo rạp + sinh ghế tự động ────────────────────────
    public async Task<RoomResponse> CreateRoomAsync(CreateRoomRequest request)
    {
        // 1. Lấy seat_type mặc định từ DB (ưu tiên tên "Thường", nếu không thì lấy đầu tiên)
        var defaultSeatType = await context.SeatTypes
            .OrderBy(st => st.Name == "Thường" ? 0 : 1)
            .ThenBy(st => st.SeatTypeId)
            .FirstOrDefaultAsync()
            ?? throw new InvalidOperationException("Chưa có loại ghế nào trong hệ thống. Vui lòng thêm seat_type trước.");

        // 2. Thêm Room vào DB để lấy room_id (auto-increment)
        var room = new Room
        {
            Name       = request.Name,
            TotalSeats = request.TotalSeats,
            Status     = request.Status
        };

        await context.Rooms.AddAsync(room);
        await context.SaveChangesAsync(); // → room.RoomId được gán sau bước này

        // 3. Thuật toán sinh ghế
        var seats = GenerateSeats(room.RoomId, request.TotalSeats, request.SeatsPerRow, defaultSeatType.SeatTypeId);

        await context.Seats.AddRangeAsync(seats);
        await context.SaveChangesAsync();

        return new RoomResponse
        {
            RoomId     = room.RoomId,
            Name       = room.Name,
            TotalSeats = room.TotalSeats,
            Status     = room.Status.ToString()
        };
    }

    // ─── GET: Sơ đồ ghế của một rạp (JOIN seat_types) ────────────
    public async Task<List<SeatResponse>> GetSeatsByRoomIdAsync(int roomId)
    {
        // Kiểm tra rạp tồn tại
        var roomExists = await context.Rooms.AnyAsync(r => r.RoomId == roomId);
        if (!roomExists)
            throw new KeyNotFoundException($"Không tìm thấy rạp có ID = {roomId}");

        return await context.Seats
            .Where(s => s.RoomId == roomId)
            .Include(s => s.SeatType)                // JOIN seat_types
            .OrderBy(s => s.RowName)
            .ThenBy(s => s.SeatNumber)
            .Select(s => new SeatResponse
            {
                SeatId       = s.SeatId,
                RoomId       = s.RoomId,
                RowName      = s.RowName,
                SeatNumber   = s.SeatNumber,
                SeatType     = new SeatTypeResponse
                {
                    SeatTypeId = s.SeatTypeId,
                    Name       = s.SeatType.Name,
                    Surcharge  = s.SeatType.Surcharge
                }
            })
            .ToListAsync();
    }

    // ─── GET: Tất cả loại ghế (để client hiển thị dropdown) ──────
    public async Task<List<SeatTypeResponse>> GetAllSeatTypesAsync()
    {
        return await context.SeatTypes
            .OrderBy(st => st.SeatTypeId)
            .Select(st => new SeatTypeResponse
            {
                SeatTypeId = st.SeatTypeId,
                Name       = st.Name,
                Surcharge  = st.Surcharge
            })
            .ToListAsync();
    }

    // ─── PUT: Cập nhật loại ghế hàng loạt ────────────────────────
    public async Task UpdateSeatTypesAsync(int roomId, UpdateSeatTypeRequest request)
    {
        // Kiểm tra rạp tồn tại
        var room = await context.Rooms.FindAsync(roomId)
            ?? throw new KeyNotFoundException($"Không tìm thấy rạp có ID = {roomId}");

        // Xoá ghế (nếu SeatTypeId == -1)
        var seatIdsToDelete = request.Seats
            .Where(s => s.SeatTypeId == -1)
            .Select(s => s.SeatId)
            .ToList();

        if (seatIdsToDelete.Count > 0)
        {
            var seatsToDelete = await context.Seats
                .Where(s => s.RoomId == roomId && seatIdsToDelete.Contains(s.SeatId))
                .ToListAsync();

            if (seatsToDelete.Count > 0)
            {
                context.Seats.RemoveRange(seatsToDelete);
            }
        }

        // Cập nhật loại ghế
        var updateMap = request.Seats
            .Where(s => s.SeatTypeId != -1)
            .ToDictionary(s => s.SeatId, s => s.SeatTypeId);

        if (updateMap.Count > 0)
        {
            var seatIdsToUpdate = updateMap.Keys.ToList();

            var seatsToUpdate = await context.Seats
                .Where(s => s.RoomId == roomId && seatIdsToUpdate.Contains(s.SeatId))
                .ToListAsync();

            // Kiểm tra các SeatTypeId có hợp lệ không
            var requestedTypeIds = updateMap.Values.Distinct().ToList();
            var validTypeIds = await context.SeatTypes
                .Where(st => requestedTypeIds.Contains(st.SeatTypeId))
                .Select(st => st.SeatTypeId)
                .ToListAsync();

            var invalidIds = requestedTypeIds.Except(validTypeIds).ToList();
            if (invalidIds.Count > 0)
                throw new KeyNotFoundException($"Loại ghế không tồn tại: {string.Join(", ", invalidIds)}");

            // Cập nhật SeatTypeId
            foreach (var seat in seatsToUpdate)
            {
                seat.SeatTypeId = updateMap[seat.SeatId];
            }
        }

        await context.SaveChangesAsync();

        // Cập nhật tổng số ghế trong rạp thực tế
        var actualSeatsCount = await context.Seats.CountAsync(s => s.RoomId == roomId);
        room.TotalSeats = actualSeatsCount;
        await context.SaveChangesAsync();
    }

    public async Task GenerateSeatGridAsync(int roomId, int rows, int columns)
    {
        var room = await context.Rooms.FindAsync(roomId)
            ?? throw new KeyNotFoundException($"Không tìm thấy rạp có ID = {roomId}");

        var defaultSeatType = await context.SeatTypes
            .OrderBy(st => st.Name == "Thường" ? 0 : 1)
            .ThenBy(st => st.SeatTypeId)
            .FirstOrDefaultAsync()
            ?? throw new InvalidOperationException("Chưa có loại ghế nào trong hệ thống. Vui lòng thêm seat_type trước.");

        // Clear existing seats
        var existingSeats = await context.Seats.Where(s => s.RoomId == roomId).ToListAsync();
        context.Seats.RemoveRange(existingSeats);
        await context.SaveChangesAsync();

        // Generate grid
        var seats = new List<Seat>();
        for (int r = 0; r < rows; r++)
        {
            var rowLabel = GenerateRowLabel(r);
            for (int c = 1; c <= columns; c++)
            {
                seats.Add(new Seat
                {
                    RoomId = roomId,
                    RowName = rowLabel,
                    SeatNumber = c,
                    SeatTypeId = defaultSeatType.SeatTypeId
                });
            }
        }

        await context.Seats.AddRangeAsync(seats);
        room.TotalSeats = rows * columns;
        await context.SaveChangesAsync();
    }

    public async Task ClearSeatGridAsync(int roomId)
    {
        var room = await context.Rooms.FindAsync(roomId)
            ?? throw new KeyNotFoundException($"Không tìm thấy rạp có ID = {roomId}");

        var seats = await context.Seats.Where(s => s.RoomId == roomId).ToListAsync();
        context.Seats.RemoveRange(seats);
        room.TotalSeats = 0;
        await context.SaveChangesAsync();
    }

    // ─── DELETE: Xóa rạp ──────────────────────────────────────────
    public async Task DeleteRoomAsync(int roomId)
    {
        var room = await context.Rooms.FindAsync(roomId)
            ?? throw new KeyNotFoundException($"Không tìm thấy rạp có ID = {roomId}");

        // Kiểm tra có suất chiếu nào thuộc rạp này không
        var hasShowtimes = await context.Showtimes.AnyAsync(sh => sh.RoomId == roomId);
        if (hasShowtimes)
            throw new InvalidOperationException("Không thể xóa rạp đang có lịch chiếu. Hãy hủy các suất chiếu trước.");

        // EF Core sẽ cascade delete các seats (seats có FK → rooms)
        context.Rooms.Remove(room);
        await context.SaveChangesAsync();
    }

    // ─── PRIVATE: Thuật toán sinh ghế ────────────────────────────
    /// <summary>
    /// Sinh danh sách ghế cho một rạp.
    /// Công thức: totalSeats / seatsPerRow → số hàng, ghế trong hàng cuối có thể ít hơn.
    /// Nhãn hàng: A, B, ..., Z, AA, AB, ... (đảm bảo ≤ 2 ký tự = char(2) của MySQL)
    /// </summary>
    private static List<Seat> GenerateSeats(int roomId, int totalSeats, int seatsPerRow, int defaultSeatTypeId)
    {
        var seats = new List<Seat>(totalSeats);
        var generated = 0;
        var rowIndex  = 0;

        while (generated < totalSeats)
        {
            var rowLabel      = GenerateRowLabel(rowIndex);
            var seatsInRow    = Math.Min(seatsPerRow, totalSeats - generated);

            for (var seatNum = 1; seatNum <= seatsInRow; seatNum++)
            {
                seats.Add(new Seat
                {
                    RoomId      = roomId,
                    RowName     = rowLabel,
                    SeatNumber  = seatNum,
                    SeatTypeId  = defaultSeatTypeId
                });
            }

            generated += seatsInRow;
            rowIndex++;
        }

        return seats;
    }

    /// <summary>
    /// Chuyển đổi index (0-based) → nhãn chữ cái hàng.
    /// 0=A, 1=B, ..., 25=Z, 26=AA, 27=AB, ..., 51=AZ, 52=BA, ...
    /// Trả về tối đa 2 ký tự (đúng với char(2) của MySQL).
    /// </summary>
    private static string GenerateRowLabel(int index)
    {
        // Vòng 1 (0-25): A → Z  (1 ký tự)
        if (index < 26)
            return ((char)('A' + index)).ToString();

        // Vòng 2 (26-701): AA → ZZ  (2 ký tự, base-26)
        index -= 26;
        var first  = (char)('A' + index / 26);
        var second = (char)('A' + index % 26);
        return $"{first}{second}";

        // Nếu vượt quá ZZ (>701 hàng) thì throw (700 hàng × 1 ghế/hàng = 700 ghế max — đủ dùng)
    }
}
