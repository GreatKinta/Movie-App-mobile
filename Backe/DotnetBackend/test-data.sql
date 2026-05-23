-- ============================================================
-- TEST DATA - Cinema Booking System
-- Mục đích: Test thủ công các luồng Booking + Order + Payment
-- Cách chạy: Mở MySQL Workbench (hoặc CLI) → chạy file này
-- LƯU Ý: Chạy init.sql trước nếu DB chưa có các bảng
-- ============================================================

USE Cinema_DB;

-- Tắt safe update mode tạm thời để cho phép DELETE không có WHERE
SET SQL_SAFE_UPDATES = 0;

-- Xóa data cũ theo đúng thứ tự (tránh vi phạm FK)
DELETE FROM booking_seats;
DELETE FROM bookings;
DELETE FROM orders;
DELETE FROM showtimes;
DELETE FROM seats;
DELETE FROM seat_types;
DELETE FROM rooms;
DELETE FROM movies;
DELETE FROM users;

-- Bật lại safe update mode sau khi xóa xong
SET SQL_SAFE_UPDATES = 1;

-- Reset auto_increment về 1 cho sạch
ALTER TABLE booking_seats AUTO_INCREMENT = 1;
ALTER TABLE bookings AUTO_INCREMENT = 1;
ALTER TABLE orders AUTO_INCREMENT = 1;
ALTER TABLE showtimes AUTO_INCREMENT = 1;
ALTER TABLE seats AUTO_INCREMENT = 1;
ALTER TABLE seat_types AUTO_INCREMENT = 1;
ALTER TABLE rooms AUTO_INCREMENT = 1;
ALTER TABLE movies AUTO_INCREMENT = 1;
ALTER TABLE users AUTO_INCREMENT = 1;

-- ============================================================
-- 1. USERS
-- user_id 1 = admin, 2 = staff, 3 & 4 = customer test
-- Mật khẩu test: "password123"
--   BCrypt hash (10 rounds): $2a$10$slYQmyNdgzsCgrGE1i6Ef.8pFO2R/3Zw6VDDO0lDKGJV9gbH.0W6q
-- ============================================================
INSERT INTO users (username, password_hash, email, full_name, phone_number, role, created_at) VALUES
('admin',     '$2a$10$slYQmyNdgzsCgrGE1i6Ef.8pFO2R/3Zw6VDDO0lDKGJV9gbH.0W6q', 'admin@cinema.vn',   'Admin System',  '0900000001', 'admin',    NOW()),
('staff01',   '$2a$10$slYQmyNdgzsCgrGE1i6Ef.8pFO2R/3Zw6VDDO0lDKGJV9gbH.0W6q', 'staff@cinema.vn',   'Nhan Vien 01',  '0900000002', 'staff',    NOW()),
('customer1', '$2a$10$slYQmyNdgzsCgrGE1i6Ef.8pFO2R/3Zw6VDDO0lDKGJV9gbH.0W6q', 'khach1@gmail.com',  'Nguyen Van A',  '0912345601', 'customer', NOW()),
('customer2', '$2a$10$slYQmyNdgzsCgrGE1i6Ef.8pFO2R/3Zw6VDDO0lDKGJV9gbH.0W6q', 'khach2@gmail.com',  'Tran Thi B',    '0912345602', 'customer', NOW());
-- user_id: 1=admin | 2=staff01 | 3=customer1 | 4=customer2

-- ============================================================
-- 2. MOVIES
-- Mỗi phim có trạng thái khác nhau để test filter UI
-- ============================================================
INSERT INTO movies (title, description, duration_minutes, trailer_duration_minutes, poster_url, banner, genre, release_date, director, cast_members, age_rating, rating, status) VALUES
(
  'Dune: Part Two',
  'Hành trình của Paul Atreides trên hành tinh Arrakis tiếp tục khi anh đứng lên lãnh đạo người Fremen chống lại nhà Harkonnen.',
  166, 10,
  'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
  'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg',
  'Hành động, Viễn tưởng', '2024-03-01', 'Denis Villeneuve',
  'Timothée Chalamet, Zendaya, Rebecca Ferguson', 'T13', 8.5, 'showing'
),
(
  'Kung Fu Panda 4',
  'Gấu Po buộc phải tìm và huấn luyện người kế thừa vị trí Chiến binh Rồng trong khi đối mặt với kẻ phản diện mới.',
  94, 10,
  'https://image.tmdb.org/t/p/w500/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg',
  'https://image.tmdb.org/t/p/original/3ffPx9jqg0yj9y1KWeagT7D20CB.jpg',
  'Hoạt hình, Hài hước, Gia đình', '2024-03-08', 'Mike Mitchell',
  'Jack Black, Awkwafina, Bryan Cranston', 'P', 7.2, 'showing'
),
(
  'Godzilla x Kong: The New Empire',
  'Hai quái thú huyền thoại tập hợp chống lại mối đe dọa khổng lồ tiềm ẩn bên trong Trái Đất.',
  115, 10,
  'https://image.tmdb.org/t/p/w500/z1p34vh7dEOnLDmyCrlUVLuoDzd.jpg',
  'https://image.tmdb.org/t/p/original/fsSGGBMia81KAFuukQ4JOMIWYAQ.jpg',
  'Hành động, Viễn tưởng', '2024-03-29', 'Adam Wingard',
  'Rebecca Hall, Brian Tyree Henry, Dan Stevens', 'T13', 6.8, 'coming'
);
-- movie_id: 1=Dune2 | 2=KFP4 | 3=GxK (coming soon - không thể book)

-- ============================================================
-- 3. ROOMS
-- ============================================================
INSERT INTO rooms (name, total_seats, status) VALUES
('Phòng 1 (2D Standard)', 25, 'active'),
('Phòng 2 (3D Premium)',  25, 'active'),
('Phòng 3 (IMAX)',        25, 'maintenance'); -- Phòng đang bảo trì - không thể tạo suất chiếu mới
-- room_id: 1=2D | 2=3D | 3=IMAX(bảo trì)

-- ============================================================
-- 4. SEAT TYPES (kèm phụ thu thêm ngoài base_price)
-- ============================================================
INSERT INTO seat_types (name, surcharge) VALUES
('Normal', 0.00),       -- seat_type_id = 1: Ghế thường
('VIP',    20000.00),   -- seat_type_id = 2: Ghế VIP (+20k)
('Couple', 50000.00);   -- seat_type_id = 3: Ghế đôi (+50k)

-- ============================================================
-- 5. SEATS (Phòng 1 và Phòng 2, mỗi phòng 25 ghế)
-- Layout:
--   Hàng A (1-5): Normal   | Hàng B (1-5): Normal
--   Hàng C (1-5): VIP      | Hàng D (1-5): VIP
--   Hàng E (1-5): Couple
-- ============================================================
INSERT INTO seats (room_id, seat_type_id, row_name, seat_number) VALUES
-- ---- Phòng 1 (seats ID 1-25) ----
(1, 1, 'A', 1), (1, 1, 'A', 2), (1, 1, 'A', 3), (1, 1, 'A', 4), (1, 1, 'A', 5),
(1, 1, 'B', 1), (1, 1, 'B', 2), (1, 1, 'B', 3), (1, 1, 'B', 4), (1, 1, 'B', 5),
(1, 2, 'C', 1), (1, 2, 'C', 2), (1, 2, 'C', 3), (1, 2, 'C', 4), (1, 2, 'C', 5),
(1, 2, 'D', 1), (1, 2, 'D', 2), (1, 2, 'D', 3), (1, 2, 'D', 4), (1, 2, 'D', 5),
(1, 3, 'E', 1), (1, 3, 'E', 2), (1, 3, 'E', 3), (1, 3, 'E', 4), (1, 3, 'E', 5),
-- ---- Phòng 2 (seats ID 26-50) ----
(2, 1, 'A', 1), (2, 1, 'A', 2), (2, 1, 'A', 3), (2, 1, 'A', 4), (2, 1, 'A', 5),
(2, 1, 'B', 1), (2, 1, 'B', 2), (2, 1, 'B', 3), (2, 1, 'B', 4), (2, 1, 'B', 5),
(2, 2, 'C', 1), (2, 2, 'C', 2), (2, 2, 'C', 3), (2, 2, 'C', 4), (2, 2, 'C', 5),
(2, 2, 'D', 1), (2, 2, 'D', 2), (2, 2, 'D', 3), (2, 2, 'D', 4), (2, 2, 'D', 5),
(2, 3, 'E', 1), (2, 3, 'E', 2), (2, 3, 'E', 3), (2, 3, 'E', 4), (2, 3, 'E', 5);

-- ============================================================
-- 6. SHOWTIMES
-- base_price + surcharge = giá thực tế mỗi ghế
--
-- Showtime 1: Dune2, Phòng1, ngày mai sáng  → test booking bình thường
-- Showtime 2: Dune2, Phòng1, ngày mai chiều → test booking khi 1 số ghế đã bị đặt
-- Showtime 3: KFP4,  Phòng2, ngày mai sáng  → test đặt đồng thời (race condition)
-- Showtime 4: Dune2, Phòng1, quá khứ        → test reject booking khi suất đã qua
-- ============================================================
INSERT INTO showtimes (movie_id, room_id, start_time, end_time, base_price, status) VALUES
-- ID 1: Suất sắp tới, còn nhiều ghế trống → test HAPPY PATH
(1, 1, DATE_ADD(NOW(), INTERVAL 20 HOUR),  DATE_ADD(NOW(), INTERVAL 23 HOUR),  80000.00, 'active'),
-- ID 2: Suất sắp tới, có ghế đã book (C1,C2,C3) → test SELECT SEAT khi có ghế bận
(1, 1, DATE_ADD(NOW(), INTERVAL 45 HOUR),  DATE_ADD(NOW(), INTERVAL 48 HOUR),  80000.00, 'active'),
-- ID 3: Suất sắp tới (phim khác phòng khác) → test ĐỒNG THỜI / race condition lock
(2, 2, DATE_ADD(NOW(), INTERVAL 22 HOUR),  DATE_ADD(NOW(), INTERVAL 24 HOUR),  75000.00, 'active'),
-- ID 4: Suất đã qua → test REJECT khi cố booking suất cũ
(1, 1, DATE_SUB(NOW(), INTERVAL 5 HOUR),   DATE_SUB(NOW(), INTERVAL 2 HOUR),   80000.00, 'completed');

-- ============================================================
-- 7. ORDERS - Các kịch bản thanh toán
-- ============================================================
INSERT INTO orders (order_code, user_id, total_amount, discount_amount, final_amount, status, payment_method, expired_at, created_at) VALUES

-- [KỊCH BẢN A] Order đã thanh toán thành công (customer1, showtime 1)
-- → Dùng để test: xem lịch sử đặt vé, hiển thị e-ticket
('CINEMA-PAID-001', 3, 100000.00, 0.00, 100000.00, 'paid', 'SEPAY',
  DATE_ADD(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 2 HOUR)),

-- [KỊCH BẢN B] Order đang chờ thanh toán, CHƯA hết hạn (customer2, showtime 1)
-- → Dùng để test: Sepay Webhook kích hoạt → đổi status thành paid
-- → Dùng để test: lock ghế vẫn còn hiệu lực
('CINEMA-PEND-002', 4, 200000.00, 0.00, 200000.00, 'pending', 'SEPAY',
  DATE_ADD(NOW(), INTERVAL 9 MINUTE), NOW()),

-- [KỊCH BẢN C] Order đã hết hạn chưa được xử lý (customer1, showtime 2)
-- → Dùng để test: Scheduled task phát hiện và chuyển sang expired, giải phóng ghế
('CINEMA-EXPD-003', 3, 160000.00, 0.00, 160000.00, 'expired', 'SEPAY',
  DATE_SUB(NOW(), INTERVAL 5 MINUTE), DATE_SUB(NOW(), INTERVAL 15 MINUTE)),

-- [KỊCH BẢN D] Order bị huỷ thủ công (customer2, showtime 3)
-- → Dùng để test: hiển thị trạng thái cancelled, ghế được giải phóng
('CINEMA-CNCL-004', 4, 125000.00, 0.00, 125000.00, 'cancelled', 'SEPAY',
  DATE_SUB(NOW(), INTERVAL 30 MINUTE), DATE_SUB(NOW(), INTERVAL 1 HOUR));

-- ============================================================
-- 8. BOOKINGS (mỗi Order = 1 Booking tương ứng)
-- ============================================================
INSERT INTO bookings (order_id, showtime_id) VALUES
(1, 1),  -- booking_id 1: Order A (paid) → Showtime 1
(2, 1),  -- booking_id 2: Order B (pending) → Showtime 1
(3, 2),  -- booking_id 3: Order C (expired) → Showtime 2
(4, 3);  -- booking_id 4: Order D (cancelled) → Showtime 3

-- ============================================================
-- 9. BOOKING SEATS
-- Bảng này quyết định ghế nào đang bị chiếm ở mỗi suất
--
-- Ghế Phòng 1 (showtime 1, 2):
--   seat_id 11 = C1 VIP | 12 = C2 VIP | 13 = C3 VIP
--   seat_id 21 = E1 Couple
-- Ghế Phòng 2 (showtime 3):
--   seat_id 46 = E1 Couple (phòng 2, hàng E ghế 1)
--
-- Giá = base_price + surcharge của loại ghế
--   VIP    at showtime1: 80000 + 20000 = 100000
--   Normal at showtime1: 80000 + 0     = 80000
--   Couple at showtime2: 80000 + 50000 = 130000 (nhưng ở đây dùng showtime3 phòng2)
--   Couple at showtime3: 75000 + 50000 = 125000
-- ============================================================
INSERT INTO booking_seats (booking_id, showtime_id, seat_id, price) VALUES
-- Order A (paid): 1 ghế VIP C1 ở showtime 1
(1, 1, 11, 100000.00),

-- Order B (pending): 2 ghế VIP C2, C3 ở showtime 1 (đang bị lock chờ thanh toán)
(2, 1, 12, 100000.00),
(2, 1, 13, 100000.00),

-- Order C (expired): ghế VIP C1 ở showtime 2 (đã hết hạn, nên coi như ghế này trống)
(3, 2, 11, 100000.00),

-- Order D (cancelled): ghế Couple E1 phòng 2 ở showtime 3 (đã huỷ, ghế trống)
(4, 3, 46, 125000.00);

-- ============================================================
-- TỔNG KẾT CÁC KỊCH BẢN TEST
-- ============================================================
-- [HAPPY PATH]
--   Đăng nhập customer1/customer2, chọn Dune2 showtime 1 (sáng mai)
--   Chọn bất kỳ ghế trố ng nào ngoài C1(đã paid), C2/C3(đang pending)
--   Tạo order → giả lập thanh toán SEPAY webhook → status → paid ✓
--
-- [GHỐI ĐÃ BỊ ĐẶT]
--   Chọn showtime 1, thử chọn ghế C1 → Hệ thống phải báo ghế đã bị đặt ✓
--   Chọn ghế C2/C3 → Hệ thống phải báo ghế đang được giữ (pending) ✓
--
-- [WEBHOOK]
--   Order B (CINEMA-PEND-002) đang pending, còn ~9 phút hết hạn
--   Gửi webhook SEPAY với đúng order_code → status phải đổi thành paid ✓
--
-- [SCHEDULED TASK - HẾT HẠN]
--   Order C (CINEMA-EXPD-003) đã hết hạn 5 phút trước
--   Scheduled task chạy → phải phát hiện và đặt status = expired (nếu chưa) ✓
--   Ghế showtime 2 - C1 phải được giải phóng sau đó ✓
--
-- [TỪ CHỐI BOOKING QUÁ KHỨ]
--   Showtime 4 đã diễn ra 5 tiếng trước → API phải reject với lỗi phù hợp ✓
-- ============================================================
