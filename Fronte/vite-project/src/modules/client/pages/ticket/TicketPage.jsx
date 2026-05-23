import React, { useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import './TicketPage.css';

const TicketPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { movie, selectedSeats, totalPrice, orderCode, paidAt } = location.state || {};

    // Format thời gian thanh toán
    const formatPaidAt = (iso) => {
        if (!iso) return '';
        const d = new Date(iso);
        return d.toLocaleString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    useEffect(() => {
        if (!location.state) navigate('/');
    }, [location.state, navigate]);

    if (!location.state) return null;

    const handlePrint = () => window.print();

    return (
        <div className="ticket-page">
            {/* Nút hành động (ẩn khi in) */}
            <div className="ticket-actions no-print">
                <Link to="/" className="action-btn home-btn">← Về trang chủ</Link>
                <button className="action-btn print-btn" onClick={handlePrint}>🖨️ In vé</button>
            </div>

            {/* Vé chính */}
            <div className="ticket-wrapper">
                {/* Header vé */}
                <div className="ticket-header">
                    <div className="ticket-brand">🎬 WebPhim</div>
                    <div className="ticket-success-badge">
                        <span className="check-icon">✓</span>
                        <span>Đặt vé thành công!</span>
                    </div>
                </div>

                {/* Body vé */}
                <div className="ticket-body">
                    {/* Poster + tên phim */}
                    <div className="ticket-movie-section">
                        <img
                            src={movie.poster}
                            alt={movie.title}
                            className="ticket-poster"
                        />
                        <div className="ticket-movie-info">
                            <h1 className="ticket-movie-title">{movie.title}</h1>
                            {movie.originalTitle && (
                                <p className="ticket-original-title">{movie.originalTitle}</p>
                            )}
                            <div className="ticket-tags">
                                {(movie.tags || []).map(tag => (
                                    <span key={tag} className="ticket-tag">{tag}</span>
                                ))}
                                {movie.type && <span className="ticket-tag tag-type">{movie.type}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Đường cắt vé */}
                    <div className="ticket-divider">
                        <div className="ticket-notch left" />
                        <div className="ticket-dashes" />
                        <div className="ticket-notch right" />
                    </div>

                    {/* Chi tiết vé */}
                    <div className="ticket-details">
                        <div className="ticket-detail-grid">
                            <div className="ticket-detail-item">
                                <span className="detail-label">📍 Rạp chiếu</span>
                                <span className="detail-value">{movie.theater}</span>
                            </div>
                            <div className="ticket-detail-item">
                                <span className="detail-label">🎭 Phòng</span>
                                <span className="detail-value">{movie.room}</span>
                            </div>
                            <div className="ticket-detail-item">
                                <span className="detail-label">🕐 Suất chiếu</span>
                                <span className="detail-value">{movie.showtime}</span>
                            </div>
                            <div className="ticket-detail-item">
                                <span className="detail-label">📅 Ngày chiếu</span>
                                <span className="detail-value">{movie.showDate}</span>
                            </div>
                            <div className="ticket-detail-item">
                                <span className="detail-label">💺 Ghế ngồi</span>
                                <span className="detail-value seats">{(selectedSeats || []).join(' · ')}</span>
                            </div>
                            <div className="ticket-detail-item">
                                <span className="detail-label">⏱ Thời lượng</span>
                                <span className="detail-value">{movie.duration || '—'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Đường cắt vé thứ 2 */}
                    <div className="ticket-divider">
                        <div className="ticket-notch left" />
                        <div className="ticket-dashes" />
                        <div className="ticket-notch right" />
                    </div>

                    {/* Footer vé: mã đơn + tổng tiền */}
                    <div className="ticket-footer">
                        <div className="ticket-order-info">
                            <span className="detail-label">Mã đơn hàng</span>
                            <span className="ticket-order-code">{orderCode}</span>
                        </div>
                        <div className="ticket-order-info">
                            <span className="detail-label">Thanh toán lúc</span>
                            <span className="detail-value">{formatPaidAt(paidAt)}</span>
                        </div>
                        <div className="ticket-order-info">
                            <span className="detail-label">Tổng tiền</span>
                            <span className="ticket-total">{(totalPrice || 0).toLocaleString()}đ</span>
                        </div>
                    </div>
                </div>

                {/* QR barcode giả simulation */}
                <div className="ticket-qr-bottom no-print">
                    <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${orderCode}`}
                        alt="Mã QR vé"
                        className="ticket-barcode"
                    />
                    <p className="ticket-scan-hint">Xuất trình mã này tại quầy soát vé</p>
                </div>
            </div>
        </div>
    );
};

export default TicketPage;
