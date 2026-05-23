CREATE DATABASE IF NOT EXISTS Cinema_DB;
USE Cinema_DB;

-- 1. Bảng users (Không phụ thuộc)
CREATE TABLE users (
    user_id integer not null auto_increment,
    created_at datetime(6),
    phone_number varchar(15),
    username varchar(50) not null,
    email varchar(100) not null,
    full_name varchar(100),
    password_hash varchar(255) not null,
    role enum('admin', 'staff', 'customer') default 'customer',
    primary key (user_id),
    constraint UK_username unique (username),
    constraint UK_email unique (email)
) engine=InnoDB;

-- 2. Bảng rooms (Không phụ thuộc)
CREATE TABLE rooms (
    room_id integer not null auto_increment,
    total_seats integer,
    name varchar(50) not null,
    status enum('active', 'maintenance') default 'active',
    primary key (room_id)
) engine=InnoDB;

-- 3. Bảng seat_types (Không phụ thuộc)
CREATE TABLE seat_types (
    seat_type_id integer not null auto_increment,
    surcharge decimal(10,2),
    name varchar(50) not null,
    primary key (seat_type_id)
) engine=InnoDB;

-- 4. Bảng seats (Phụ thuộc: rooms, seat_types)
CREATE TABLE seats (
    seat_id integer not null auto_increment,
    room_id integer not null,
    seat_number integer not null,
    seat_type_id integer not null,
    row_name char(2) not null,
    primary key (seat_id),
    constraint uq_room_seat unique (room_id, row_name, seat_number),
    constraint fk_seat_room foreign key (room_id) references rooms (room_id),
    constraint fk_seat_type foreign key (seat_type_id) references seat_types (seat_type_id)
) engine=InnoDB;

-- 5. Bảng movies (Không phụ thuộc)
CREATE TABLE movies (
    movie_id bigint not null auto_increment,
    duration_minutes integer not null,
    trailer_duration_minutes integer default 10,
    rating float(53),
    title varchar(200) not null,
    age_rating varchar(255),
    banner varchar(255),
    cast_members varchar(255),
    description TEXT,
    director varchar(255),
    genre varchar(255),
    poster_url varchar(255),
    release_date varchar(255),
    status enum('showing', 'coming') default 'showing',
    primary key (movie_id)
) engine=InnoDB;

-- 6. Bảng showtimes (Phụ thuộc: movies, rooms)
CREATE TABLE showtimes (
    showtime_id integer not null auto_increment,
    base_price decimal(10,2) not null,
    room_id integer not null,
    movie_id bigint not null,
    start_time datetime(6) not null,
    end_time datetime(6),
    buffer_time_minutes integer default 15,
    status enum('active', 'cancelled', 'completed') default 'active',
    batch_id varchar(100),
    primary key (showtime_id),
    constraint fk_show_movie foreign key (movie_id) references movies (movie_id),
    constraint fk_show_room foreign key (room_id) references rooms (room_id)
) engine=InnoDB;

-- 7. Bảng orders (Phụ thuộc: users) 
-- Bảng này CẦN được tạo trước bảng bookings
CREATE TABLE orders (
    order_id integer not null auto_increment,
    order_code varchar(50) not null, 
    user_id integer not null,
    total_amount decimal(10,2) not null, 
    discount_amount decimal(10,2) default 0.00,
    final_amount decimal(10,2) not null, 
    status enum('pending', 'paid', 'cancelled', 'expired', 'refunded') default 'pending',
    payment_method varchar(50), 
    expired_at datetime(6) not null, 
    created_at datetime(6) default current_timestamp(6),
    updated_at datetime(6) on update current_timestamp(6),
    primary key (order_id),
    constraint uk_order_code unique (order_code),
    constraint fk_order_user foreign key (user_id) references users (user_id)
) engine=InnoDB;

-- 8. Bảng bookings (Phụ thuộc: orders, showtimes)
-- Đã loại bỏ các cột thừa (total_amount, status, user_id, booking_date)
-- và tích hợp trực tiếp order_id
CREATE TABLE bookings (
    booking_id integer not null auto_increment,
    order_id integer not null,
    showtime_id integer not null,
    primary key (booking_id),
    constraint fk_booking_order foreign key (order_id) references orders (order_id),
    constraint fk_booking_showtime foreign key (showtime_id) references showtimes (showtime_id)
) engine=InnoDB;

-- 9. Bảng booking_seats (Phụ thuộc: bookings, seats, showtimes)
CREATE TABLE booking_seats (
    id integer not null auto_increment,
    booking_id integer not null,
    price decimal(10,2) not null,
    seat_id integer not null,
    showtime_id integer not null,
    is_checked_in BOOLEAN DEFAULT FALSE, -- Cột đã được thêm trực tiếp vào đây
    primary key (id),
    constraint uq_showtime_seat unique (showtime_id, seat_id),
    constraint fk_bs_booking foreign key (booking_id) references bookings (booking_id),
    constraint fk_bs_seat foreign key (seat_id) references seats (seat_id),
    constraint fk_bs_showtime foreign key (showtime_id) references showtimes (showtime_id)
) engine=InnoDB;