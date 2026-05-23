import React from 'react';
import './SeatMap.css';

const SeatMap = ({ seats, selectedSeats, onSeatSelect }) => {
    // Group seats by row
    const rows = [...new Set(seats.map(seat => seat.row))];

    return (
        <div className="seat-map-container">
            <div className="screen-container">
                <div className="screen-display">MÀN HÌNH CHIẾU</div>
            </div>

            <div className="seats-grid">
                {rows.map(row => (
                    <div key={row} className="seat-row">
                        <span className="row-label">{row}</span>
                        <div className="row-seats">
                            {seats.filter(seat => seat.row === row).map(seat => {
                                const isSelected = selectedSeats.includes(seat.id);
                                const isBooked = seat.status === 'booked' || seat.status === 'holding';

                                return (
                                    <button
                                        key={seat.id}
                                        className={`seat-item ${seat.status} ${isSelected ? 'selected' : ''}`}
                                        onClick={() => !isBooked && onSeatSelect(seat)}
                                        disabled={isBooked}
                                        title={`${seat.row}${seat.number} - ${seat.price.toLocaleString()}đ`}
                                    >
                                        {seat.number}
                                    </button>
                                );
                            })}
                        </div>
                        <span className="row-label">{row}</span>
                    </div>
                ))}
            </div>

            <div className="seat-legend-top">
                <div className="legend-item">
                    <div className="seat-item available"></div>
                    <span>Ghế trống</span>
                </div>
                <div className="legend-item">
                    <div className="seat-item selected"></div>
                    <span>Ghế đang chọn</span>
                </div>
                <div className="legend-item">
                    <div className="seat-item booked"></div>
                    <span>Ghế đã bán</span>
                </div>
                <div className="legend-item">
                    <div className="seat-item holding"></div>
                    <span>Ghế đang giữ</span>
                </div>
                {/* 
                 <div className="legend-item">
                    <div className="seat-item booked-advance"></div>
                    <span>Ghế đặt trước</span>
                </div>
                */}
            </div>
        </div>
    );
};

export default SeatMap;
