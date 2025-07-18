import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaHeart, FaUser, FaBars, FaTimes } from "react-icons/fa";
import "../styles/Navbar.css";
import { BiSolidCameraMovie } from "react-icons/bi";
import { AuthContext } from "../../App.jsx";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { setIsAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const response = await fetch("http://localhost:5001/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setIsAuthenticated(false);
        navigate("/login");
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Close mobile menu when location changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Determine if link is active
  const isActive = (path) => {
    return location.pathname === path ? "active" : "";
  };
  // console.log("Navbar component rendering");
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="movie-icon">
            <BiSolidCameraMovie />
          </span>
          <span className="logo-text">MovieScout</span>
        </Link>

        <div
          className="menu-icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <FaTimes /> : <FaBars />}
        </div>

        <ul className={`nav-menu ${mobileMenuOpen ? "active" : ""}`}>
          <li className="nav-item">
            <Link to="/" className={`nav-link ${isActive("/")}`}>
              <BiSolidCameraMovie className="nav-icon" />
              <span>Discover</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/liked" className={`nav-link ${isActive("/liked")}`}>
              <FaHeart className="nav-icon" />
              <span>Liked Movies</span>
            </Link>
          </li>
          <li className="nav-item">
            <button onClick={handleLogout} className={`nav-link`}>
              <FaUser className="nav-icon" />
              <span>Logout</span>
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
