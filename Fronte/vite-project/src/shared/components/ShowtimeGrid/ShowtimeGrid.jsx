import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ShowtimeGrid.css';

const ShowtimeGrid = ({ showtimes }) => {
    const navigate = useNavigate();

    if (!showtimes || showtimes.length === 0) {
        return (
            <p style={{ marginTop: '20px', fontStyle: 'italic', color: '#666' }}>
                Không có lịch chiếu.
            </p>
        );
    }

    const handleSelectShowtime = (showtime) => {
        // Fallback id if not provided, just in case
        const showtimeId = showtime.id || '1';
        navigate(`/booking/${showtimeId}`);
    };

    return (
        <div className="showtimes-grid">
            {showtimes.map((item, index) => {
                // Kiểm tra xem giờ lịch chiếu đã quá 15 phút chưa hoặc đã có cờ isLocked
                const isExpired = item.isLocked || 
                    (item.startTime ? new Date() > new Date(new Date(item.startTime).getTime() + 15 * 60 * 1000) : false) || 
                    (item.fullTime ? new Date() > new Date(new Date(item.fullTime).getTime() + 15 * 60 * 1000) : false);

                return (
                    <div key={index} className="showtime-card">
                        <button 
                            onClick={() => !isExpired && handleSelectShowtime(item)} 
                            className={`showtime-btn ${isExpired ? 'expired' : ''}`}
                            disabled={isExpired}
                            title={isExpired ? "Suất chiếu này đã khóa (quá 15 phút từ giờ bắt đầu)" : ""}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: isExpired ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: isExpired ? 0.5 : 1, filter: isExpired ? 'grayscale(100%)' : 'none' }}
                        >
                            <span className="showtime-time" style={{ textDecoration: isExpired ? 'line-through' : 'none' }}>{item.time}</span>
                            <span className="showtime-seats" style={{ color: isExpired ? '#999' : '' }}>
                                {isExpired ? 'Đã khóa' : `${item.seats} ghế trống`}
                            </span>
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

export default ShowtimeGrid;
