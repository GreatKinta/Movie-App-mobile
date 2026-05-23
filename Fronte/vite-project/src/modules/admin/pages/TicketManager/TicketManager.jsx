import React, { useState, useEffect } from 'react';
import { 
    Ticket, 
    Film, 
    Calendar, 
    Armchair, 
    ChevronRight, 
    CheckCircle2, 
    AlertCircle,
    ArrowLeft,
    Clock,
    MapPin,
    CreditCard
} from 'lucide-react';
import api from '../../../../services/api';
import { adminTicketApi } from '../../../../services/adminTicketApi';
import SeatMap from '../../../client/pages/booking/SeatMap/SeatMap';
import './TicketManager.css';

const TicketManager = () => {
    const [step, setStep] = useState(1);
    const [movies, setMovies] = useState([]);
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [showtimes, setShowtimes] = useState([]);
    const [selectedShowtime, setSelectedShowtime] = useState(null);
    const [seats, setSeats] = useState([]);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successData, setSuccessData] = useState(null);

    // Fetch movies on mount
    useEffect(() => {
        const fetchMovies = async () => {
            setLoading(true);
            try {
                const res = await api.get('/movies?status=showing');
                setMovies(res.data);
            } catch (_err) {
                setError('Không thể tải danh sách phim.');
            } finally {
                setLoading(false);
            }
        };
        fetchMovies();
    }, []);

    // Step 1 -> Step 2: Handle Movie Selection
    const handleSelectMovie = async (movie) => {
        setSelectedMovie(movie);
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/showtimes/movie/${movie.id}`);
            setShowtimes(res.data);
            setStep(2);
        } catch (_err) {
            setError('Không thể tải suất chiếu cho phim này.');
        } finally {
            setLoading(false);
        }
    };

    // Step 2 -> Step 3: Handle Showtime Selection
    const handleSelectShowtime = async (showtime) => {
        setSelectedShowtime(showtime);
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/showtimes/${showtime.showtimeId}/seats`);
            const mappedSeats = res.data.map(seat => ({
                id: seat.rowName + seat.seatNumber,
                row: seat.rowName,
                number: seat.seatNumber.toString().padStart(2, '0'),
                status: seat.status === 'AVAILABLE' ? 'available' : seat.status === 'LOCKED' ? 'holding' : 'booked',
                price: Number(seat.price),
                type: seat.seatTypeName.toLowerCase()
            }));
            setSeats(mappedSeats);
            setStep(3);
        } catch (_err) {
            setError('Không thể tải sơ đồ ghế.');
        } finally {
            setLoading(false);
        }
    };

    // Handle Seat Selection
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

    // Step 3 -> Step 4: Handle Confirmation
    const handleConfirmBooking = async () => {
        if (selectedSeats.length === 0) {
            setError('Vui lòng chọn ít nhất 1 ghế.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const payload = {
                showtimeId: selectedShowtime.showtimeId,
                seatIds: selectedSeats,
                paymentMethod: 'CASH'
            };
            const res = await adminTicketApi.bookAtCounter(payload);
            setSuccessData(res.data);
            setStep(4);
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi tạo vé.');
        } finally {
            setLoading(false);
        }
    };

    const resetFlow = () => {
        setStep(1);
        setSelectedMovie(null);
        setSelectedShowtime(null);
        setSelectedSeats([]);
        setSuccessData(null);
        setError(null);
    };

    const renderSteps = () => (
        <div className="tm-steps">
            {[1, 2, 3].map(i => (
                <div key={i} className={`tm-step ${step >= i ? 'active' : ''} ${step > i ? 'completed' : ''}`}>
                    <div className="tm-step-number">
                        {step > i ? <CheckCircle2 size={16} /> : i}
                    </div>
                    <div className="tm-step-label">
                        {i === 1 ? 'Chọn Phim' : i === 2 ? 'Suất Chiếu' : 'Chọn Ghế'}
                    </div>
                    {i < 3 && <div className="tm-step-line" />}
                </div>
            ))}
        </div>
    );

    return (
        <div className="tm-container">
            <div className="tm-header">
                <div className="tm-header-left">
                    <Ticket className="tm-icon" />
                    <div>
                        <h1>Tạo Vé Tại Quầy</h1>
                        <p>Bán vé và thu tiền trực tiếp cho khách hàng</p>
                    </div>
                </div>
                {step > 1 && step < 4 && (
                    <button className="tm-btn-back" onClick={() => setStep(step - 1)}>
                        <ArrowLeft size={16} /> Quay lại
                    </button>
                )}
            </div>

            {renderSteps()}

            {error && (
                <div className="tm-error-banner">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            {loading && <div className="tm-loader">Đang xử lý...</div>}

            <div className="tm-content">
                {/* STEP 1: SELECT MOVIE */}
                {step === 1 && (
                    <div className="tm-movie-grid">
                        {movies.map(movie => (
                            <div key={movie.id} className="tm-movie-card" onClick={() => handleSelectMovie(movie)}>
                                <div className="tm-movie-poster">
                                    <img src={movie.poster} alt={movie.title} />
                                    <div className="tm-movie-overlay">
                                        <button className="tm-btn-select">Chọn Phim <ChevronRight size={16} /></button>
                                    </div>
                                </div>
                                <div className="tm-movie-info">
                                    <h3>{movie.title}</h3>
                                    <p>{movie.genre} • {movie.duration} phút</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* STEP 2: SELECT SHOWTIME */}
                {step === 2 && (
                    <div className="tm-showtime-view">
                        <div className="tm-selected-movie-info">
                            <img src={selectedMovie.poster} alt={selectedMovie.title} />
                            <div>
                                <h2>{selectedMovie.title}</h2>
                                <p>{selectedMovie.genre} | {selectedMovie.duration} phút</p>
                            </div>
                        </div>
                        
                        <div className="tm-showtime-list">
                            <h3>Chọn suất chiếu</h3>
                            {showtimes.length === 0 ? (
                                <p className="tm-empty">Không có suất chiếu nào khả dụng.</p>
                            ) : (
                                <div className="tm-showtime-grid">
                                    {showtimes.map(st => (
                                        <button key={st.showtimeId} className="tm-showtime-item" onClick={() => handleSelectShowtime(st)}>
                                            <div className="tm-st-time">
                                                <Clock size={16} />
                                                <span>{new Date(st.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <div className="tm-st-details">
                                                <span>{new Date(st.startTime).toLocaleDateString('vi-VN')}</span>
                                                <span className="tm-st-room">{st.roomName}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* STEP 3: SELECT SEATS */}
                {step === 3 && (
                    <div className="tm-seat-view">
                        <div className="tm-seat-layout">
                            <SeatMap 
                                seats={seats}
                                selectedSeats={selectedSeats}
                                onSeatSelect={handleSeatSelect}
                            />
                        </div>
                        
                        <div className="tm-booking-summary">
                            <div className="tm-summary-card">
                                <h3>Thông tin vé</h3>
                                <div className="tm-summary-item">
                                    <Film size={16} />
                                    <span>{selectedMovie.title}</span>
                                </div>
                                <div className="tm-summary-item">
                                    <Clock size={16} />
                                    <span>{new Date(selectedShowtime.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • {new Date(selectedShowtime.startTime).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <div className="tm-summary-item">
                                    <MapPin size={16} />
                                    <span>{selectedShowtime.roomName}</span>
                                </div>
                                <div className="tm-summary-item">
                                    <Armchair size={16} />
                                    <span>{selectedSeats.length > 0 ? selectedSeats.join(', ') : 'Chưa chọn ghế'}</span>
                                </div>
                                
                                <div className="tm-divider" />
                                
                                <div className="tm-total">
                                    <span>Tổng cộng:</span>
                                    <span className="tm-price">{calculateTotal().toLocaleString()}đ</span>
                                </div>

                                <button 
                                    className="tm-btn-confirm" 
                                    disabled={selectedSeats.length === 0 || loading}
                                    onClick={handleConfirmBooking}
                                >
                                    <CreditCard size={18} />
                                    Xác nhận & Thu tiền mặt
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 4: SUCCESS */}
                {step === 4 && (
                    <div className="tm-success-view">
                        <div className="tm-success-card">
                            <div className="tm-success-icon">
                                <CheckCircle2 size={64} />
                            </div>
                            <h2>Đặt vé thành công!</h2>
                            <p>Mã đơn hàng: <strong>{successData?.orderCode}</strong></p>
                            
                            <div className="tm-success-details">
                                <div className="tm-detail-row">
                                    <span>Phim:</span>
                                    <span>{selectedMovie.title}</span>
                                </div>
                                <div className="tm-detail-row">
                                    <span>Suất chiếu:</span>
                                    <span>{new Date(selectedShowtime.startTime).toLocaleString('vi-VN')}</span>
                                </div>
                                <div className="tm-detail-row">
                                    <span>Phòng:</span>
                                    <span>{selectedShowtime.roomName}</span>
                                </div>
                                <div className="tm-detail-row">
                                    <span>Ghế:</span>
                                    <span>{selectedSeats.join(', ')}</span>
                                </div>
                                <div className="tm-detail-row">
                                    <span>Tổng tiền:</span>
                                    <span className="tm-success-price">{calculateTotal().toLocaleString()}đ</span>
                                </div>
                                <div className="tm-detail-row">
                                    <span>Trạng thái:</span>
                                    <span className="tm-badge-paid">ĐÃ THANH TOÁN (CASH)</span>
                                </div>
                            </div>

                            <div className="tm-success-actions">
                                <button className="tm-btn-print" onClick={() => window.print()}>
                                    In hóa đơn / vé
                                </button>
                                <button className="tm-btn-new" onClick={resetFlow}>
                                    Tạo đơn mới
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TicketManager;
