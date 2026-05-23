import React from 'react';
import ShowtimeGrid from '../../../../../../shared/components/ShowtimeGrid/ShowtimeGrid';
import MovieCard from '../../../../../../shared/components/movie_card/movie_card';
import './MovieItem.css';

const MovieItem = ({ movie }) => {
    const { type, showtimes } = movie;

    return (
        <article className="movie-item-container">
            {/* Left side: Movie Card (Poster + Title + Details) */}
            <div className="movie-card-wrapper">
                <MovieCard movie={movie} />
            </div>

            {/* Right side: Showtimes grid */}
            <div className="movie-item-right">
                <div className="showtimes-section">
                    <h3 className="showtimes-type">{type}</h3>
                    <ShowtimeGrid showtimes={showtimes} />
                </div>
            </div>
        </article>
    );
};

export default MovieItem;
