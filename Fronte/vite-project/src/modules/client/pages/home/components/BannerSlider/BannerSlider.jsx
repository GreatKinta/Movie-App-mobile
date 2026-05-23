import React, { useState, useEffect } from 'react';
import './BannerSlider.css';

const BannerSlider = ({ movies }) => {
    // Chỉ lấy những phim ĐANG CHIẾU để làm Slide
    const trendingMovies = movies.filter(m => m.status === 'showing').slice(0, 5); // Lấy tối đa 5 phim
    
    const [currentIndex, setCurrentIndex] = useState(0);

    // Tự động chuyển slide sau 5s
    useEffect(() => {
        const interval = setInterval(() => {
            nextSlide();
        }, 5000);
        return () => clearInterval(interval);
    }, [currentIndex]);

    const nextSlide = () => {
        setCurrentIndex((prevIndex) => 
            prevIndex === trendingMovies.length - 1 ? 0 : prevIndex + 1
        );
    };

    const prevSlide = () => {
        setCurrentIndex((prevIndex) => 
            prevIndex === 0 ? trendingMovies.length - 1 : prevIndex - 1
        );
    };

    if (trendingMovies.length === 0) return null;

    return (
        <div className="banner-slider">
            {/* Ảnh Slide */}
            <div 
                className="slider-wrapper" 
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {trendingMovies.map((movie) => (
                    <div className="slide-item" key={movie.id}>
                        {/* Nếu có banner thì dùng banner, không thì dùng poster tạm (nhưng poster sẽ bị vỡ hình nếu kéo ngang) */}
                        <img src={movie.banner || movie.poster} alt={movie.name} />
                        
                        {/* Thông tin phim đè lên ảnh (nếu muốn) */}
                        <div className="slide-caption">
                            {/* <h2>{movie.name}</h2> */}
                        </div>
                    </div>
                ))}
            </div>

            {/* Nút điều hướng Trái/Phải */}
            <button className="nav-btn prev-btn" onClick={prevSlide}>&#10094;</button>
            <button className="nav-btn next-btn" onClick={nextSlide}>&#10095;</button>

            {/* Chấm tròn chỉ số (Dots) */}
            <div className="dots-container">
                {trendingMovies.map((_, index) => (
                    <span 
                        key={index} 
                        className={`dot ${index === currentIndex ? 'active' : ''}`}
                        onClick={() => setCurrentIndex(index)}
                    ></span>
                ))}
            </div>
        </div>
    );
};

export default BannerSlider;