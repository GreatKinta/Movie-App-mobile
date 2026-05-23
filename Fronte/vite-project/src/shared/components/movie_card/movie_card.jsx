import React from 'react';
import './movie_card.css';
import { Link } from 'react-router-dom';
import Button from '../Button/Button'; // Import Button Component


const MovieCard = ({movie}) => {
    return (
        <div className="movie-card">
            {/* Phần ảnh poster */}
            <div className="movie-poster">
                <img src={movie.poster} alt={movie.name} />
                
                {/* Lớp phủ đen (Overlay) */}
                <div className="overlay">
                    {movie.status === 'showing' ? (
                        <Link to={`/movie/${movie.id}`}>
                            <Button className="btn-buy-ticket">
                                MUA VÉ
                            </Button>
                        </Link>
                    ) : (
                        <Link to={`/movie/${movie.id}`}>
                            <Button className="btn-buy-ticket" style={{ backgroundColor: '#4B5563', boxShadow: '0 8px 20px rgba(75, 85, 99, 0.3)' }}>
                                CHI TIẾT
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
            {/* Phần thông tin phim */}
            <div className="movie-info">
                <h3 className="movie-card-name">
                    <Link to={`/movie/${movie.id}`}>{movie.name || movie.title}</Link>
                </h3>
                <div className="movie-card-details">
                    <span className="movie-card-genre">{movie.genre}</span>
                    <span className="movie-card-duration">⏱ {movie.duration} phút</span>
                </div>
            </div>
        </div>
    );
}

export default MovieCard;