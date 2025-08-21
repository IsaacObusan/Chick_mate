import React, { useState } from "react";
import Feedingandwatering from "./Extra/Feedingandwatering";



const SubTabsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("feeding");

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-5xl p-6 bg-white shadow-lg rounded-2xl">
     

        {/* Sub Tabs */}
        <div className="flex mb-4 border-b">
          <button
            className={`flex-1 py-2 px-4 text-center font-medium ${
              activeTab === "feeding"
                ? "border-b-4 border-green-500 text-green-600"
                : "text-gray-600"
            }`}
            onClick={() => setActiveTab("feeding")}
          >
            Feeding and Watering
          </button>
          <button
            className={`flex-1 py-2 px-4 text-center font-medium ${
              activeTab === "environmental"
                ? "border-b-4 border-green-500 text-green-600"
                : "text-gray-600"
            }`}
            onClick={() => setActiveTab("environmental")}
          >
            Environmental
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === "feeding" && (
            <div>
              {/* ✅ Correct usage */}
              <Feedingandwatering />
            </div>
          )}

          {activeTab === "environmental" && (
            <div>
              <h2 className="mb-2 text-xl font-semibold">Environmental</h2>
              <p className="text-gray-700">
                Monitor and control temperature, humidity, and air quality.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubTabsPage;
