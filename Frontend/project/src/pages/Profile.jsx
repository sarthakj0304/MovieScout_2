import { useState, useEffect } from "react";
import { FaUser, FaMovieReader, FaHeart, FaClock } from "react-icons/fa";
import { useMovies } from "../contexts/MovieContext";
import "../styles/Profile.css";

function Profile() {
  const { likedMovies } = useMovies();
  const [isLoaded, setIsLoaded] = useState(false);

  // Dummy user data
  const userData = {
    name: "Jane Austen",
    email: "jane.austen@example.com",
    joinDate: "March 15, 2023",
    bio: "Avid Movie enjoyer and classic Movies enthusiast. I enjoy discovering new worlds through Movies.",
    favoriteGenres: ["Animation", "Comedy", "Mystery", "Romance"],
    totalMoviesRead: 127,
    avatar:
      "https://images.pexels.com/photos/762020/pexels-photo-762020.jpeg?auto=compress&cs=tinysrgb&w=600",
  };

  // Calculate reading stats
  const readingStats = {
    MoviesLiked: likedMovies.length,
    readingStreak: 14, // Days
    favGenre: "Classic Literature",
    avgRating:
      likedMovies.length > 0
        ? (
            likedMovies.reduce((sum, Movie) => sum + Movie.rating, 0) /
            likedMovies.length
          ).toFixed(1)
        : "N/A",
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`profile-container ${isLoaded ? "loaded" : ""}`}>
      <div className="Movie-frame">
        <div className="Movie-frame-top"></div>
        <div className="Movie-frame-inner">
          <h1 className="page-title">Your Reading Profile</h1>

          <div className="profile-content">
            <div className="profile-header">
              <div className="profile-avatar-container">
                <img
                  src={userData.avatar}
                  alt={userData.name}
                  className="profile-avatar"
                />
              </div>
              <div className="profile-info">
                <h2 className="profile-name">{userData.name}</h2>
                <p className="profile-email">{userData.email}</p>
                <p className="profile-join-date">
                  <FaClock className="profile-icon" />
                  Member since {userData.joinDate}
                </p>
              </div>
            </div>

            <div className="profile-bio">
              <h3>About Me</h3>
              <p>{userData.bio}</p>
            </div>

            <div className="profile-stats">
              <h3>Reading Statistics</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <FaMovieReader className="stat-icon" />
                  <div className="stat-value">{userData.totalMoviesRead}</div>
                  <div className="stat-label">Movies Read</div>
                </div>
                <div className="stat-card">
                  <FaHeart className="stat-icon" />
                  <div className="stat-value">{readingStats.MoviesLiked}</div>
                  <div className="stat-label">Movies Liked</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📈</div>
                  <div className="stat-value">{readingStats.readingStreak}</div>
                  <div className="stat-label">Day Streak</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">⭐</div>
                  <div className="stat-value">{readingStats.avgRating}</div>
                  <div className="stat-label">Avg Rating</div>
                </div>
              </div>
            </div>

            <div className="profile-genres">
              <h3>Favorite Genres</h3>
              <div className="genre-tags">
                {userData.favoriteGenres.map((genre, index) => (
                  <span key={index} className="genre-tag">
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="Movie-frame-bottom"></div>
      </div>
    </div>
  );
}

export default Profile;
