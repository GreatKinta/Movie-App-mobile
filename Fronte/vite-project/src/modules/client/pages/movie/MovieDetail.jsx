import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import MovieCard from '../../../../shared/components/movie_card/movie_card.jsx';
import DateSelector from '../Schedule/components/DateSelector/DateSelector';
import ShowtimeGrid from '../../../../shared/components/ShowtimeGrid/ShowtimeGrid';
import api from '../../../../services/api';
import './MovieDetail.css';

const MovieDetail = () => {
    const { id } = useParams();

    const [movie, setMovie] = useState(null);
    const [relatedMovies, setRelatedMovies] = useState([]);
    const [rawShowtimes, setRawShowtimes] = useState([]);
    const [activeTab, setActiveTab] = useState(null);

    useEffect(() => {
        api.get(`/movies/${id}`)
            .then(res => setMovie(res.data))
            .catch(err => console.error("Lỗi tải phim: ", err));

        api.get('/movies')
            .then(res => {
                const filtered = res.data.filter(m => m.status === 'showing' && m.id.toString() !== id.toString());
                setRelatedMovies(filtered.slice(0, 3));
            })
            .catch(err => console.error("Lỗi tải danh sách phim: ", err));

        api.get(`/showtimes/movie/${id}`)
            .then(res => setRawShowtimes(res.data))
            .catch(err => console.error("Lỗi tải lịch chiếu: ", err));
    }, [id]);

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
    const showtimes = rawShowtimes
        .filter(st => st.startTime.startsWith(selectedDate))
        .map(st => ({
            id: st.showtimeId,
            time: st.startTime.split('T')[1].substring(0, 5),
            fullTime: st.startTime, // Cung cấp thời gian thực
            isLocked: st.isLocked,
            seats: '25' // Default to 25 seats total
        }));

    if (!movie) {
        return <div style={{ textAlign: 'center', padding: '100px', color: '#fff' }}>Đang tải dữ liệu phim...</div>;
    }

    return (
        <div className="movie-detail-container">
            {/* Cột Trái: Nội dung chính */}
            <div className="main-content">
                {/* 1. Banner & Play Button */}
                <div className="hero-banner">
                    <img src={movie.banner} alt="Banner" />
                    <div className="play-button">▶</div>
                </div>

                {/* 2. Thông tin phim (Poster + Details) */}
                <div className="movie-info-section">
                    <div className="poster-box">
                        <img src={movie.poster} alt={movie.name} />
                    </div>
                    <div className="info-box">
                        <h1 className="movie-title">
                            {movie.name}
                            <span className="rating-tag">{movie.ageRating}</span>
                        </h1>
                        <div className="meta-info">
                            <p><span className="meta-label">Đạo diễn:</span> {movie.director}</p>
                            <p><span className="meta-label">Diễn viên:</span> {movie.castMembers}</p>
                            <p><span className="meta-label">Thể loại:</span> {movie.genre}</p>
                            <p><span className="meta-label">Khởi chiếu:</span> {movie.releaseDate}</p>
                            <p><span className="meta-label">Thời lượng:</span> {movie.duration} phút</p>
                            <p className="rating-star">⭐ {movie.rating}/10 (132 votes)</p>
                        </div>
                    </div>
                </div>

                {/* 3. Nội dung phim */}
                <div className="movie-plot">
                    <h3 className="section-title">NỘI DUNG PHIM</h3>
                    <p>{movie.plot}</p>
                </div>

                {/* 4. Lịch chiếu */}
                {movie.status === 'showing' ? (
                    <div className="showtimes-container">
                        <h3 className="section-title">LỊCH CHIẾU</h3>
                        <DateSelector
                            days={days}
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                        />

                        <ShowtimeGrid showtimes={showtimes} />
                    </div>
                ) : (
                    <div className="showtimes-container">
                        <h3 className="section-title">LỊCH CHIẾU</h3>
                        <div style={{ textAlign: 'center', padding: '40px', background: '#F9FAFB', borderRadius: '12px', marginTop: '20px' }}>
                            <p style={{ color: '#6B7280', fontSize: '16px', fontWeight: '500', margin: 0 }}>Hệ thống chưa mở bán vé cho phim này. Vui lòng quay lại sau!</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Cột Phải: Sidebar phim đang chiếu */}
            <div className="sidebar">
                <h3>PHIM ĐANG CHIẾU</h3>
                <div className="sidebar-list">
                    {relatedMovies.map(item => (
                        // Tái sử dụng MovieCard nhưng css có thể cần chỉnh lại xíu nếu muốn nhỏ hơn
                        <div key={item.id} style={{ transform: 'scale(0.9)', transformOrigin: 'top left', marginBottom: '-50px' }}>
                            <MovieCard movie={item} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MovieDetail;