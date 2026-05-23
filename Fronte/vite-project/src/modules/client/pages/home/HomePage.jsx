import React, { useState, useEffect } from 'react';
import MovieCard from '../../../../shared/components/movie_card/movie_card.jsx';
import './HomePage.css';
import BannerSlider from './components/BannerSlider/BannerSlider.jsx'

const HomePage = () => {
    // 1. Dữ liệu từ cơ sở dữ liệu (Database Data)
    const [moviesData, setMoviesData] = useState([]);

    // Gọi API Node/Java để lấy danh sách phim thực tế
    useEffect(() => {
        fetch('/api/movies')
            .then(res => res.json())
            .then(data => {
                setMoviesData(data); // Cập nhật state khi tải xong
            })
            .catch(err => console.error("Lỗi khi tải phim từ hệ thống: ", err));
    }, []);

    // 2. Tab State: Quản lý xem đang chọn Tab nào
    const [activeTab, setActiveTab] = useState('showing');

    // 3. Lọc danh sách phim theo Tab đang chọn
    const displayedMovies = moviesData.filter(movie => movie.status === activeTab);

    return (
        <div className="homepage-container">
            {/* Thanh Tab chuyển đổi */}
            <BannerSlider movies={moviesData} />
            <div className="tab-navigation">
                <button
                    className={`tab-btn ${activeTab === 'showing' ? 'active' : ''}`}
                    onClick={() => setActiveTab('showing')}
                >
                    PHIM ĐANG CHIẾU
                </button>
                <button
                    className={`tab-btn ${activeTab === 'coming' ? 'active' : ''}`}
                    onClick={() => setActiveTab('coming')}
                >
                    PHIM SẮP CHIẾU
                </button>
            </div>

            {/* Danh sách phim */}
            <div className="movie-grid">
                {displayedMovies.map((movie) => (
                    <MovieCard key={movie.id} movie={movie} />
                ))}
            </div>
        </div>
    );
};

export default HomePage;