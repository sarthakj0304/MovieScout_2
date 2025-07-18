import { forwardRef } from "react";

import "../styles/MovieCard.css";

const MovieCard = forwardRef(({ Movie, isAnimating }, ref) => {
  // Movie prop will now have: { movieId, title, genres, poster_url }
  // Note: Using 'Movie' as prop name is fine, but internally 'movie' (lowercase)
  // is often used for consistency with common JS variable naming conventions.

  return (
    <div ref={ref} className={`movie-card ${isAnimating ? "animating" : ""}`}>
      {" "}
      {/* Changed from Movie-card */}
      <div className="movie-card-inner">
        {" "}
        {/* Changed from Movie-card-inner */}
        <div className="movie-cover">
          {" "}
          {/* Changed from Movie-cover */}
          <img
            src={
              Movie.poster_url ||
              "https://cdn.corenexis.com/view/?img=d/ju13/VA9CzJ.jpg"
            }
            alt={Movie.title} // Use the movie title for accessibility
            className="movie-image" // Changed from Movie-image
          />
          <div className="movie-cover-overlay"></div>{" "}
          {/* Changed from Movie-cover-overlay */}
        </div>
        <div className="movie-content">
          {" "}
          {/* Changed from Movie-content */}
          <h2 className="movie-title">{Movie.title}</h2>{" "}
          {/* Changed from Movie-title */}
          {/* Display genres instead of author and description */}
          {Movie.genres && Movie.genres.length > 0 && (
            <div className="movie-genres">
              {" "}
              {/* Changed from Movie-genres */}
              {Movie.genres.map((genre, index) => (
                <span key={index} className="genre-tag">
                  {genre}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="movie-edge"></div> {/* Changed from Movie-edge */}
      </div>
    </div>
  );
});

export default MovieCard;
