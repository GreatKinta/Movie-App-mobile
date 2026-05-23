using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MySqlConnector;
using WebPhimApi.DTOs;
using WebPhimApi.Services;

namespace WebPhimApi.Controllers;

[ApiController]
[Route("api/admin/bookings")]
[Authorize(Roles = "admin,staff")]
public class AdminBookingController(AdminBookingService adminBookingService) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> BookAtCounter([FromBody] AdminBookingRequest request)
    {
        try
        {
            var response = await adminBookingService.BookTicketsAtCounterAsync(request);
            return Ok(response);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

[ApiController]
[Route("api/admin/tickets")]
[Authorize(Roles = "admin,staff")]
public class AdminTicketController(AdminTicketService adminTicketService) : ControllerBase
{
    [HttpPost("scan")]
    public async Task<IActionResult> ScanTicket([FromBody] TicketScanRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        try
        {
            var result = await adminTicketService.ScanTicketAsync(request.OrderCode);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ROOM CONTROLLER — Quản lý rạp & sơ đồ ghế
// ─────────────────────────────────────────────────────────────────────────────

/// <summary>
/// Quản lý Rạp chiếu phim và Sơ đồ Ghế dành cho Admin.
/// Tất cả dữ liệu đọc/ghi trực tiếp DB qua AppDbContext (EF Core async).
/// </summary>
[ApiController]
[Route("api/admin/rooms")]
[Authorize(Roles = "admin,staff")]
public class AdminRoomController(IAdminRoomService roomService) : ControllerBase
{
    // GET /api/admin/rooms
    // Lấy danh sách rạp có phân trang & tìm kiếm từ DB
    [HttpGet]
    public async Task<IActionResult> GetPagedRooms([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null)
    {
        var result = await roomService.GetPagedRoomsAsync(pageNumber, pageSize, search);
        return Ok(result);
    }

    // GET /api/admin/rooms/all
    // Lấy toàn bộ phòng (không phân trang, dùng cho dropdown)
    [HttpGet("all")]
    public async Task<IActionResult> GetAllRooms()
    {
        var rooms = await roomService.GetAllRoomsAsync();
        return Ok(rooms);
    }

    // GET /api/rooms
    // Lấy toàn bộ phòng công khai
    [HttpGet("/api/rooms")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicRooms()
    {
        var rooms = await roomService.GetAllRoomsAsync();
        return Ok(rooms);
    }

    // GET /api/admin/rooms/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetRoomById(int id)
    {
        var room = await roomService.GetRoomByIdAsync(id);
        return room is null ? NotFound() : Ok(room);
    }

    // PUT /api/admin/rooms/{id}
    [HttpPut("{id:int}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> UpdateRoom(int id, [FromBody] CreateRoomRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var room = await roomService.UpdateRoomAsync(id, request);
        return room is null ? NotFound() : Ok(room);
    }

    // POST /api/admin/rooms
    // Tạo rạp mới + tự động sinh ghế → chỉ admin mới được tạo
    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> CreateRoom([FromBody] CreateRoomRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        try
        {
            var room = await roomService.CreateRoomAsync(request);
            return CreatedAtAction(nameof(GetSeatsByRoomId), new { id = room.RoomId }, room);
        }
        catch (InvalidOperationException ex)
        {
            // VD: Chưa có seat_type nào trong DB
            return BadRequest(new { message = ex.Message });
        }
        catch (DbUpdateException ex) when (ex.InnerException is MySqlException { Number: 1062 })
        {
            // MySQL error 1062 = Duplicate entry (unique constraint vi phạm)
            return Conflict(new { message = "Tên rạp đã tồn tại hoặc vi phạm ràng buộc dữ liệu." });
        }
    }

    // GET /api/admin/rooms/{id}/seats
    // Lấy toàn bộ ghế của rạp (JOIN seat_types)
    [HttpGet("{id:int}/seats")]
    public async Task<IActionResult> GetSeatsByRoomId(int id)
    {
        try
        {
            var seats = await roomService.GetSeatsByRoomIdAsync(id);
            return Ok(seats);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    // GET /api/admin/rooms/seat-types
    // Lấy danh sách loại ghế (dùng cho dropdown cập nhật)
    [HttpGet("seat-types")]
    public async Task<IActionResult> GetSeatTypes()
    {
        var types = await roomService.GetAllSeatTypesAsync();
        return Ok(types);
    }

    // PUT /api/admin/rooms/{id}/seats/types
    // Cập nhật loại ghế hàng loạt cho nhiều ghế cùng lúc → chỉ admin
    [HttpPut("{id:int}/seats/types")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> UpdateSeatTypes(int id, [FromBody] UpdateSeatTypeRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        try
        {
            await roomService.UpdateSeatTypesAsync(id, request);
            return Ok(new { message = "Cập nhật loại ghế thành công." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (DbUpdateException ex) when (ex.InnerException is MySqlException { Number: 1452 })
        {
            // MySQL error 1452 = FK constraint fail (seat_type_id không tồn tại)
            return BadRequest(new { message = "Loại ghế không hợp lệ." });
        }
    }

    // DELETE /api/admin/rooms/{id}
    // Xóa rạp (chỉ admin, kiểm tra suất chiếu trước)
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> DeleteRoom(int id)
    {
        try
        {
            await roomService.DeleteRoomAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (DbUpdateException ex) when (ex.InnerException is MySqlException { Number: 1451 })
        {
            // MySQL error 1451 = FK constraint (có record con đang tham chiếu)
            return Conflict(new { message = "Không thể xóa rạp vì còn dữ liệu liên quan đến rạp này." });
        }
    }
}

[ApiController]
[Route("api/admin/showtimes")]
[Authorize(Roles = "admin,staff")]
public class AdminShowtimeController(ShowtimeService showtimeService) : ControllerBase
{
    // GET /api/admin/showtimes
    [HttpGet]
    public async Task<IActionResult> GetAdminShowtimes([FromQuery] string date, [FromQuery] int? roomId = null)
    {
        var showtimes = await showtimeService.GetAdminShowtimesAsync(date, roomId);
        return Ok(showtimes);
    }

    // POST /api/admin/showtimes
    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> CreateShowtime([FromBody] CreateShowtimeRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var result = await showtimeService.CreateShowtimeAsync(request);
        return result is null ? BadRequest(new { message = "Không tìm thấy phim hoặc phòng." }) : Ok(result);
    }

    // PUT /api/admin/showtimes/{id}
    [HttpPut("{id:int}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> UpdateShowtime(int id, [FromBody] CreateShowtimeRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var result = await showtimeService.UpdateShowtimeAsync(id, request);
        return result is null ? NotFound(new { message = "Suất chiếu, phim hoặc phòng không hợp lệ." }) : Ok(result);
    }

    // DELETE /api/admin/showtimes/{id}
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> CancelShowtime(int id)
    {
        var result = await showtimeService.CancelShowtimeAsync(id);
        return result ? Ok(new { message = "Đã hủy suất chiếu." }) : NotFound();
    }

    // POST /api/admin/showtimes/auto-generate
    [HttpPost("auto-generate")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> AutoGenerate([FromBody] AutoGenerateShowtimesRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        try
        {
            await showtimeService.AutoGenerateShowtimesAsync(request);
            return Ok(new { message = "Tạo lịch tự động thành công!" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // POST /api/admin/showtimes/{id}/publish
    [HttpPost("{id:int}/publish")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> PublishShowtime(int id)
    {
        return Ok(new { message = "Đã xuất bản suất chiếu lên website!" });
    }
}

[ApiController]
[Route("api/admin/seats")]
[Authorize(Roles = "admin,staff")]
public class AdminSeatController(IAdminRoomService roomService) : ControllerBase
{
    // GET /api/admin/seats/room/{roomId}
    [HttpGet("room/{roomId:int}")]
    public async Task<IActionResult> GetSeatsByRoom(int roomId)
    {
        try
        {
            var seats = await roomService.GetSeatsByRoomIdAsync(roomId);
            return Ok(seats);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    // GET /api/admin/seats/types
    [HttpGet("types")]
    public async Task<IActionResult> GetSeatTypes()
    {
        var types = await roomService.GetAllSeatTypesAsync();
        return Ok(types);
    }

    // PUT /api/admin/seats/room/{roomId}/map
    [HttpPut("room/{roomId:int}/map")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> UpdateSeatMap(int roomId, [FromBody] UpdateSeatTypeRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        try
        {
            await roomService.UpdateSeatTypesAsync(roomId, request);
            return Ok(new { message = "Lưu sơ đồ ghế thành công!" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    // POST /api/admin/seats/room/{roomId}/generate
    [HttpPost("room/{roomId:int}/generate")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> GenerateSeatMap(int roomId, [FromBody] GenerateSeatGridRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        try
        {
            await roomService.GenerateSeatGridAsync(roomId, request.Rows, request.Columns);
            return Ok(new { message = "Khởi tạo sơ đồ ghế thành công!" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // DELETE /api/admin/seats/room/{roomId}
    [HttpDelete("room/{roomId:int}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> ClearSeatMap(int roomId)
    {
        try
        {
            await roomService.ClearSeatGridAsync(roomId);
            return Ok(new { message = "Đã xoá sơ đồ ghế thành công!" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}

public class GenerateSeatGridRequest
{
    public int Rows { get; set; }
    public int Columns { get; set; }
}
