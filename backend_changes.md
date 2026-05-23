# Tổng hợp các thay đổi tại Backend (ASP.NET Core)

Để đáp ứng cho phần tích hợp ứng dụng Mobile (React Native - Expo), một số thay đổi và tinh chỉnh đã được thực hiện ở cấu trúc của Backend nhằm chuẩn hóa luồng dữ liệu truyền xuống Mobile mượt mà và đầy đủ hơn.

Dưới đây là chi tiết các tệp đã được cập nhật:

## 1. DTOs - `ShowtimeDtos.cs`
**Tệp**: `Backe/DotnetBackend/DTOs/ShowtimeDtos.cs`

Rút gọn và gộp nhóm các suất chiếu (showtimes) theo từng bộ phim. Điều này rất cần thiết cho màn hình **Lịch Chiếu** của Mobile, nơi hiển thị 1 bộ Phim kèm nhiều khung giờ bên trong.

Nội dung đã được thêm mới:
```csharp
// Đối tượng đại diện cho một lịch chiếu cơ bản
public record ShowtimeBasicInfo(
    int Id,
    DateTime StartTime,
    string RoomName
);

// Đối tượng Gom nhóm toàn bộ dữ liệu Phim và các Lịch chiếu đi kèm
public record MovieWithShowtimesResponse(
    int Id,
    string Title,
    string Poster,
    int Duration,
    string Genre,
    string AgeRating,
    List<ShowtimeBasicInfo> Showtimes
);
```

## 2. Services - `ShowtimeService.cs`
**Tệp**: `Backe/DotnetBackend/Services/ShowtimeService.cs`

Bổ sung tham số bộ lọc (`date`) và logic nhóm dữ liệu (`GroupBy`). 
- **Với chi tiết phim**: Ứng dụng di động cần tuỳ chọn ngày cụ thể để xem các lịch chiếu tương lai.
- **Với trang lịch chiếu tổng hợp**: Lấy tất cả lịch chiếu trong ngày được chọn, loại bỏ các suất chiếu đã trôi qua.

Thay đổi cụ thể:
1. Sửa hàm `GetByMovieAsync(int movieId)` thành `GetByMovieAsync(int movieId, string? date)`. Logic giờ đây sẽ parse `date` và bổ sung lệnh lập trình LINQ để filter các suất chiếu chỉ trong ngày hôm đó (nếu `date` có tồn tại).
2. Thêm hàm mới **`GetByDateAsync(string date)`**: Hàm này query toàn bộ các `Showtime` diễn ra trong ngày truyền vào (và >= thời gian hiện tại), mang theo thông tin Phòng (`Room`) và Phim (`Movie`), sau đó `.GroupBy(s => s.Movie)` để gộp thông tin trả về duy nhất 1 item Phim đi kèm danh sách Giờ Chiếu trực thuộc thông qua `MovieWithShowtimesResponse` DTO đã định nghĩa ở trên.

## 3. Controllers - `ShowtimeController.cs`
**Tệp**: `Backe/DotnetBackend/Controllers/ShowtimeController.cs`

Khai báo các bộ điều hướng HTTP tương ứng để mở đường API đáp ứng cho các logic Service được tạo thêm.

Thay đổi cụ thể:
1. **Thay đổi Route GetByMovie**: Sửa `[HttpGet("movie/{movieId}")]` để chấp nhận thêm một lựa chọn query params `?date=...`. Nếu client không cung cấp, nó sẽ xử lý mặc định trả tất cả.
2. **Thêm mới Route GetByDate**: Bổ sung endpoint `[HttpGet("date/{date}")]` nhận Data truyền từ tab Lịch Chiếu - Schedule trên điện thoại.

---
> Kết quả: Nhờ ba thay đổi tập trung này, các logic dành cho API hệ thống website cũ không bị ảnh hưởng, giữ nguyên được Frontend Web hoạt động bình thường, và đồng thời khai mở API nhóm dữ liệu chuẩn Rest API riêng cho màn hình Mobile tiêu thụ dễ dàng thông qua mapper `camelCase`.
