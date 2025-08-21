import React from "react";
import { NavLink } from "react-router-dom";

import Logo from "../assets/Logo.png";
import HomeIcon from "../assets/Home.png";
import InventoryIcon from "../assets/Inventory.png";
import BatchIcon from "../assets/Batch.png";
import SalesIcon from "../assets/Sales.png";
import SuppliersIcon from "../assets/Supplier.png";
import ControlIcon from "../assets/Control.png";

const navItems = [
  { name: "Home", path: "/", icon: HomeIcon },
  { name: "Inventory", path: "/inventory", icon: InventoryIcon },
  { name: "Batch", path: "/batch", icon: BatchIcon },
  { name: "Sales", path: "/sales", icon: SalesIcon },
  { name: "Suppliers", path: "/suppliers", icon: SuppliersIcon },
  { name: "Control", path: "/control", icon: ControlIcon },
];

const Sidebar: React.FC = () => {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="flex-col hidden w-64 min-h-screen pb-10 bg-green-800 shadow-lg md:flex">
        <div className="flex items-center justify-center py-6 border-b border-green-700">
          <img src={Logo} alt="Logo" className="h-auto w-50" />
        </div>
        <nav className="flex flex-col flex-1 mt-6">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-4 px-6 py-4 w-full text-lg transition-colors duration-200 
                ${
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
        </nav>
      </aside>

      {/* Mobile Top Logo */}
      <div className="fixed top-0 left-0 z-50 flex items-center w-full px-4 py-3 bg-green-800 shadow-lg md:hidden">
        <img src={Logo} alt="Logo" className="w-auto h-8" />
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-around py-2 bg-green-800 shadow-lg md:hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center text-xs transition-colors duration-200
              ${
                isActive
                  ? "text-white font-semibold"
                  : "text-green-200 hover:text-white"
              }`
            }
            end={item.path === "/"}
          >
            <img src={item.icon} alt={item.name} className="w-6 h-6 mb-1" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>

      {/* Padding spacer to prevent bottom nav overlap */}
      <div className="h-16 md:hidden" />
    </>
  );
};

export default Sidebar;
