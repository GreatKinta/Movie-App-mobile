# Tài liệu Module Lịch Chiếu (Schedule)

> **Module**: `LichChieu`
> **Mục đích**: Hiển thị lịch chiếu phim được tổ chức theo các tab ngày (7 ngày tính từ hôm nay).
> **Đường dẫn**: `src/features/client/Schedule/`

---

## 1. Tổng quan

Module `LichChieu` là một tính năng hoàn chỉnh theo mô hình **Container–Presentation**:

- **Container** (`LichChieu.jsx`): Quản lý state `activeTab`, tiêu thụ dữ liệu từ `data/fakeData.js`.
- **Presentation** (các component con): Chỉ nhận props và render giao diện, không có state riêng.

Dữ liệu lịch chiếu được sinh tự động bởi hàm `generateSchedule()` trong `fakeData.js`, tạo ra **7 ngày** liên tiếp từ thời điểm hiện tại, mỗi ngày đi kèm 2 bộ phim mẫu với suất chiếu ngẫu nhiên.

Thiết kế này cho phép:
- **Thêm ngày mới**: Chỉ cần thay đổi logic trong `fakeData.js`, không cần chạm vào component.
- **Thêm phim mới**: Thêm object vào mảng `movies` bên trong vòng lặp của `generateSchedule()`.
- **Kết nối API thật**: Thay thế `scheduleData` bằng dữ liệu fetch từ server mà không cần sửa component nào.

---

## 2. Cấu trúc File

```text
Schedule/
├── components/             # Các presentation components (không có state)
│   ├── DateSelector.jsx    # Thanh tab chọn ngày
│   ├── MovieItem.jsx       # Một hàng hiển thị thông tin phim + các suất chiếu
│   └── NoteSection.jsx     # Thanh ghi chú/thông báo phía trên danh sách phim
├── data/
│   └── fakeData.js         # Nguồn dữ liệu tĩnh (data source duy nhất của module)
├── LichChieu.css           # Styles riêng cho toàn bộ module
├── LichChieu.jsx           # Container chính (quản lý state & data flow)
└── LichChieu.md            # File tài liệu này
```

---

## 3. Mô hình Dữ liệu (Data Models)

Toàn bộ dữ liệu đến từ `data/fakeData.js` dưới dạng một **mảng `scheduleData`**, mỗi phần tử là một `ScheduleEntry`.

### 3.1. Cấu trúc tổng thể — `ScheduleEntry[]`

```javascript
// export const scheduleData: ScheduleEntry[]
[
  {
    day: DayObject,       // Thông tin ngày (dùng cho tab)
    movies: Movie[]       // Danh sách phim của ngày đó
  },
  // ... 6 ngày tiếp theo
]
```

### 3.2. Đối tượng Ngày — `DayObject`

Được `LichChieu.jsx` map ra để tạo các tab, và truyền vào `DateSelector`.

```javascript
{
  id: "tab-id-1",         // ID duy nhất (tab-id-1 → tab-id-7)
  dayNumber: "22",        // Ngày (2 chữ số), dùng cho font lớn trong tab
  monthYear: "/02 - T7"   // Tháng + tên thứ hiển thị cạnh dayNumber
}
```

### 3.3. Đối tượng Phim — `Movie`

Được truyền vào `MovieItem` qua prop `movie`.

```javascript
{
  id: "mb-tab-id-1",        // ID duy nhất (kết hợp slug phim + dayId)
  title: "Mắt Biếc",        // Tên phim — hiển thị dưới dạng <h1>
  imageUrl: "/assets/...",   // Đường dẫn ảnh poster
  ratingUrl: "https://...",  // URL icon phân loại độ tuổi (P, C13, C16, C18)
  link: "#",                 // Href khi click vào tên phim
  genre: "Tình Cảm",        // Thể loại — hiển thị trong danh sách .blog-info
  duration: "117",           // Thời lượng (phút)
  type: "2D Digital",        // Loại hình chiếu — hiển thị dạng label
  showtimes: Showtime[]      // Các suất chiếu trong ngày
}
```

### 3.4. Đối tượng Suất Chiếu — `Showtime`

```javascript
{
  time: "18:00",   // Giờ chiếu — hiển thị chính trong nút bấm
  date: "22/02",   // Ngày chiếu — hiển thị nhỏ bên dưới (hiện đang ẩn bằng CSS)
  seats: 34        // Số ghế trống — hiển thị dưới nút (dạng "34 ghế trống")
}
```

---

## 4. Kiến trúc Component

### `LichChieu.jsx` — Container chính

```
Props nhận vào : (không có — self-contained)
State nội bộ   : activeTab (string) — ID của tab đang được chọn

Data flow:
  scheduleData (fakeData.js)
       │
       ├─── .map(item => item.day) ──► DateSelector (days, activeTab, onTabChange)
       │
       └─── .map(item => ...) ──► tab-pane (filter theo activeTab)
                                         └─► NoteSection
                                         └─► MovieItem[] (item.movies)
```

**Điểm quan trọng:**
- `activeTab` mặc định là `scheduleData[0]?.day.id` (ngày đầu tiên).
- Danh sách phim được render trong `div` có `overflowY: auto` + `maxHeight` để cuộn nội dung.
- Nếu một ngày không có phim (`movies.length === 0`), hiển thị thông báo "Không có suất chiếu nào."

---

### `DateSelector.jsx` — Thanh tab chọn ngày

| Prop | Kiểu | Mô tả |
|---|---|---|
| `days` | `DayObject[]` | Mảng các ngày để render thành tab |
| `activeTab` | `string` | ID tab đang active |
| `onTabChange` | `(id: string) => void` | Callback khi click tab |

- Render `<ul class="nav nav-tabs dayofweek">`.
- Mỗi tab hiển thị `dayNumber` (font lớn `.font-38`) kèm `monthYear`.
- Click tab gọi `e.preventDefault()` rồi `onTabChange(day.id)`.

---

### `MovieItem.jsx` — Card một bộ phim

| Prop | Kiểu | Mô tả |
|---|---|---|
| `movie` | `Movie` | Object phim đầy đủ |

**Bố cục bên trong (dùng hệ thống grid 16 cột):**

```
row
├── col-lg-5 (poster)
│     ├── ratingUrl (icon phân loại — absolute top-left)
│     ├── imageUrl  (ảnh poster, .border-radius-20)
│     └── nút play trailer (#trailer-pop-up, fancybox)
└── col-lg-11 (thông tin + showtimes)
      ├── <h1> title → <a href={link}>
      ├── <ul class="blog-info">
      │     ├── <li> icon tags + genre
      │     └── <li> icon clock + duration phút
      ├── type label (font-transform-uppercase)
      └── showtimes.map → nút <a class="btn default">
            ├── time (font 13px)
            ├── date (font 10px, hiện ẩn)
            └── seats ghế trống (font-smaller)
```

- Nút suất chiếu dẫn đến `#product-pop-up` qua fancybox (hiện là placeholder).

---

### `NoteSection.jsx` — Thanh ghi chú

- **Không có props.**
- Hiển thị 1 ô màu `#B3C9E9` và text `[Ghi chú/Thông báo]` — hiện là placeholder.
- Dùng flexbox, nằm trên cùng của mỗi tab pane, phân cách bởi `border-bottom`.

---

## 5. Hướng dẫn Mở Rộng

### ✅ Thêm ngày (thay đổi số ngày hiển thị)

Mở `data/fakeData.js`, sửa điều kiện vòng lặp:

```javascript
// Hiện tại: 7 ngày
for (let i = 0; i < 7; i++) { ... }

// Muốn 14 ngày:
for (let i = 0; i < 14; i++) { ... }
```

*Không cần sửa file nào khác.*

---

### ✅ Thêm phim mới vào mỗi ngày

Mở `data/fakeData.js`, thêm object vào mảng `movies` bên trong vòng lặp:

```javascript
const movies = [
  { /* Mắt Biếc — đã có */ },
  { /* Bố Già — đã có */ },
  {
    id: `new-${dayId}`,
    title: 'Phim Mới',
    imageUrl: '/assets/images/phim-moi.png',
    ratingUrl: 'https://img.icons8.com/.../Age-Rating-18.png',
    link: '/phim-moi',
    genre: 'Hành Động',
    duration: '135',
    type: '3D IMAX',
    showtimes: [
      { time: '10:00', date: `${dayNum}/${month}`, seats: 80 }
    ]
  }
];
```

---

### ✅ Thêm trường mới cho phim (ví dụ: Đạo diễn)

**Bước 1** — Thêm trường vào data trong `fakeData.js`:
```javascript
{ ..., director: 'Victor Vũ' }
```

**Bước 2** — Hiển thị trong `components/MovieItem.jsx`:
```jsx
// Destructure thêm trường mới
const { ..., director } = movie;

// Thêm vào danh sách .blog-info
<li><i className="fa fa-user"></i>{director}</li>
```

---

### ✅ Kết nối API thật

**Bước 1** — Xóa import `scheduleData` trong `LichChieu.jsx`.

**Bước 2** — Thêm state và fetch:
```jsx
import { useState, useEffect } from 'react';

const [scheduleData, setScheduleData] = useState([]);

useEffect(() => {
  fetch('/api/schedule')
    .then(res => res.json())
    .then(data => setScheduleData(data)); // Đảm bảo data khớp ScheduleEntry[]
}, []);
```

**Bước 3** — Cập nhật fallback cho `activeTab`:
```jsx
const [activeTab, setActiveTab] = useState('');

useEffect(() => {
  if (scheduleData.length > 0 && !activeTab) {
    setActiveTab(scheduleData[0].day.id);
  }
}, [scheduleData]);
```

*Không cần thay đổi bất kỳ component con nào.*

---

## 6. Styling (`LichChieu.css`)

| Class / Selector | Vai trò |
|---|---|
| `.tab-style-1` | Wrapper toàn bộ khu vực tabs + content |
| `.nav.nav-tabs.dayofweek` | Thanh tab ngang — border, padding, active style |
| `li.active > a.dayofweek` | Màu sắc & viền tab đang được chọn |
| `.tab-pane.fade.in.active` | Hiển thị nội dung tab đang active |
| `.product-item` | Card bao bọc poster phim |
| `.pi-img-wrapper` | Wrapper ảnh poster (relative position cho icon rating) |
| `.blog-info` | Danh sách thông tin phim (genre, duration) |
| `.col-xs-{n}` | Hệ thống grid **16 cột** tùy chỉnh (khác Bootstrap 12 cột) |
| `@media` queries | Responsive breakpoints cho mobile/tablet |

> **Lưu ý quan trọng**: Module dùng hệ thống **16 cột** (`.col-xs-16`, `.col-md-16`), **không phải** 12 cột Bootstrap thông thường. Khi thêm layout mới, hãy dùng tổng cột = 16.

---

## 7. Luồng Render (Render Flow)

```
App mount
  └─► LichChieu()
        ├─ import scheduleData từ fakeData.js (7 phần tử)
        ├─ useState(activeTab = scheduleData[0].day.id = "tab-id-1")
        ├─ days = scheduleData.map(item => item.day)      // [7 DayObject]
        │
        ├─► <DateSelector days={days} activeTab onTabChange />
        │     └─ render 7 tab, tab "tab-id-1" có class "in active"
        │
        └─► scheduleData.map(item => <tab-pane>)          // 7 pane, 6 pane ẩn
              └─ pane "tab-id-1" (visible):
                    ├─► <NoteSection />
                    └─► item.movies.map(movie => <MovieItem movie={movie} />)
                          ├─► MovieItem { Mắt Biếc }
                          └─► MovieItem { Bố Già }

User click tab "tab-id-2"
  └─► setActiveTab("tab-id-2")
        └─► Re-render: pane "tab-id-2" hiển thị, pane "tab-id-1" ẩn
```
