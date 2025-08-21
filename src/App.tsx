import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

import Home from "./Pages/Home";
import Inventory from "./Pages/Inventory";
import Batch from "./Pages/Batch";
import Sales from "./Pages/Sales";
import Suppliers from "./Pages/Suppliers";
import Control from "./Pages/Control";

import Sidebar from "./Partials/Sidebar";

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-gray-100">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <main className="flex-1 p-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/batch" element={<Batch />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/control" element={<Control />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
