// src/components/LikedMovies.jsx (or where your component resides)

import { useState, useEffect } from "react";
import { useMovies } from "../contexts/MovieContext";
import { FaHeart, FaTrash } from "react-icons/fa";
import "../styles/LikedMovies.css";
import { MovieProvider } from "../contexts/MovieContext";
function LikedMovies() {
  const { likedMovies, unlikeMovie } = useMovies(); // Use consistent naming (lowercase)
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`liked-movies-container ${isLoaded ? "loaded" : ""}`}>
      {/* Removed Movie-frame, Movie-frame-top, Movie-frame-bottom as they are not needed on this page.
          The liked-movies-container itself will act as the main frame. */}
      <div className="liked-movies-content-wrapper">
        <h1 className="page-title">Your Liked Movies</h1>
        <p className="page-subtitle">
          <FaHeart className="heart-icon" /> Movies you've added to your
          collection
        </p>
        {likedMovies.length === 0 ? (
          <div className="no-movies-message">
            <p>You haven't liked any movies yet.</p>
            <p>Start swiping to discover movies you might enjoy!</p>
          </div>
        ) : (
          <div className="liked-movies-grid">
            {likedMovies.map(
              (
                movie // Changed Movie to movie for consistency
              ) => (
                <div className="liked-movie-card" key={movie.movieId}>
                  {" "}
                  {/* Changed MovieId to movieId for consistency */}
                  <div className="movie-image-container">
                    <img
                      src={movie.poster_url}
                      alt={movie.title}
                      className="liked-movie-image"
                    />
                    <button
                      className="remove-button"
                      onClick={() => unlikeMovie(movie.movieId)} // Changed MovieId to movieId
                      aria-label="Remove movie"
                    >
                      <FaTrash />
                    </button>
                  </div>
                  <div className="liked-movie-details">
                    <h3 className="liked-movie-title">{movie.title}</h3>
                    {movie.genres && movie.genres.length > 0 && (
                      <div className="liked-movie-genres">
                        {movie.genres.map((genre, index) => (
                          <span key={index} className="genre-tag">
                            {genre}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default LikedMovies;
