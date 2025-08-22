import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/Logo.png";

const LoginModal: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("http://localhost:8080/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: username, password }),
    });

    if (response.ok) {
      const userData = await response.json();
      localStorage.setItem("authToken", "dummy-token"); // Set auth token for protected routes
      localStorage.setItem("username", userData.username);
      localStorage.setItem("email", userData.email);
      localStorage.setItem("profilePic", userData.profilePic);
      localStorage.setItem("role", userData.role);
      navigate("/");
    } else {
      const errorText = await response.text();
      setError(errorText || "Invalid username or password");
    }
  };

  const handleSignUpRedirect = () => {
    navigate("/signup");
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen font-sans">
      {/* Left Side - Illustration */}
      <div className="flex-1 flex flex-col items-center justify-center bg-green-900 text-white p-6">
        <img src={Logo} alt="Logo" className="w-40 md:w-56 mb-6" />
        <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Welcome Back!</h1>
        <p className="text-gray-200 text-center max-w-xs">
          Log in to access your dashboard and manage your operations efficiently.
        </p>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-3xl p-8 md:p-12 w-11/12 max-w-md shadow-2xl">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">Sign In</h2>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Input */}
            <div>
              <label className="text-sm font-semibold text-gray-600">Email</label>
              <input
                type="text"
                placeholder="Enter your email"
                className="mt-2 w-full px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-300"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="text-sm font-semibold text-gray-600">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                className="mt-2 w-full px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Error Message */}
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold text-lg transition duration-300 shadow-lg"
            >
              {loading ? "Signing in..." : "Login"}
            </button>

            {/* Sign Up Redirect */}
            <div className="text-center mt-4 text-sm">
              <span className="text-gray-500">Don't have an account? </span>
              <button
                type="button"
                onClick={handleSignUpRedirect}
                className="text-green-600 font-semibold hover:underline"
              >
                Sign Up
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
