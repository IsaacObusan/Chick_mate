import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/Logo.png";

const LoginModal: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("authToken")) {
      navigate("/");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
    const response = await fetch(`${API_BASE_URL}/login`, {
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
    <div className="flex flex-col w-screen h-screen font-sans md:flex-row">
      {/* Left Side - Illustration */}
      <div className="flex flex-col items-center justify-center flex-1 p-6 text-white bg-green-900">
        <img src={Logo} alt="Logo" className="w-40 mb-6 md:w-56" />
        <h1 className="mb-2 text-3xl font-extrabold md:text-4xl">Welcome Back!</h1>
        <p className="max-w-xs text-center text-gray-200">
          Log in to access your dashboard and manage your operations efficiently.
        </p>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex items-center justify-center flex-1 bg-gray-50">
        <div className="w-11/12 max-w-md p-8 bg-white shadow-2xl rounded-3xl md:p-12">
          <h2 className="mb-8 text-3xl font-bold text-center text-gray-800">Sign In</h2>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Input */}
            <div>
              <label className="text-sm font-semibold text-gray-600">Email</label>
              <input
                type="text"
                placeholder="Enter your email"
                className="w-full px-5 py-3 mt-2 transition duration-300 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
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
                className="w-full px-5 py-3 mt-2 transition duration-300 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Error Message */}
            {error && <p className="text-sm text-center text-red-500">{error}</p>}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-lg font-semibold text-white transition duration-300 bg-green-600 shadow-lg hover:bg-green-700 rounded-xl"
            >
              {loading ? "Signing in..." : "Login"}
            </button>

            {/* Sign Up Redirect */}
            <div className="mt-4 text-sm text-center">
              <span className="text-gray-500">Don't have an account? </span>
              <button
                type="button"
                onClick={handleSignUpRedirect}
                className="font-semibold text-green-600 hover:underline"
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