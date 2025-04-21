import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Sample data for different intervals
const dailyData = Array.from({ length: 7 }, (_, i) => ({
  name: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
  trees: Math.floor(Math.random() * 3000) + 2000,
}));

const weeklyData = Array.from({ length: 10 }, (_, i) => ({
  name: `Week ${i + 1}`,
  trees: Math.floor(Math.random() * 3000) + 2000,
}));

const monthlyData = [
  { name: 'Jan', trees: 5000 },
  { name: 'Feb', trees: 4500 },
  { name: 'Mar', trees: 1800 },
  { name: 'Apr', trees: 3500 },
  { name: 'May', trees: 4000 },
  { name: 'Jun', trees: 5500 },
  { name: 'Jul', trees: 4000 },
  { name: 'Aug', trees: 1300 },
  { name: 'Sep', trees: 4000 },
  { name: 'Oct', trees: 1300 },
  { name: 'Now', trees: 5300 },
  { name: 'Dec', trees: 5200 },
];

const TreePlantingChart = () => {
  const [interval, setInterval] = useState('monthly');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Select the data based on the interval
  const data = interval === 'daily' ? dailyData : 
               interval === 'weekly' ? weeklyData : 
               monthlyData;
               
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };
  
  const handleIntervalChange = (newInterval) => {
    setInterval(newInterval);
    setDropdownOpen(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Overview of Trees Planted</h2>
        <div className="relative">
          <button
            onClick={toggleDropdown}
            className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-700 w-40"
          >
            <span>Data Interval</span>
            <svg 
              className="w-4 h-4 ml-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 z-10 bg-white border border-gray-200 rounded-lg shadow-lg">
              <div className="py-1">
                <button 
                  className={`block w-full text-left px-4 py-2 text-sm ${interval === 'daily' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => handleIntervalChange('daily')}
                >
                  Days
                </button>
                <button 
                  className={`block w-full text-left px-4 py-2 text-sm ${interval === 'weekly' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => handleIntervalChange('weekly')}
                >
                  Weeks
                </button>
                <button 
                  className={`block w-full text-left px-4 py-2 text-sm ${interval === 'monthly' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => handleIntervalChange('monthly')}
                >
                  Months
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280' }}
              tickFormatter={(value) => value === 0 ? `${value}` : value}
            />
            <Tooltip 
              formatter={(value) => [`${value} trees`, 'Trees Planted']}
              cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
            />
            <Bar 
              dataKey="trees" 
              fill="#3F6212" 
              radius={[4, 4, 0, 0]} 
              barSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TreePlantingChart;