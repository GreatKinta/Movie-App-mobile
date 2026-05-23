import React from 'react';
import './NoteSection.css';

const NoteSection = () => {
    return (
        <div className="note-section-container">
            <div className="note-item">
                <span className="note-color-box note-normal"></span>
                <span className="note-text">Ghế trống</span>
            </div>
            <div className="note-item">
                <span className="note-color-box note-booked"></span>
                <span className="note-text">Ghế đã đặt</span>
            </div>
            <div className="note-item">
                <span className="note-color-box note-vip"></span>
                <span className="note-text">Ghế VIP</span>
            </div>
            {/* Can add more legend items here based on requirements */}
        </div>
    );
};

export default NoteSection;
