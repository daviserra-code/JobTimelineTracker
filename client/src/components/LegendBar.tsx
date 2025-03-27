import React from 'react';

const LegendBar = () => {
  return (
    <div className="bg-white border-b">
      <div className="container mx-auto px-4 py-2">
        <div className="flex flex-wrap items-center text-sm">
          <span className="mr-4 font-medium">Activity Types:</span>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#e91e63] mr-1"></div>
              <span>Confirmed</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#03a9f4] mr-1"></div>
              <span>Tentative</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#f44336] mr-1"></div>
              <span>Holiday</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#ffeb3b] mr-1"></div>
              <span>Hypothetical</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegendBar;
