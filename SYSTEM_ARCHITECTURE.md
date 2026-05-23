# 🏢 Kiến Trúc Hệ Thống Phòng Vé Điện Ảnh - MyCinema

Hệ thống ứng dụng đặt vé xem phim trực tuyến **MyCinema** được xây dựng theo mô hình **Client-Server** hiện đại nhằm đảm bảo khả năng mở rộng (scalability), dễ bảo trì (maintainability), và tối ưu hóa hiệu năng xử lý lượng dữ liệu lớn thời gian thực (đặc biệt là trạng thái ghế ngồi và lịch chiếu). 

Kiến trúc hệ thống bao gồm ba thành phần chính cốt lõi:
1. **Frontend Applications** (Ứng dụng di động cho khách hàng & Trang quản trị cho Admin)
2. **Backend API Server** (Máy chủ xử lý logic nghiệp vụ và cung cấp API RESTful)
3. **Database & Caching** (Hệ thống lưu trữ dữ liệu quan hệ và bộ nhớ đệm siêu tốc)

---

## 1. 📱 Frontend Applications (Mobile App & Admin Web)

Giao diện tương tác trực tiếp với người dùng và ban quản lý rạp phim được chia làm hai phân hệ độc lập:

### A. Frontend Mobile Application (Dành cho Khách hàng)
Ứng dụng di động được phát triển bằng **React Native** kết hợp nền tảng **Expo** (sử dụng **Expo Router** để quản lý routing dạng file-based), hỗ trợ biên dịch đa nền tảng (Android và iOS) nhanh chóng, mượt mà và tối ưu hiệu suất.

* **Nhiệm vụ chính:**
  * Hiển thị giao diện người dùng sống động, trực quan (Curated Color Palettes, Banner Slider phim nổi bật, Sơ đồ ghế 2D sắc nét).
  * Xử lý mượt mà các tương tác người dùng (chạm chọn ghế, vuốt lướt lịch chiếu, xem trailer phim).
  * Gửi yêu cầu dữ liệu (HTTP Request) đến Backend thông qua **Axios** có cấu hình tự động đính kèm Token xác thực JWT.
  * Nhận dữ liệu phản hồi từ Backend để cập nhật tức thì trạng thái ứng dụng.
* **Các chức năng chính cung cấp:**
  * **Đăng ký / Đăng nhập:** Xác thực người dùng, bảo mật phiên làm việc qua Token JWT.
  * **Khám phá Điện ảnh:** Xem danh sách phim đang chiếu/sắp chiếu, xem thông tin chi tiết phim (trailer, đạo diễn, dàn diễn viên, độ tuổi giới hạn).
  * **Tra cứu lịch chiếu:** Lọc danh sách suất chiếu linh hoạt theo ngày.
  * **Đặt vé thông minh (Chọn ghế):** Hiển thị sơ đồ ghế thời gian thực (Ghế Thường/VIP), cơ chế đếm ngược giữ ghế **10 phút** chống giữ ghế ảo.
  * **Thanh toán QR tiện lợi:** Quét mã VietQR (thông qua SePay) chuyển khoản tự động và tự động nhận dạng kết quả.
  * **Vé điện tử (E-Ticket):** Xuất vé điện tử chứa mã QR/Barcode check-in, cho phép xuất ảnh lưu vé vào thư viện điện thoại ngoại tuyến.
  * **Cá nhân hóa:** Quản lý thông tin tài khoản, xem lại toàn bộ lịch sử vé đã đặt kèm trạng thái thanh toán.

### B. Frontend Admin Web (Dành cho Quản trị viên)
Được phát triển trên nền tảng **React** kết hợp công cụ build **Vite**, mang lại tốc độ phản hồi cực nhanh cho các thao tác quản lý quy mô lớn của rạp.

* **Các chức năng quản lý chính:**
  * **Quản lý lịch chiếu:** Tạo suất chiếu thủ công linh hoạt hoặc sử dụng tính năng **Tự động tạo suất chiếu (Auto-Generate)** rải đều lịch chiếu tự động theo giờ mở/đóng cửa và thời gian dọn dẹp phòng chiếu.
  * **Quản lý phòng chiếu & Ghế:** Khởi tạo sơ đồ rạp chiếu phim, định dạng hàng/cột và loại ghế (Standard, VIP).
  * **Kiểm soát & Soát vé:** Quét mã QR Code/Barcode trên vé điện tử của khách hàng để thực hiện check-in soát vé nhanh chóng tại quầy.

---

## 2. ⚡ Backend API Server (.NET 8 Web API)

Máy chủ dịch vụ (API Server) được xây dựng trên nền tảng **ASP.NET Core (C#)** hiện đại, cung cấp hệ thống RESTful API chuẩn hóa, an toàn và bảo mật cao.

* **Nhiệm vụ chính:**
  * **Xử lý logic nghiệp vụ phòng vé phức tạp:** Đảm bảo tính toàn vẹn dữ liệu ghế ngồi (sử dụng Database Transactions để ngăn chặn tuyệt đối lỗi 2 người đặt trùng 1 ghế ngồi cùng một lúc).
  * **Bảo mật và Xác thực:** Mã hóa mật khẩu người dùng bằng công nghệ mã hóa một chiều **BCrypt**, cấp phát và xác thực chữ ký số **JWT Token** cho các yêu cầu API an toàn.
  * **Quản lý và đồng bộ dữ liệu:** Quản lý tập trung toàn bộ dữ liệu người dùng, phim, phòng chiếu, ghế ngồi, suất chiếu và hóa đơn đặt vé.
  * **Tích hợp dịch vụ:** Tích hợp hệ thống quét trạng thái giao dịch tự động nhằm xác nhận trạng thái đơn đặt vé nhanh chóng khi tiền vào tài khoản.
* **Các nhóm API RESTful chính cung cấp:**
  * **Auth API (`/api/auth`):** Đăng nhập, đăng ký, lấy thông tin cá nhân hiện tại.
  * **Movie API (`/api/movies`):** Lấy danh sách phim phân trang, chi tiết phim.
  * **Showtime API (`/api/showtimes`):** Tra cứu suất chiếu theo ngày/phim, trạng thái sơ đồ ghế thời gian thực của phòng chiếu.
  * **Booking API (`/api/bookings`):** Xử lý đặt giữ ghế, tạo mã đơn hàng, lưu hóa đơn vào cơ sở dữ liệu.
  * **Payment API (`/api/payment`):** Kiểm tra trạng thái giao dịch vé, đồng bộ trạng thái đơn hàng.

---

## 3. 🗄️ Database & Caching (MySQL & Redis)

Hệ thống lưu trữ và tối ưu hóa tốc độ truy xuất dữ liệu được thiết kế kết hợp giữa cơ sở dữ liệu quan hệ chặt chẽ và bộ nhớ đệm siêu tốc:

### A. Cơ sở dữ liệu quan hệ MySQL (RDBMS)
Sử dụng **MySQL** làm cơ sở dữ liệu chính nhằm lưu trữ toàn bộ các thực thể thông tin có mối quan hệ chặt chẽ trong hệ thống, đảm bảo tính toàn vẹn dữ liệu (ACID):
* **Thông tin tài khoản:** Dữ liệu người dùng, mật khẩu đã mã hóa, phân quyền vai trò (Admin, Staff, Customer).
* **Thông tin phim:** Danh sách phim, thể loại, đạo diễn, thời lượng, độ tuổi quy định, poster, banner.
* **Cấu hình rạp & Ghế:** Sơ đồ phòng chiếu, danh sách ghế ngồi, loại ghế (Standard, VIP) kèm mức phụ thu giá vé tương ứng.
* **Dữ liệu suất chiếu:** Ngày, giờ bắt đầu/kết thúc, giá vé gốc của từng suất chiếu thực tế.
* **Thông tin hóa đơn đặt vé:** Lịch sử đơn đặt vé, danh sách ghế đặt cụ thể, mã đơn hàng (`orderCode`), trạng thái thanh toán (Paid, Pending, Expired, Cancelled).

### B. Bộ nhớ đệm Redis (Caching)
Sử dụng **Redis** hoạt động song song để lưu giữ tạm thời các trạng thái/phiên làm việc (Session/Token) hoặc các dữ liệu được truy xuất thường xuyên (như danh sách phim nổi bật hoặc lịch chiếu trong ngày) nhằm giảm tải trực tiếp cho MySQL, tăng tốc độ phản hồi API xuống dưới mức mili-giây và mang lại trải nghiệm mượt mà tối đa cho ứng dụng di động.
