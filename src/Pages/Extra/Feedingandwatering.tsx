import React from "react";
import { Droplets, Pill } from "lucide-react";

const Feedingandwatering: React.FC = () => {
  return (
    <div className="flex flex-col gap-4 p-6 bg-gray-50 h-[550px]">
      {/* Top Big Rectangle */}
      <div className="w-full h-48 bg-white border-2 border-pink-200 shadow-sm rounded-2xl" />

      {/* Water & Medicine + Stage Buttons Row */}
      <div className="flex flex-row flex-1 gap-4">
        {/* Water & Medicine Sections */}
        <div className="flex flex-col flex-1 gap-4">
          <div className="flex flex-row gap-4">
            {/* Water Section */}
            <div className="flex flex-col items-center justify-center flex-1 p-4 bg-white border-2 border-pink-200 shadow-sm rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <Droplets className="text-green-600" />
                <span className="font-semibold text-green-700">Water</span>
              </div>
              <div className="flex gap-3">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    className="flex items-center justify-center w-12 h-12 font-semibold text-green-700 transition border-2 border-pink-200 rounded-full hover:bg-green-100"
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Medicine Section */}
            <div className="flex flex-col items-center justify-center flex-1 p-4 bg-white border-2 border-pink-200 shadow-sm rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <Pill className="text-green-600" />
                <span className="font-semibold text-green-700">Medicine</span>
              </div>
              <div className="flex gap-3">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    className="flex items-center justify-center w-12 h-12 font-semibold text-green-700 transition border-2 border-pink-200 rounded-full hover:bg-green-100"
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Starter, Grower, Finisher Buttons */}
          <div className="flex flex-row gap-4">
            {["Starter", "Grower", "Finisher"].map((label) => (
              <button
                key={label}
                className="flex-1 py-3 font-semibold text-green-700 transition bg-white border-2 border-pink-200 shadow-sm rounded-2xl hover:bg-green-100"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feedingandwatering;
