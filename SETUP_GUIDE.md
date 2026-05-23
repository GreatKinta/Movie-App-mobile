# 🎬 Hướng Dẫn Cài Đặt Dự Án MyCinema

Dự án **MyCinema** gồm **3 thành phần** chạy độc lập:

| Thành phần | Công nghệ | Thư mục |
|---|---|---|
| **Backend API** | ASP.NET Core (.NET 10) | `Backe/DotnetBackend/` |
| **Admin Web** | React + Vite | `Fronte/vite-project/` |
| **Mobile App** | React Native + Expo | `MyCinemaApp/` |

---

## ⚙️ Yêu Cầu Cài Đặt Trước

Đảm bảo máy tính đã cài đặt đầy đủ các công cụ sau trước khi bắt đầu:

| Công cụ | Phiên bản | Kiểm tra |
|---|---|---|
| **.NET SDK** | 10.0 trở lên | `dotnet --version` |
| **Node.js** | 18.x trở lên | `node --version` |
| **npm** | 9.x trở lên | `npm --version` |
| **Docker Desktop** | Mới nhất | `docker --version` |
| **Expo CLI** | Mới nhất | `npx expo --version` |
| **Git** | Mới nhất | `git --version` |

> 💡 **Gợi ý:** Để chạy ứng dụng mobile trên điện thoại thật, cài thêm ứng dụng **Expo Go** từ App Store / Google Play.

---

## 📥 Bước 1: Clone Dự Án

```bash
git clone <đường-dẫn-repository>
cd PhimMobile
```

---

## 🗄️ Bước 2: Khởi Động Cơ Sở Dữ Liệu (MySQL + Redis)

Dự án sử dụng **Docker Compose** để khởi động MySQL 8.0 và Redis 7.2 cùng lúc.

### 2.1 — Di chuyển vào thư mục backend

```bash
cd Backe/DotnetBackend
```

### 2.2 — Tạo file `.env` cho Backend

Tạo file `.env` trong thư mục `Backe/DotnetBackend/` với nội dung sau:

```env
# ====== DATABASE (MySQL) ======
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=Cinema_DB
DB_USER=root
DB_PASSWORD=123456

# ====== CACHE & LOCK (Redis) ======
REDIS_HOST=127.0.0.1
REDIS_PORT=6380
REDIS_PASSWORD=webphim-secret-redis

# ====== THANH TOÁN (SePay) ======
SEPAY_SECRET_KEY=<your-sepay-secret-key>

# ====== AUTHENTICATION (JWT) ======
JWT_SECRET=<your-jwt-secret-key>
JWT_EXPIRATION=86400000
```

> ⚠️ **Lưu ý bảo mật:** Thay `<your-sepay-secret-key>` và `<your-jwt-secret-key>` bằng các giá trị thật của bạn. Không commit file `.env` lên Git.

### 2.3 — Khởi động MySQL và Redis bằng Docker

```bash
docker-compose up -d
```

Kiểm tra các container đã chạy thành công:

```bash
docker ps
```

Kết quả mong đợi: hai container `webphim-mysql` và `webphim-redis` đều ở trạng thái `Up`.

> ℹ️ Lần chạy đầu tiên, Docker sẽ tự động tạo database `Cinema_DB` và chạy file `init.sql` để tạo toàn bộ bảng dữ liệu.

---

## 🖥️ Bước 3: Chạy Backend API (ASP.NET Core)

### 3.1 — Khôi phục các NuGet Package

```bash
# Vẫn đang ở thư mục Backe/DotnetBackend
dotnet restore
```

### 3.2 — Chạy Backend Server

```bash
dotnet run
```

Backend sẽ khởi động tại địa chỉ: **`http://localhost:8080`**

Kiểm tra bằng cách mở trình duyệt và truy cập: `http://localhost:8080/api/movies`

> ✅ Nếu thấy dữ liệu JSON trả về → Backend đã hoạt động.

**Các Package NuGet được sử dụng:**
- `Microsoft.EntityFrameworkCore` + `Pomelo.EntityFrameworkCore.MySql` — ORM kết nối MySQL
- `Microsoft.AspNetCore.Authentication.JwtBearer` — Xác thực JWT
- `StackExchange.Redis` — Kết nối Redis
- `BCrypt.Net-Next` — Mã hóa mật khẩu
- `FluentValidation.AspNetCore` — Validation dữ liệu đầu vào
- `dotenv.net` — Đọc biến môi trường từ file `.env`

---

## 🌐 Bước 4: Chạy Admin Web (React + Vite)

### 4.1 — Di chuyển vào thư mục frontend

```bash
cd ../../Fronte/vite-project
```

### 4.2 — Tạo file `.env` cho Admin Web

Tạo file `.env` trong thư mục `Fronte/vite-project/` với nội dung:

```env
# Development - dùng Vite proxy (trỏ về localhost:8080)
VITE_API_BASE_URL=/api
VITE_SEPAY_BANK_ACCOUNT=<số-tài-khoản-ngân-hàng>
VITE_SEPAY_BANK_NAME=MB
```

### 4.3 — Cài đặt dependencies

```bash
npm install
```

### 4.4 — Chạy Admin Web

```bash
npm run dev
```

Ứng dụng Admin sẽ chạy tại: **`http://localhost:5173`**

> ℹ️ Vite Proxy đã được cấu hình sẵn để tự động chuyển tiếp các request `/api/*` đến `http://localhost:8080`, không cần cấu hình thêm.

---

## 📱 Bước 5: Chạy Mobile App (React Native + Expo)

### 5.1 — Di chuyển vào thư mục mobile

```bash
cd ../../MyCinemaApp
```

### 5.2 — Cài đặt dependencies

```bash
npm install
```

### 5.3 — Cấu hình địa chỉ Backend

Mở file `constants/config.js` và cập nhật địa chỉ Backend:

```js
// Chọn MỘT trong hai cách sau:

// Cách 1: Dùng IP LAN (thiết bị thật, cùng mạng WiFi)
// export const API_BASE_URL = 'http://192.168.x.x:8080';

// Cách 2: Dùng Cloudflare Tunnel (mọi thiết bị, mọi mạng)
export const API_BASE_URL = 'https://your-tunnel-domain.id.vn';
```

> ⚠️ **Quan trọng:** Mobile App **không thể dùng `localhost`** vì `localhost` trên điện thoại trỏ về chính điện thoại đó, không phải máy tính chạy backend.

#### Cách xác định IP LAN của máy tính:
```bash
# Windows
ipconfig
# Tìm dòng "IPv4 Address" trong phần WiFi → ví dụ: 192.168.1.15
```

### 5.4 — Khởi động Expo

```bash
npx expo start
```

Expo sẽ hiển thị một **QR Code** trên terminal. Dùng camera điện thoại (iOS) hoặc ứng dụng **Expo Go** (Android) để quét mã và mở ứng dụng.

#### Tùy chọn chạy trên nền tảng cụ thể:
```bash
npx expo start --android   # Mở trên Android emulator
npx expo start --ios       # Mở trên iOS simulator (chỉ macOS)
```

---

## 🌍 Bước 6 (Tùy chọn): Cấu Hình Cloudflare Tunnel

Cloudflare Tunnel giúp Mobile App truy cập Backend từ mọi mạng Internet mà không cần địa chỉ IP công cộng.

### 6.1 — Cài đặt cloudflared

Tải và cài đặt `cloudflared` từ: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

### 6.2 — Chạy Tunnel

```bash
cloudflared tunnel run <tên-tunnel>
```

### 6.3 — Cập nhật URL trong Mobile App

Sau khi tunnel chạy, cập nhật lại `constants/config.js` với URL của tunnel:

```js
export const API_BASE_URL = 'https://your-tunnel-domain.id.vn';
```

---

## 🔄 Tổng Hợp — Thứ Tự Khởi Động

Mỗi lần chạy dự án, khởi động theo **đúng thứ tự** sau:

```
1️⃣  Docker (MySQL + Redis)  →  docker-compose up -d
2️⃣  Backend API             →  dotnet run
3️⃣  Admin Web               →  npm run dev
4️⃣  Mobile App              →  npx expo start
5️⃣  (Tùy chọn) Tunnel      →  cloudflared tunnel run <tên>
```

---

## 🔍 Kiểm Tra Nhanh Sau Cài Đặt

| Thành phần | URL kiểm tra | Kết quả kỳ vọng |
|---|---|---|
| **Backend** | `http://localhost:8080/api/movies` | JSON danh sách phim |
| **Admin Web** | `http://localhost:5173` | Trang đăng nhập Admin |
| **Mobile App** | Quét QR trên Expo Go | Màn hình chào / đăng nhập |
| **MySQL** | `docker logs webphim-mysql` | `ready for connections` |
| **Redis** | `docker logs webphim-redis` | `Ready to accept connections` |

---

## ❓ Xử Lý Lỗi Thường Gặp

### ❌ Backend báo lỗi kết nối MySQL

```
Lỗi: Unable to connect to MySQL server
```
**Cách sửa:** Đảm bảo Docker đang chạy và container `webphim-mysql` đã ở trạng thái `healthy`.
```bash
docker-compose up -d
docker ps
```

---

### ❌ Backend báo lỗi kết nối Redis

```
Lỗi: No endpoints specified / Connection refused
```
**Cách sửa:** Kiểm tra `REDIS_PORT` trong file `.env` phải là `6380` (không phải 6379 mặc định vì Docker map port `6380:6379`).

---

### ❌ Mobile App không kết nối được Backend

```
Lỗi: Network request failed
```
**Cách sửa:**
1. Đảm bảo điện thoại và máy tính **cùng mạng WiFi**.
2. Kiểm tra địa chỉ IP LAN trong `constants/config.js` có đúng không.
3. Hoặc dùng Cloudflare Tunnel thay vì IP LAN.

---

### ❌ Expo báo lỗi module not found

```
Lỗi: Cannot find module 'expo-secure-store'
```
**Cách sửa:** Chạy lại lệnh cài đặt:
```bash
npm install
```
