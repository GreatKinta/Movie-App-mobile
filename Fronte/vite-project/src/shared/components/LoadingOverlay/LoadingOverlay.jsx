import React from 'react';
import './LoadingOverlay.css';

const LoadingOverlay = ({ text = 'Loading...' }) => {
    return (
        <div className="loading-overlay-container">
            <div className="loading-square">
                <div className="loading-spinner"></div>
                <div className="loading-text">{text}</div>
            </div>
        </div>
    );
};

export default LoadingOverlay;
