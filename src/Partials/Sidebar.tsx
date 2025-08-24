import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

import Logo from "../assets/Logo.png";
import Home from "../assets/Home.png";
import Batch from "../assets/Batch.png";
import Inventory from "../assets/Inventory.png";
import Sales from "../assets/Sales.png";
import Control from "../assets/Control.png";

const navItems = [
  { name: "Home", path: "/", icon: Home },
  { name: "Inventory", path: "/inventory", icon: Inventory },
  { name: "Batch", path: "/batch", icon: Batch },
  { name: "Sales", path: "/sales", icon: Sales },
  { name: "Control", path: "/control", icon: Control },
];

const LogoutIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-5 h-5 text-white"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
    />
  </svg>
);

const Sidebar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    console.log("Logged out");
    localStorage.removeItem("authToken");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    localStorage.removeItem("profilePic");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const username = localStorage.getItem("username") || "Guest";
  const email = localStorage.getItem("email") || "guest@example.com";
  const profilePic = localStorage.getItem("profilePic");
  const role = localStorage.getItem("role");

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="flex-col hidden w-64 min-h-screen pb-10 bg-green-800 shadow-lg md:flex">
        <div className="flex items-center justify-center py-6 border-b border-green-800">
          <img src={Logo} alt="Logo" className="h-auto w-50" />
        </div>

        {/* Profile Placeholder */}
        <div className="flex items-center gap-4 px-6 py-4 mt-6">
          <img
            src={profilePic ? `http://localhost:8080/uploads/${profilePic}` : "https://via.placeholder.com/40"}
            alt="Profile"
            className="w-10 h-10 rounded-full"
          />
          <div className="flex flex-col">
            <p className="text-lg font-semibold text-white">{username}</p>
            <p className="text-sm text-green-200">{email}</p>
            {role && <p className="text-xs text-green-300">{role}</p>}
          </div>
        </div>

        <nav className="flex flex-col flex-1 mt-6">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-4 px-6 py-4 w-full text-lg transition-colors duration-200 ${
                  isActive
                    ? "bg-green-700 text-white font-semibold"
                    : "text-white hover:bg-green-500 hover:text-white"
                }`
              }
              end={item.path === "/"}
            >
              <img src={item.icon} alt={item.name} className="w-6 h-6" />
              <span className="flex-1">{item.name}</span>
            </NavLink>
          ))}

          {/* Desktop Logout Button (transparent) */}
          <button
            onClick={handleLogout}
            className="flex items-center w-full gap-3 px-6 py-4 mt-auto text-lg text-white transition-colors duration-200 bg-transparent hover:bg-green-700 hover:text-white"
          >
            <LogoutIcon />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Mobile Top Bar with Logo and Logout */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-4 bg-green-800 shadow-lg md:hidden">
        <img src={Logo} alt="Logo" className="w-auto h-10" />
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <p className="text-sm text-green-200">{email}</p>
            {role && <span className="text-xs text-green-300">{role}</span>}
          </div>
          <img
            src={profilePic ? `http://localhost:8080/uploads/${profilePic}` : "https://via.placeholder.com/32"}
            alt="Profile"
            className="w-8 h-8 rounded-full"
          />
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1 text-white transition-colors duration-200 bg-transparent rounded hover:bg-green-700"
          >
            <LogoutIcon />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-around py-2 bg-green-800 shadow-lg md:hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center text-xs transition-colors duration-200 ${
                isActive ? "text-white font-semibold" : "text-green-200 hover:text-white"
              }`
            }
            end={item.path === "/"}
          >
            <img src={item.icon} alt={item.name} className="w-6 h-6 mb-1" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>

      {/* Spacer to prevent bottom nav overlap */}
      <div className="h-16 md:hidden" />
    </>
  );
};

export default Sidebar;