import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import api from '../../../../services/api';
import './PaymentPage.css';

const POLL_INTERVAL_MS = 5000; // kiểm tra mỗi 5 giây

const PaymentPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { movie, selectedSeats, totalPrice, bookingId, orderCode: stateOrderCode, bookingInfo } = location.state || {};

    // Bảo vệ route như hướng dẫn: Nếu không có state -> Đuổi về trang chủ
    useEffect(() => {
        if (!location.state) {
            alert("Bạn chưa chọn ghế nào!");
            navigate("/");
        }
    }, [location.state, navigate]);

    // Dùng orderCode từ state (do BookingService tạo = "DH{id}") hoặc fallback random
    const orderCode = stateOrderCode ?? `DONHANG_${Math.floor(Math.random() * 100000)}`;

    // bookingId thật từ DB (được trả về sau POST /api/bookings)
    const resolvedBookingId = bookingId ?? null;

    // Config SePay từ biến môi trường Vite (.env)
    const sepayBank = import.meta.env.VITE_SEPAY_BANK_NAME;
    // Quay lại dùng Tài khoản ảo (VA) để nhận Webhook ngay lập tức
    const sepayVA = import.meta.env.VITE_SEPAY_VA_ACCOUNT;

    // QR dùng VA -> SePay tự động nhận giao dịch và gửi webhook về backend của bạn
    const qrUrl = `https://qr.sepay.vn/img?acc=${sepayVA}&bank=${sepayBank}&amount=${totalPrice}&des=${orderCode}`;

    const [pollStatus, setPollStatus] = useState('idle');   // idle | polling | paid | error
    const [dotCount, setDotCount] = useState(0);
    const intervalRef = useRef(null);
    const dotRef = useRef(null);

    // Animation cho "Đang kiểm tra..."
    useEffect(() => {
        if (pollStatus === 'polling') {
            dotRef.current = setInterval(() => setDotCount(d => (d + 1) % 4), 500);
        } else {
            clearInterval(dotRef.current);
        }
        return () => clearInterval(dotRef.current);
    }, [pollStatus]);

    // Polling: dùng setTimeout đệ quy để tránh chồng chéo và bền bỉ hơn
    const startPolling = () => {
        if (pollStatus === 'paid' || pollStatus === 'expired') return;

        const checkStatus = async () => {
            try {
                // Thêm query timestamp để tránh trình duyệt cache kết quả HTTP GET báo pending liên tục
                const res = await api.get(`/payment/status/${orderCode}?_t=${Date.now()}`);
                const data = res.data;

                const isPaid = data.paid === true || data.Paid === true || data.status === 'paid' || data.Status === 'paid';

                if (isPaid) {
                    console.log('%c[Payment] ✅ THANH TOÁN THÀNH CÔNG!', 'color: #28a745; font-weight: bold;');
                    setPollStatus('paid');

                    const finalBookingId = data.bookingId || data.BookingId || resolvedBookingId;

                    const nextState = {
                        movie, selectedSeats, totalPrice, orderCode,
                        bookingId: finalBookingId,
                        paidAt: new Date().toISOString()
                    };

                    // Chỉnh hướng
                    navigate('/ticket', { state: nextState });
                    return; // Kết thúc đệ quy
                }

                if (data.status === 'cancelled' || data.status === 'expired') {
                    setPollStatus('expired');
                    return;
                }

                // Nếu chưa trả, đợi 3s rồi check tiếp
                intervalRef.current = setTimeout(checkStatus, 3000);
            } catch (err) {
                console.warn('[Payment] Tín hiệu yếu, đang thử lại...', err.message);
                intervalRef.current = setTimeout(checkStatus, 5000); // Lỗi thì đợi lâu hơn chút
            }
        };

        setPollStatus('polling');
        checkStatus();
    };

    // [FIX LOG] Dọn interval khi component thực sự unmount
    // Lý do: Sửa lỗi React 18 Strict Mode. Khi Strict Mode giả vờ unmount component để test, 
    // lệnh xóa khoảng thời gian (clearInterval) được gọi để hủy vòng lặp cũ.
    // Tuy nhiên, nếu ta không cập nhật intervalRef.current = null, 
    // thì khi component bật lại (remount), biến intervalRef này vẫn còn giữ thẻ ID cũ 
    // khiến hàm startPolling() nghĩ rằng vòng lặp chưa bị hủy và cứ thế Return (không quét mạng).
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, []);

    // TỰ ĐỘNG BẬT RADAR QUÉT THANH TOÁN KHI MỞ TRANG HOẶC KHI REMOUNT (Strict Mode)
    useEffect(() => {
        if (!location.state) return;

        // Nếu status đang là idle hoặc polling, thì luôn đảm bảo interval đang chạy
        if (pollStatus === 'idle' || pollStatus === 'polling') {
            startPolling();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.state, pollStatus]);

    if (!location.state) return null; // Ẩn giao diện trong lúc bị đuổi về

    return (
        <div className="payment-page">
            <div className="payment-container">
                <div className="payment-header">
                    <h2>Thanh Toán Đơn Hàng</h2>
                    <p>Mở ứng dụng ngân hàng và <strong>quét mã QR</strong>. Hệ thống sẽ <strong>tự động</strong> chuyển trang khi bạn thanh toán thành công.</p>
                </div>

                <div className="payment-content">
                    {/* QR Code */}
                    <div className="qr-section">
                        <div className="qr-frame" style={{ position: 'relative' }}>
                            <img src={qrUrl} alt="Mã QR Thanh Toán SePay" className="qr-image" style={pollStatus === 'expired' ? { opacity: 0.2, filter: 'grayscale(100%)' } : {}} />
                            {pollStatus === 'expired' && (
                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#dc3545', fontWeight: 'bold', border: '3px solid #dc3545', padding: '10px 20px', borderRadius: '12px', background: 'rgba(255,255,255,0.95)', zIndex: 10, fontSize: '1.5rem', whiteSpace: 'nowrap', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                    ĐÃ HẾT HẠN
                                </div>
                            )}
                        </div>
                        <div className="payment-instructions">
                            <p>Mở ứng dụng ngân hàng để quét mã QR</p>
                            <p className="timer-note">
                                Nội dung chuyển khoản: <strong>{orderCode}</strong>
                            </p>
                        </div>
                    </div>

                    {/* Chi tiết đơn hàng */}
                    <div className="order-details">
                        <h3>Thông tin vé</h3>
                        <div className="detail-row">
                            <span>Phim:</span>
                            <strong>{movie.title}</strong>
                        </div>
                        <div className="detail-row">
                            <span>Rạp:</span>
                            <span>{movie.theater}</span>
                        </div>
                        <div className="detail-row">
                            <span>Phòng chiếu:</span>
                            <span>{movie.room}</span>
                        </div>
                        <div className="detail-row">
                            <span>Suất chiếu:</span>
                            <span>{movie.showtime} - {movie.showDate}</span>
                        </div>
                        <div className="detail-row">
                            <span>Ghế:</span>
                            <span className="seats-highlight">{selectedSeats.join(', ')}</span>
                        </div>
                        <hr />
                        <div className="detail-row total">
                            <span>Tổng tiền:</span>
                            <span className="total-amount">{totalPrice.toLocaleString()}đ</span>
                        </div>

                        {/* Nút kiểm tra thanh toán */}
                        <button
                            id="confirm-payment-btn"
                            className={`confirm-payment-btn ${pollStatus === 'polling' ? 'polling' : pollStatus === 'expired' ? 'expired' : ''}`}
                            onClick={startPolling}
                            disabled={pollStatus === 'polling' || pollStatus === 'paid' || pollStatus === 'expired'}
                            style={pollStatus === 'expired' ? { backgroundColor: '#dc3545', cursor: 'not-allowed', color: '#fff', border: 'none' } : {}}
                        >
                            {pollStatus === 'polling'
                                ? `Đang xác nhận${'.'.repeat(dotCount)}`
                                : pollStatus === 'paid'
                                    ? '✅ Đã thanh toán!'
                                    : pollStatus === 'expired'
                                        ? '❌ Hết thời gian giữ ghế'
                                        : 'Tôi đã thanh toán'}
                        </button>

                        {pollStatus === 'polling' && (
                            <div className="poll-hint">
                                <p>Hệ thống đang tự động kiểm tra mỗi 5 giây. Vui lòng chờ...</p>
                                <p style={{ fontSize: '11px', color: '#666', marginTop: '10px' }}>
                                    Debug Info: baseURL={api.defaults.baseURL} | state={pollStatus}
                                </p>
                            </div>
                        )}

                        {pollStatus === 'expired' && (
                            <div className="poll-hint error" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                <p style={{ color: '#dc3545', margin: 0 }}>
                                    <strong>Phiên giao dịch đã kết thúc do quá thời gian thanh toán.</strong>
                                </p>
                                <button
                                    onClick={() => navigate('/')}
                                    style={{ padding: '10px 24px', backgroundColor: '#fff', border: '2px solid #dc3545', color: '#dc3545', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', transition: 'all 0.2s ease-in-out' }}
                                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#dc3545'; e.currentTarget.style.color = '#fff'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#dc3545'; }}
                                >
                                    Quay lại trang chủ đặt vé
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;
