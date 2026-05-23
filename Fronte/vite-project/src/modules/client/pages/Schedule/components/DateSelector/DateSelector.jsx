import React from 'react';
import './DateSelector.css';

const DateSelector = ({ days, activeTab, onTabChange }) => {
    return (
        <div className="date-selector-container">
            <ul className="date-selector-list">
                {days.map((day) => (
                    <li 
                        key={day.id} 
                        className={`date-selector-item ${activeTab === day.id ? 'active' : ''}`}
                    >
                        <button
                            type="button"
                            onClick={() => onTabChange(day.id)}
                            className="date-selector-btn"
                        >
                            <span className="day-number">{day.dayNumber}</span>
                            <span className="month-year">{day.monthYear}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default DateSelector;
