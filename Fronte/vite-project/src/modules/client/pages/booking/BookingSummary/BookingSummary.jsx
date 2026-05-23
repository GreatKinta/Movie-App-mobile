import React from 'react';
import './BookingSummary.css';

const BookingSummary = ({ movie, selectedSeats, totalPrice, onConfirm, isLoading, error }) => {
    return (
        <div className="booking-summary">
            <div className="summary-header">
                <img src={movie.moviePoster || movie.poster} alt={movie.title} className="movie-poster" />
                <div className="movie-details">
                    <h3 className="movie-title">{movie.title}</h3>
                    <div className="movie-format">{movie.type}</div>
                </div>
            </div>

            <div className="summary-body">
                <div className="info-row">
                    <span className="info-label">Thể loại</span>
                    <span className="info-value">{movie.tags ? movie.tags.join(', ') : 'N/A'}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Thời lượng</span>
                    <span className="info-value">{movie.duration}</span>
                </div>
                <hr className="divider" />

                <div className="info-row">
                    <span className="info-label">Rạp chiếu</span>
                    <span className="info-value bold">{movie.theater}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Ngày chiếu</span>
                    <span className="info-value">{movie.showDate}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Giờ chiếu</span>
                    <span className="info-value">{movie.showtime}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Phòng chiếu</span>
                    <span className="info-value">{movie.room}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Ghế ngồi</span>
                    <span className="info-value seats-list">
                        {selectedSeats.length > 0 ? selectedSeats.join(', ') : '-'}
                    </span>
                </div>

                <button
                    className={`continue-btn ${isLoading ? 'loading' : ''}`}
                    disabled={selectedSeats.length === 0 || isLoading}
                    onClick={onConfirm}
                >
                    {isLoading ? 'Đang xử lý...' : 'TIẾP TỤC'}
                </button>

                {error && (
                    <p className="booking-error-msg">{error}</p>
                )}
            </div>
        </div>
    );
};

export default BookingSummary;
