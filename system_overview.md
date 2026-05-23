# 📖 TÀI LIỆU HỆ THỐNG: WebPhimMobile

Tài liệu này cung cấp cái nhìn tổng quan về kiến trúc hệ thống, luồng dữ liệu, các nghiệp vụ kinh doanh chính, và tóm tắt những thay đổi đã thực hiện để đảm bảo kết nối xuyên suốt giữa Mobile App (React Native/Expo) và Backend (.NET Core).

---

## 🏗️ 1. Cấu Trúc File & Thư Mục

Dự án được chia thành hai phần chính: Client (Mobile App) và Server (Backend).

### FrontEnd (MyCinemaApp) - React Native Expro
Thư mục chính: `Fronte/MyCinemaApp/` (hoặc `MyCinemaApp/`)
Lõi kiến trúc sử dụng **Expo Router** (file-based routing) và **React Native**.

```text
MyCinemaApp/
├── app/                  # Chứa toàn bộ giao diện và routing (Expo Router)
│   ├── (auth)/           # Route authentication: login.jsx, register.jsx
│   ├── (tabs)/           # Màn hình chính có thanh tab dưới: index (home), profile
│   ├── movie/            # Chi tiết phim: [id].jsx
│   ├── booking/          # Đặt vé & Sơ đồ ghế: [id].jsx
│   ├── payment.jsx       # Thanh toán/Thông tin vé
│   └── ticket.jsx        # Vé điện tử (QR Code, tải ảnh vé)
├── components/           # Các component dùng chung (UI components)
│   ├── common/           # Button, MovieCard, ShowtimeGrid
│   ├── booking/          # SeatMap, BookingSummary
│   └── home/             # BannerSlider
├── constants/            # Cấu hình tĩnh
│   ├── colors.js         # Token màu sắc
│   └── config.js         # API endpoint (API_BASE_URL)
├── context/              # Quản lý State toàn cục bằng React Context
│   └── AuthContext.jsx   # Xử lý lưu, xóa và check Token JWT
└── services/             # Giao tiếp với API ngoài
    └── api.js            # Cấu hình Axios Interceptor tự động nhét Token và xử lý mã lỗi
```

### Backend (DotnetBackend) - ASP.NET Core
Thư mục chính: `Backe/DotnetBackend/`
Lõi kiến trúc sử dụng **ASP.NET Core Web API**, **Entity Framework Core (EF Core)**, và **MySQL**.

```text
DotnetBackend/
├── Controllers/          # API Endpoints (Tiếp nhận request từ Mobile)
│   ├── AuthController.cs # Xác thực, Đăng ký, Đăng nhập
│   ├── MovieController.cs # API lấy phim
│   ├── ShowtimeController.cs # API suất chiếu và ghế
│   └── BookingController.cs # Lưu thông tin Order
├── DTOs/                 # Data Transfer Objects (Hình dáng JSON trao đổi)
│   ├── AuthDtos.cs
│   └── ...
├── Entities/             # Khai báo cấu trúc bảng Database của MySQL
│   ├── User.cs
│   ├── Movie.cs
│   └── Order, Booking, ...
├── Services/             # Chứa toàn bộ Business Logic (Tránh viết code trong Controller)
│   ├── AuthService.cs    # Check password, tạo JWT Token
│   └── BookingService.cs # Logic lock ghế, tính tiền...
├── test-data.sql         # Script tạo tự động dữ liệu mẫu
├── appsettings.json      # Cấu hình Database, JWT, Redis
└── Program.cs            # File khởi chạy server định hình CORS, Service Injection
```

---

## 🔄 2. Luồng Dữ Liệu (Data Flow)

### A. Luồng Đăng nhập (Authentication)
1. **Mobile (`login.jsx`)**: User nhập Email và Password ➔ nhấn Đăng nhập.
2. **Mobile (`AuthContext.jsx`)**: Gửi HTTP POST tới `/api/auth/login`.
3. **Backend (`AuthController`)**: Tiếp nhận DTO (LoginRequest).
4. **Backend (`AuthService`)**: Query DB tìm user qua Email hoặc Username ➔ Verify Bcrypt Hash.
5. **Backend**: Sinh ra `JWT Token` và trả về JSON cho Mobile.
6. **Mobile (`AuthContext`)**: Lưu `JWT Token` vào `SecureStore`. Mọi Request tiếp theo lên API sẽ bị `Axios Interceptor` (`api.js`) chèn thêm header `Authorization: Bearer <Token>`.

### B. Luồng Đặt Vé Phim
1. **Khám phá**: User vào Trang Chủ (`index.jsx`), Mobile fetch `/api/movies`. Backend query bảng `Movies`.
2. **Chọn phim**: User bấm vào một Phim, Mobile điều hướng sang `movie/[id].jsx`.
3. **Tra cứu suất chiếu**: Mobile gửi GET `/api/showtimes/movie/{id}?date=...`. Backend lọc `Showtimes` theo phim và khoảng thời gian, trả về Data.
4. **Sơ đồ ghế**: User chọn 1 suất chiếu, app sang `booking/[id].jsx`. App gọi POST `/api/showtimes/{id}/seats`. Backend join 3 bảng `Rooms`, `Seats`, và `Booking_Seats` để trả về trạng thái ghế (Trống, Đang giữ, Đã mua).
5. **Tạo Đơn (Order)**: User chọn ghế và xác nhận. Mobile gửi POST `/api/bookings` kèm danh sách ID ghế.
6. **Xử lý Transaction**: Backend bắt đầu Database Transaction:
   - Check lại xem ghế còn trống không (đề phòng có người book cùng lúc).
   - Insert vào bảng `Orders` trạng thái `pending`.
   - Insert vào `Booking_Seats` trạng thái lock.
7. **Thanh toán**: App chuyển sang màn hình `payment.jsx` hiển thị mã QR SePay. Sau khi hệ thống webhook của cổng thanh toán báo về Backend thì Backend chuyển trạng thái Order sang `paid`.
8. **Vé điện tử**: Hệ thống xuất vé cứng (QR Code) ở màn hình `ticket.jsx`.

---

## ⚙️ 3. Nghiệp Vụ Cốt Lõi (Business Logic)

*   **Concurrency (Xung đột đặt ghế)**: Để tránh 2 người cùng đặt 1 ghế, Dữ liệu `Booking_Seats` có các Unique Constraint `(ShowtimeId, SeatId)`. Nếu người 2 đến chậm, Database sẽ quăng lỗi và huỷ bỏ giao dịch, báo lỗi phía UI cho Mobile.
*   **Giá Động (Dynamic Pricing)**: Giá của từng ghế không cố định mà bằng: `Giá Base của Suất Chiếu (Showtimes.base_price) + Phụ thu của Loại Ghế (Seat_Types.surcharge)`. Ghế VIP hoặc Couple sẽ luôn đắt hơn ghế Normal.
*   **Giữ Ngôi (Seat Holding Timeout)**: Khi gọi API tạo booking, Order được tạo nhưng nằm ở trạng thái `Pending`. Có 1 job ngầm (hoặc webhook TTL) kiểm tra: nếu sau 10 phút chưa thanh toán thành công (Status != `Paid`), Order sẽ bị đưa về `Expired` và ghế được nhả ra để người khác đặt.
*   **Tính Động Của Ngày Giờ**: Danh sách suất chiếu sẽ được tính toán trên Backend bằng hàm `NOW()`. Các lịch chiếu trong quá khứ sẽ tự động không thể fetch ra cho phép đặt mới. Đó cũng là lý do bạn cần Reset `test-data.sql` để đưa lịch ở quá khứ về tương lai.

---

## 🛠️ 4. Tóm Tắt Các Thay Đổi & Sửa Lỗi Đã Thực Hiện 

Quá trình làm việc với Mobile App và Backend tồn tại một số cấu hình lệch (Mismatches). Các vấn đề đã được khắc phục hoàn toàn như sau:

| Vị trí | Vấn đề ban đầu (Bị Lỗi) | Cách đã khắc phục |
| :--- | :--- | :--- |
| **Network** | Chạy App qua điện thoại thật (LAN) nhưng Backend chỉ rào ở `localhost:8080`. Mobile bị lỗi *Network Request Failed*. | Mở port từ `.NET Backend`. Sửa `launchSettings.json` thành `http://0.0.0.0:8080` để nhận các IP từ mạng LAN. |
| **Network** | Mobile App trỏ Domain vào Emulator (`10.0.2.2`). | Thay URL trong `constants/config.js` sang IP của máy tính (`http://192.168.1.6:8080`). |
| **Register** | Backend `AuthDtos.cs` bắt buộc trường `FullName`. Mobile form chỉ có User/Pass/Email nên Backend từ chối 400 Bad Request. | **Bổ sung input UI** "Họ và tên" trong file `register.jsx`. Đồng thời chỉnh param `phone` thành `phoneNumber` gửi cho Backend. |
| **Login** | Backend chặn Login bằng Tên đăng nhập do Data Annotations `[EmailAddress]` ở trường Email. | Điều chỉnh UI file `login.jsx` bắt buộc nhập `Email` thay vì `Tên tài khoản` để khớp luồng Security chuẩn của Backend. |
| **Profile** | Backend trả Json Node số điện thoại mang tên `phoneNumber` `{"phoneNumber":"..."}`, nhưng App truy xuất bằng `user.phone` nên bị hiển thị "Chưa cập nhật". | Đổi Object call từ `user.phone` thành `user.phoneNumber` ở `profile.jsx` |
| **Booking** | App sử dụng `user.userId` để gán vào Booking DTO, tuy nhiên Backend trả ID ở Json Property `{"id" : ...}`. Kết quả: App gửi User ID rỗng. | Sửa payload ở `booking/[id].jsx` dùng `user.id`. |
| **Ticket Screen** | Package thư viện chụp ảnh màn hình vé `expo-view-shot` đã bị khai tử ở bảng Expo SDK 50+ | Đổi framework chụp ảnh vé điện tử sang gói Native mới: Cài `react-native-view-shot` thay thế. |

*Tài liệu tự động xuất xuất bởi Hệ thống AntiGravity / Deepmind AI Tooling*
