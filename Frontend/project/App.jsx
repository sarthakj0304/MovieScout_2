import { useState, useEffect } from "react";

import { Routes, Route } from "react-router-dom";

import Navbar from "./src/components/Navbar.jsx";
import Home from "./src/pages/Home.jsx";
import LikedMovies from "./src/pages/LikedMovies.jsx";

import { MovieProvider } from "./src/contexts/MovieContext.jsx";
import "./src/styles/App.css";
import LoginPage from "./src/pages/Login.jsx";
import SignupPage from "./src/pages/Signup.jsx";
import { createContext, useContext } from "react";
import { Navigate } from "react-router-dom";
// Context for user authentication state
export const AuthContext = createContext(null);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // used to check if the user is loggen in or not
  const [appLoaded, setAppLoaded] = useState(false);

  const API_BASE_URL = "http://localhost:5001";

  useEffect(() => {
    // Simulate initial content loading or data fetching
    const timer = setTimeout(() => {
      setAppLoaded(true);
    }, 100); // Small delay for the fade-in effect

    return () => clearTimeout(timer);
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch(`http://localhost:5001/status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // IMPORTANT: send cookies with request
      });
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Failed to check authentication status:", error);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAuthStatus(); // Check auth status on initial app load
  }, []);

  const authContextValue = {
    isAuthenticated,
    setIsAuthenticated,
    checkAuthStatus,
    API_BASE_URL,
  };

  return (
    <div className={`app ${appLoaded ? "loaded" : ""}`}>
      <AuthContext.Provider value={authContextValue}>
        {isAuthenticated && <Navbar />}

        <div className="app-container">
          <main className="content">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              <Route
                path="/"
                element={
                  <MovieProvider>
                    <ProtectedRoute element={Home} />
                  </MovieProvider>
                }
              />
              <Route
                path="/liked"
                element={
                  <MovieProvider>
                    <ProtectedRoute element={LikedMovies} />
                  </MovieProvider>
                }
              />
            </Routes>
          </main>
        </div>
      </AuthContext.Provider>
    </div>
  );
}

// Local ProtectedRoute component
function ProtectedRoute({ element: Element }) {
  const { isAuthenticated, authLoading } = useContext(AuthContext);

  if (authLoading) {
    return <div className="loading-screen">Checking authentication...</div>;
  }

  // If not authenticated, redirect to login page
  if (!isAuthenticated) {
    // console.log("redirecting to login page as you are not logged in");
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the provided element (component)
  return <Element />;
}

export default App;
