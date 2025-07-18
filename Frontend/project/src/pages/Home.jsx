import SwipeMovie from "../components/SwipeMovie.jsx";
import "../styles/Home.css";
import { MovieProvider } from "../contexts/MovieContext.jsx";
function Home() {
  return (
    <div className="home-container">
      <div className="movie-frame">
        {/* Removed movie-frame-top and movie-frame-bottom */}
        <div className="movie-frame-inner">
          <h1 className="page-title">Discover Movies</h1>

          <SwipeMovie />
        </div>
      </div>
    </div>
  );
}

export default Home;
