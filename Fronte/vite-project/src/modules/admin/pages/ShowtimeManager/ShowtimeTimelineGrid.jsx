import React, { useRef } from 'react';
import { X, Ban } from 'lucide-react';
import './ShowtimeTimelineGrid.css';

// Timeline: 08:00 → 24:00 = 16 hours = 960 minutes
const TIMELINE_START_HOUR = 8;
const TIMELINE_END_HOUR   = 24;
const TOTAL_MINUTES       = (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * 60;
const HOURS = Array.from({ length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1 }, (_, i) => i + TIMELINE_START_HOUR);

const minutesFromStart = (dateStr) => {
    const d = new Date(dateStr);
    return (d.getHours() - TIMELINE_START_HOUR) * 60 + d.getMinutes();
};

const GRADIENT_COLORS = [
    ['#1f6feb', '#388bfd'],
    ['#0d7377', '#14a085'],
    ['#6e2594', '#9b59b6'],
    ['#c0392b', '#e74c3c'],
    ['#b7861a', '#f39c12'],
    ['#1a7a4a', '#27ae60'],
];

const ShowtimeTimelineGrid = ({ showtimes, rooms, onClickShowtime, onCancelShowtime, onPublishShowtime }) => {
    const scrollRef = useRef(null);

    if (!rooms || rooms.length === 0) {
        return (
            <div className="stg-empty">
                <span>Không có phòng nào để hiển thị.</span>
            </div>
        );
    }

    return (
        <div className="stg-wrapper">
            <div className="stg-scroll" ref={scrollRef}>
                {/* ── Header: timeline hours ── */}
                <div className="stg-timeline-header">
                    <div className="stg-room-label-col" />
                    <div className="stg-timeline-track">
                        {HOURS.map(h => (
                            <div key={h} className="stg-hour-mark" style={{ left: `${((h - TIMELINE_START_HOUR) / (TIMELINE_END_HOUR - TIMELINE_START_HOUR)) * 100}%` }}>
                                <span className="stg-hour-label">{String(h).padStart(2, '0')}:00</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Room rows ── */}
                {rooms.map((room, ri) => {
                    const roomShowtimes = showtimes.filter(s => s.roomId === room.roomId);

                    return (
                        <div key={room.roomId} className="stg-room-row">
                            {/* Room label */}
                            <div className="stg-room-label">
                                <span className="stg-room-name">{room.name}</span>
                            </div>

                            {/* Showtime track */}
                            <div className="stg-track">
                                {/* Hour grid lines */}
                                {HOURS.slice(0, -1).map(h => (
                                    <div
                                        key={h}
                                        className="stg-grid-line"
                                        style={{ left: `${((h - TIMELINE_START_HOUR) / (TIMELINE_END_HOUR - TIMELINE_START_HOUR)) * 100}%` }}
                                    />
                                ))}

                                {/* Showtime cards */}
                                {roomShowtimes.filter(st => st.status !== 'cancelled').map((st, idx) => {
                                    const startMin = minutesFromStart(st.startTime);
                                    const endMin   = st.endTime ? minutesFromStart(st.endTime) : startMin + (st.duration || 90);
                                    const leftPct  = Math.max(0, (startMin / TOTAL_MINUTES) * 100);
                                    const widthPct = Math.max(1, ((endMin - startMin) / TOTAL_MINUTES) * 100);
                                    const [c1, c2] = GRADIENT_COLORS[idx % GRADIENT_COLORS.length];
                                    const soldPct  = st.totalSeats > 0 ? Math.round((st.soldSeats / st.totalSeats) * 100) : 0;
                                    const isCancelled = st.status === 'cancelled';
                                    const isDraft = st.status === 'draft';
                                    const startLabel = new Date(st.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

                                    let cardClasses = 'stg-card';
                                    if (isCancelled) cardClasses += ' stg-card--cancelled';
                                    if (isDraft) cardClasses += ' stg-card--draft';

                                    return (
                                        <div
                                            key={st.showtimeId}
                                            className={cardClasses}
                                            style={{ left: `${leftPct}%`, width: `${widthPct}%`, '--c1': c1, '--c2': c2 }}
                                            onClick={() => !isCancelled && onClickShowtime(st)}
                                            title={`${st.movieTitle} | ${startLabel} | ${soldPct}% bán`}
                                        >
                                            <div className="stg-card-inner">
                                                <div className="stg-card-top">
                                                    <span className="stg-card-title">{st.movieTitle}</span>
                                                    <span className="stg-card-time">{startLabel}</span>
                                                </div>
                                                {/* Progress bar */}
                                                <div className="stg-progress-wrap">
                                                    <div
                                                        className="stg-progress-bar"
                                                        style={{ width: `${soldPct}%`, background: `linear-gradient(90deg, ${c1}, ${c2})` }}
                                                    />
                                                </div>
                                                <div className="stg-card-bottom">
                                                    <span className="stg-sold-label">{st.soldSeats}/{st.totalSeats} ghế</span>
                                                    {isDraft && <span className="stg-draft-tag">Bản nháp</span>}
                                                </div>
                                            </div>

                                            {/* Cancel button */}
                                            {!isCancelled && (
                                                <button
                                                    className="stg-cancel-btn"
                                                    title="Hủy suất"
                                                    onClick={e => { e.stopPropagation(); onCancelShowtime(st); }}
                                                >
                                                    <X size={11} />
                                                </button>
                                            )}

                                            {/* Publish button */}
                                            {isDraft && !isCancelled && (
                                                <button
                                                    className="stg-publish-btn"
                                                    title="Xuất bản lên website"
                                                    onClick={e => { e.stopPropagation(); onPublishShowtime(st.showtimeId); }}
                                                >
                                                    Đẩy web
                                                </button>
                                            )}

                                            {isCancelled && (
                                                <div className="stg-cancelled-badge">
                                                    <Ban size={10} /> Đã hủy
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ShowtimeTimelineGrid;
