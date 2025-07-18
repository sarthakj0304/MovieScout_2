// frontend/src/pages/SignupPage.js
import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../App.jsx"; // Import AuthContext
import "../styles/Auth.css";

function SignupPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { setIsAuthenticated, API_BASE_URL, checkAuthStatus } =
    useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    try {
      const response = await fetch(`${API_BASE_URL}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include", // IMPORTANT: send cookies with request
      });

      const data = await response.json();

      if (response.ok) {
        setIsAuthenticated(true); // User is logged in upon successful signup
        // localStorage.setItem('username', data.user.username);
        await checkAuthStatus(); // Re-verify status with backend
        navigate("/"); // Redirect to dashboard or home page
      } else {
        setError(
          data.errors
            ? data.errors.join(", ")
            : data.message || "Sign up failed."
        );
      }
    } catch (err) {
      console.error("Network error or server unreachable:", err);
      setError("Could not connect to the server. Please try again later.");
    }
  };

  return (
    <div className="auth-container">
      <h2>Sign Up</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Sign Up</button>
      </form>
      <p>
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
}

export default SignupPage;
