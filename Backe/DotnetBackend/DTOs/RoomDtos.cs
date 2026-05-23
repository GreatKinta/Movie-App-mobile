using System.ComponentModel.DataAnnotations;
using WebPhimApi.Entities;

namespace WebPhimApi.DTOs;

// ─── Requests ────────────────────────────────────────────────

public class CreateRoomRequest
{
    [Required(ErrorMessage = "Tên rạp không được để trống")]
    [MaxLength(50, ErrorMessage = "Tên rạp tối đa 50 ký tự")]
    public string Name { get; set; } = null!;

    [Range(1, 500, ErrorMessage = "Số ghế phải từ 1 đến 500")]
    public int TotalSeats { get; set; }

    /// <summary>Số ghế mỗi hàng để tính số hàng. Mặc định 10.</summary>
    [Range(1, 50, ErrorMessage = "Số ghế mỗi hàng phải từ 1 đến 50")]
    public int SeatsPerRow { get; set; } = 10;

    public RoomStatus Status { get; set; } = RoomStatus.active;
}

public class UpdateSeatTypeRequest
{
    [Required]
    public List<SeatUpdateItem> Seats { get; set; } = [];
}

public class SeatUpdateItem
{
    [Range(1, int.MaxValue)]
    public int SeatId { get; set; }

    [Range(1, int.MaxValue)]
    public int SeatTypeId { get; set; }
}

// ─── Responses ───────────────────────────────────────────────

public class RoomResponse
{
    public int RoomId { get; set; }
    public int Id => RoomId;
    public string Name { get; set; } = null!;
    public int? TotalSeats { get; set; }
    public string Status { get; set; } = null!;
}

public class SeatResponse
{
    public int SeatId { get; set; }
    public int RoomId { get; set; }
    public string RowName { get; set; } = null!;
    public int SeatNumber { get; set; }
    public SeatTypeResponse SeatType { get; set; } = null!;
}

public class SeatTypeResponse
{
    public int SeatTypeId { get; set; }
    public string Name { get; set; } = null!;
    public decimal Surcharge { get; set; }
}
