import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import Home from "./Pages/Home";
import Inventory from "./Pages/Inventory";
import Batch from "./Pages/Batch";
import Sales from "./Pages/Sales";
import Suppliers from "./Pages/Suppliers";
import Control from "./Pages/Control";
import Login from "./Components/Login";
import SignUp from "./Components/SignUp";
import Sidebar from "./Partials/Sidebar";

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    setIsAuthenticated(!!token);
  }, []);

  if (isAuthenticated === null) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Layout component for authenticated routes
const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen bg-gray-100">
    <Sidebar />
    <main className="flex-1 p-8">{children}</main>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <Home />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <Inventory />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/batch"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <Batch />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <Sales />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/suppliers"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <Suppliers />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/control"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <Control />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        {/* Redirect any other route to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
