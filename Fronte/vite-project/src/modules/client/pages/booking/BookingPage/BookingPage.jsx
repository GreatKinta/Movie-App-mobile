import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SeatMap from '../SeatMap/SeatMap';
import BookingSummary from '../BookingSummary/BookingSummary';
import { useAuth } from '../../../../../context/AuthContext';
import api from '../../../../../services/api';
import './BookingPage.css';

const BookingPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [seats, setSeats] = useState([]);
    const [movie, setMovie] = useState(null);
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

    const [isCreatingBooking, setIsCreatingBooking] = useState(false);
    const [bookingError, setBookingError] = useState(null);

    // Countdown Timer Logic
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // Hàm gọi API lấy ghế hoặc fallback mock data
    const fetchSeats = useCallback(async () => {
        try {
            const response = await api.get(`/showtimes/${id}/seats`);
            const data = response.data;
            const mappedSeats = data.map(seat => ({
                id: seat.rowName + seat.seatNumber,
                row: seat.rowName,
                number: seat.seatNumber.toString().padStart(2, '0'),
                status: seat.status === 'AVAILABLE' ? 'available' : seat.status === 'LOCKED' ? 'holding' : 'booked',
                price: Number(seat.price),
                type: seat.seatTypeName.toLowerCase()
            }));
            if (mappedSeats.length > 0) {
                setSeats(mappedSeats);
                return;
            }
            throw new Error("Không có data cấu trúc chuẩn");
        } catch (error) {
            console.error("Lỗi tải ghế/Server chưa chuẩn bị API, dùng mock data:", error);
        }
    }, [id]);

    // Fetch showtime + movie details from backend
    useEffect(() => {
        const fetchShowtimeDetail = async () => {
            try {
                const res = await api.get(`/showtimes/${id}`);
                const data = res.data;

                // Format date/time from backend LocalDateTime
                const dt = new Date(data.startTime);
                const showtime = dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                const showDate = dt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

                setMovie({
                    id: data.movieId,
                    title: data.movieTitle,
                    poster: data.poster,
                    showtime,
                    showDate,
                    room: data.roomName,
                    duration: `${data.duration} phút`,
                    tags: data.genre ? data.genre.split(',').map(g => g.trim()) : [],
                    ageRating: data.ageRating,
                });
            } catch (err) {
                console.error("Lỗi tải thông tin suất chiếu:", err);
            }
        };

        fetchShowtimeDetail();
        fetchSeats();
    }, [id, fetchSeats]);


    const handleSeatSelect = (seat) => {
        if (seat.status === 'booked' || seat.status === 'holding') return;

        let seatsToToggle = [seat.id];
        if (seat.type === 'couple' || seat.type === 'đôi') {
            const seatNum = parseInt(seat.number, 10);
            const partnerNum = seatNum % 2 === 1 ? seatNum + 1 : seatNum - 1;
            const partner = seats.find(s => s.row === seat.row && parseInt(s.number, 10) === partnerNum);
            if (partner && partner.status !== 'booked' && partner.status !== 'holding') {
                seatsToToggle.push(partner.id);
            }
        }

        setSelectedSeats(prev => {
            const isAlreadySelected = prev.includes(seat.id);
            if (isAlreadySelected) {
                return prev.filter(id => !seatsToToggle.includes(id));
            } else {
                const newSelection = [...prev];
                seatsToToggle.forEach(id => {
                    if (!newSelection.includes(id)) {
                        newSelection.push(id);
                    }
                });
                return newSelection;
            }
        });
    };

    const calculateTotal = () => {
        let total = 0;
        const selectedCoupleSeats = [];
        
        selectedSeats.forEach(seatId => {
            const seat = seats.find(s => s.id === seatId);
            if (seat) {
                if (seat.type === 'couple' || seat.type === 'đôi') {
                    selectedCoupleSeats.push(seat);
                } else {
                    total += seat.price;
                }
            }
        });
        
        // Gom nhóm ghế đôi theo hàng
        const coupleByRow = {};
        selectedCoupleSeats.forEach(s => {
            if (!coupleByRow[s.row]) coupleByRow[s.row] = [];
            coupleByRow[s.row].push(s);
        });
        
        Object.keys(coupleByRow).forEach(row => {
            const rowSeats = coupleByRow[row].sort((a, b) => parseInt(a.number, 10) - parseInt(b.number, 10));
            let i = 0;
            while (i < rowSeats.length) {
                const s1 = rowSeats[i];
                const s2 = (i + 1 < rowSeats.length) ? rowSeats[i + 1] : null;
                
                // Chỉ tính tiền của 1 ghế trong cặp ghế đôi!
                total += s1.price;
                
                if (s2) {
                    i += 2;
                } else {
                    i += 1;
                }
            }
        });
        
        return total;
    };

    // 3. HÀM XÁC NHẬN ĐẶT GHẾ (GỌI POST REQUEST REDIS LOCK)
    const handleConfirmBooking = async () => {
        if (!user) {
            alert("Bạn cần phải đăng nhập để tiếp tục đặt vé!");
            navigate('/login');
            return;
        }

        if (selectedSeats.length === 0) {
            setBookingError("Vui lòng chọn ít nhất 1 ghế!");
            return;
        }
        setIsCreatingBooking(true);
        setBookingError(null);

        const payload = {
            userId: user.id, // Lấy ID của user đang đăng nhập
            showtimeId: parseInt(id),
            seatIds: selectedSeats,
            totalAmount: calculateTotal()
        };

        try {
            const res = await api.post('/bookings', payload);
            const data = res.data;

            navigate('/payment', {
                state: {
                    movie,
                    selectedSeats,
                    totalPrice: calculateTotal(),
                    bookingInfo: data,
                    bookingId: data?.bookingId,
                    orderCode: data?.orderCode
                }
            });
        } catch (err) {
            // XỬ LÝ LỖI REDIS QUĂNG RA VÀ HIỆN UI
            setBookingError(err.message);
            // Xoá trắng các ghế đang chọn hiện tại bắt người dùng chọn lại
            setSelectedSeats([]);
            // Cập nhật lại sơ đồ ghế xem đứa nào vừa lấy mất
            await fetchSeats();
        } finally {
            setIsCreatingBooking(false);
        }
    };

    if (!movie) return <div className="loading-screen">Loading...</div>;

    return (
        <div className="booking-page">
            <div className="booking-header-container">
                <div className="breadcrumb">
                    <Link to="/">Trang chủ</Link> &gt; <span>Đặt vé</span> &gt; <span className="current-page">{movie.title}</span>
                </div>
            </div>

            <div className="warning-banner">
                Theo quy định của cục điện ảnh, phim này không dành cho khán giả dưới 13 tuổi.
            </div>

            <div className="booking-main-layout">
                <div className="seat-selection-area">
                    {/* Hiển thị lỗi nếu có (Blocker màu đỏ) */}
                    {bookingError && <div className="error-banner" style={{ background: '#ffebee', color: '#c62828', padding: '15px', borderRadius: '4px', marginBottom: '15px' }}>{bookingError}</div>}

                    <SeatMap
                        seats={seats}
                        selectedSeats={selectedSeats}
                        onSeatSelect={handleSeatSelect}
                    />

                    <div className="bottom-bar-info">
                        <div className="legend-group"></div>
                        <div className="total-time-info">
                            <div className="info-block">
                                <span className="label">Ghế thường</span>
                            </div>
                            <div className="info-block">
                                <span className="label">Ghế VIP</span>
                            </div>
                            <div className="info-block">
                                <span className="label">Ghế đôi</span>
                            </div>
                        </div>
                        <div className="price-timer-container">
                            <div className="total-price-block">
                                <span className="label">Tổng tiền</span>
                                <span className="value">{calculateTotal().toLocaleString()} vnđ</span>
                            </div>
                            <div className="timer-block">
                                <span className="label">Thời gian còn lại</span>
                                <span className="value">{formatTime(timeLeft)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="booking-sidebar-area">
                    <BookingSummary
                        movie={movie}
                        selectedSeats={selectedSeats}
                        totalPrice={calculateTotal()}
                        onConfirm={handleConfirmBooking}
                        isLoading={isCreatingBooking}
                        error={bookingError}
                    />
                </div>
            </div>
        </div>
    );
};

export default BookingPage;
