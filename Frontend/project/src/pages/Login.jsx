// frontend/src/pages/LoginPage.js
import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../App.jsx"; // Import AuthContext
import "../styles/Auth.css";
function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { setIsAuthenticated, checkAuthStatus } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    try {
      const response = await fetch(`http://localhost:5001/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include", //send cookies with request
      });

      const data = await response.json();

      if (response.ok) {
        const statusRes = await fetch("http://localhost:5001/status", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (statusRes.ok) {
          const data = await statusRes.json();
          // ✅ Step 2: Update context state after real confirmation
          setIsAuthenticated(true);
          navigate("/"); // Now go to home
        } else {
          console.error("Session not ready.");
        } // Redirect to dashboard or home page
      } else {
        setError(
          data.errors ? data.errors.join(", ") : data.message || "Login failed."
        );
      }
    } catch (err) {
      console.error("Network error or server unreachable:", err);
      setError("Could not connect to the server. Please try again later.");
    }
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>
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
        <button type="submit">Login</button>
      </form>
      <p>
        Don't have an account? <Link to="/signup">Sign Up here</Link>
      </p>
    </div>
  );
}

export default LoginPage;
