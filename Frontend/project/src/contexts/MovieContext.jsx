import { createContext, useState, useEffect, useContext } from "react";
import { AuthContext } from "../../App";
// Create context
const MovieContext = createContext();

async function get_initial_recommendations() {
  const url = "http://localhost:5001/recommend/initial";
  try {
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Failed to fetch initial recommendations: ${response.status} - ${
          errorData.message || response.statusText
        }`
      );
    }
    return response;
  } catch (error) {
    console.error("Network or API error during initial fetch:", error);
    throw error;
  }
}

export function MovieProvider({ children }) {
  // console.log("movie context");

  const [likedMovies, setLikedMovies] = useState([]);
  const [dislikedMovies, setDislikedMovies] = useState([]);
  const [currentMovies, setCurrentMovies] = useState([]);
  const [userId, setUserId] = useState(undefined);
  const { isAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    const fetchInitialRecommendations = async () => {
      try {
        if (!isAuthenticated) return;
        const initialResponse = await get_initial_recommendations();
        const data = await initialResponse.json();
        const initialRecommendations = data.recommendations;
        setUserId(data.userId);

        if (!initialRecommendations || initialRecommendations.length === 0) {
          console.warn("No initial recommendations received or empty array.");
          setCurrentMovies([]);
          return;
        }
        setCurrentMovies(initialRecommendations);
      } catch (error) {
        console.error(
          "Error fetching or setting initial recommendations:",
          error
        );
        setCurrentMovies([]);
      }
    };

    fetchInitialRecommendations();
  }, [isAuthenticated]);

  const likeMovie = (movie) => {
    setLikedMovies((prev) => [...prev, movie]);
  };

  const dislikeMovie = (movie) => {
    // Corrected function name
    setDislikedMovies((prev) => [...prev, movie]);
  };

  const removeMovie = (movieIdToRemove) => {
    setCurrentMovies((prevMovies) =>
      prevMovies.filter((movie) => movie.movieId !== movieIdToRemove)
    );
    // After removing, if only one movie was left, and it's removed, then load more.
    // Use prevMovies.length here as it's the state *before* the filter
    if (
      currentMovies.length === 1 &&
      movieIdToRemove === currentMovies[0].movieId
    ) {
      // console.log("Last movie swiped. Loading more...");
      loadMoreMovies();
    } else if (currentMovies.length === 0) {
      // If somehow all are removed (e.g., fast clicks)
      // console.log("No movies left. Loading more...");
      loadMoreMovies();
    }
  };

  const loadMoreMovies = async () => {
    // Backend expects only latest 5 liked/disliked movie IDs
    const latestLikedMovieIds = likedMovies
      .map((movie) => movie.movieId)
      .slice(-5);
    const latestDislikedMovieIds = dislikedMovies
      .map((movie) => movie.movieId)
      .slice(-5); // Use corrected dislikedMovies state

    if (!userId) {
      console.warn("Cannot load more movies: userId is not defined yet.");
      // Potentially queue a retry or notify user
      return;
    }

    const url = "http://localhost:5001/recommend";
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          likedMovieIds: latestLikedMovieIds,
          dislikedMovieIds: latestDislikedMovieIds,
        }),
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Failed to fetch recommendations: ${response.status} - ${
            errorData.message || response.statusText
          }`
        );
      }

      const data = await response.json();
      const newRecommendations = data.recommendations;

      if (newRecommendations && newRecommendations.length > 0) {
        // Append new movies to the current list
        setCurrentMovies((prev) => [...prev, ...newRecommendations]);
        // console.log("Loaded more movies:", newRecommendations.length);
      } else {
        console.log("No new recommendations received from backend.");
        // Consider what to do if no more recommendations are available.
        // Maybe set a flag so "No more movies!" message persists.
      }
    } catch (err) {
      console.error("Error loading more movies:", err.message);
    }
  };

  const value = {
    likedMovies,
    dislikedMovies, // Use corrected name
    currentMovies,
    likeMovie,
    dislikeMovie, // Use corrected name
    removeMovie,
    loadMoreMovies,
  };

  return (
    <MovieContext.Provider value={value}>{children}</MovieContext.Provider>
  );
}

export function useMovies() {
  return useContext(MovieContext);
}
