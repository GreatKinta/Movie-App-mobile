import React, { useState, useEffect } from 'react';
import './LichChieu.css';
import DateSelector from './components/DateSelector/DateSelector';
import NoteSection from './components/NoteSection/NoteSection';
import MovieItem from './components/MovieItem/MovieItem';
import api from '../../../../services/api';

const LichChieu = () => {
    const [activeTab, setActiveTab] = useState(null);
    const [realMovies, setRealMovies] = useState([]);
    const [rawShowtimes, setRawShowtimes] = useState([]);

    useEffect(() => {
        api.get('/movies')
            .then(res => {
                setRealMovies(res.data.filter(m => m.status === 'showing'));
            })
            .catch(err => console.error("Lỗi khi tải phim: ", err));

        api.get('/showtimes')
            .then(res => setRawShowtimes(res.data))
            .catch(err => console.error("Lỗi tải lịch chiếu: ", err));
    }, []);

    // Grouping logic for DateSelector
    const uniqueDates = [...new Set(rawShowtimes.map(st => st.startTime.split('T')[0]))].sort();

    const days = uniqueDates.map((dateStr, index) => {
        const d = new Date(dateStr);
        return {
            id: `tab-id-${index}`,
            dateValue: dateStr,
            dayNumber: d.getDate().toString().padStart(2, '0'),
            monthYear: `/${(d.getMonth() + 1).toString().padStart(2, '0')} - ${d.toLocaleDateString('vi-VN', { weekday: 'short' })}`
        };
    });

    // Auto-select first date tab when data arrives
    useEffect(() => {
        if (days.length > 0 && !activeTab) {
            setActiveTab(days[0].id);
        }
    }, [days, activeTab]);

    const selectedDate = days.find(d => d.id === activeTab)?.dateValue;

    return (
        <div className="schedule-page-wrapper">
            <div className="schedule-container">
                <DateSelector
                    days={days}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />

                <div className="schedule-content">
                    {days.length > 0 ? days.map((item) => (
                        <div
                            key={item.id}
                            className={`schedule-tab-pane ${activeTab === item.id ? 'active' : ''}`}
                        >
                            <NoteSection />
                            <div className="movies-list">
                                {realMovies.length > 0 ? (
                                    realMovies.map((movie) => {
                                        // Loc showtimes cho phim nay trong ngay nay
                                        const movieShowtimes = rawShowtimes
                                            .filter(st => st.movieId === movie.id && st.startTime.startsWith(item.dateValue))
                                            .map(st => ({
                                                id: st.showtimeId,
                                                time: st.startTime.split('T')[1].substring(0, 5),
                                                fullTime: st.startTime, // Cung cấp thời gian thực để chặn bấm khi quá giờ
                                                isLocked: st.isLocked,
                                                seats: '25'
                                            }));

                                        if (movieShowtimes.length === 0) return null; // Không chiếu ngày này thì hide phim

                                        return <MovieItem key={movie.id} movie={{ ...movie, showtimes: movieShowtimes, type: '2D PHỤ ĐỀ' }} />;
                                    })
                                ) : (
                                    <div className="empty-state">Đang tải phim...</div>
                                )}
                            </div>
                        </div>
                    )) : (
                        <div className="empty-state">Hệ thống hiện chưa có lịch chiếu mới.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LichChieu;

