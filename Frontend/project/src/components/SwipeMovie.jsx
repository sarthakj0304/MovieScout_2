// src/components/SwipeMovie.jsx
import { useState, useRef, useEffect } from "react";
import TinderCard from "react-tinder-card";
import { useSpring, animated } from "@react-spring/web";
import MovieCard from "./MovieCard.jsx";
import { useMovies } from "../contexts/MovieContext.jsx";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import "../styles/SwipeMovie.css";
import { AuthContext } from "../../App.jsx";
import { useContext } from "react";

function SwipeMovie() {
  // console.log("swipe movie");
  const { isAuthenticated } = useContext(AuthContext);
  // console.log("Is authenticated is ", isAuthenticated);

  const { currentMovies, likeMovie, dislikeMovie, removeMovie } = useMovies();

  const [swipeDirection, setSwipeDirection] = useState(null);
  const [lastDirection, setLastDirection] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const cardRefs = useRef([]);

  // 🆕 Prevent spamming swipes
  const isProcessingRef = useRef(false);

  const emptyAnimation = useSpring({
    opacity: currentMovies.length === 0 ? 1 : 0,
    transform:
      currentMovies.length === 0 ? "translateY(0px)" : "translateY(20px)",
  });

  const onSwipe = (direction, Movie) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    setLastDirection(direction);
    setSwipeDirection(direction);
    setIsAnimating(true);

    setTimeout(() => {
      if (direction === "right") {
        likeMovie(Movie);
      } else if (direction === "left") {
        // Handle dislike
        dislikeMovie(Movie);
      }

      removeMovie(Movie.movieId); // <--- Call the new removeMovie with movie.movieId

      setIsAnimating(false);
      setSwipeDirection(null);
      isProcessingRef.current = false;
    }, 500);
  };

  const swipe = (direction) => {
    if (currentMovies.length === 0 || isAnimating || isProcessingRef.current)
      return;
    const topIndex = currentMovies.length - 1;
    cardRefs.current[topIndex]?.swipe(direction);
  };

  return (
    <div className="swipe-container">
      <div className="swipe-area">
        {currentMovies.length > 0 ? (
          currentMovies.map((Movie, index) => (
            <TinderCard
              key={Movie.movieId}
              ref={(ref) => (cardRefs.current[index] = ref)}
              onSwipe={(dir) => onSwipe(dir, Movie)}
              preventSwipe={["up", "down"]}
              className={`swipe-card ${
                swipeDirection === "left" ? "swiping-left" : ""
              } ${swipeDirection === "right" ? "swiping-right" : ""}`}
            >
              <MovieCard Movie={Movie} isAnimating={isAnimating} />
            </TinderCard>
          ))
        ) : (
          <animated.div style={emptyAnimation} className="no-movies">
            {" "}
            {/* Corrected class name here */}
            <h2>No more Movies!</h2>
            <p>Come back later for more recommendations.</p>
          </animated.div>
        )}

        {/* Swipe buttons are now the arrows on the side of the card */}
        <div className="swipe-buttons">
          <button
            className="swipe-button dislike"
            onClick={() => swipe("left")}
            disabled={currentMovies.length === 0 || isAnimating}
            aria-label="Discard movie"
          >
            <FaArrowLeft />
            {/* Removed "Discard" text */}
          </button>
          <button
            className="swipe-button like"
            onClick={() => swipe("right")}
            disabled={currentMovies.length === 0 || isAnimating}
            aria-label="Like movie"
          >
            {/* Removed "Like" text */}
            <FaArrowRight />
          </button>
        </div>

        {lastDirection && (
          <div className="swipe-info">Last swipe: {lastDirection}</div>
        )}
      </div>
    </div>
  );
}

export default SwipeMovie;
