import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToken } from '../../../../context/TokenContext';
import useProjectStore from '../../../../store/useProjectStore';
import { getOverviewGraph } from '../../../../api/api.fetch';
import TreeLoader from './TreeLoader';

const TreePlantingChart = () => {
  const [interval, setInterval] = useState('months');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { accessToken } = useToken();
  const selectedProject = useProjectStore(state => state.selectedProject);

  useEffect(() => {
    if (accessToken && selectedProject?.uid) {
      handleFetch();
    }
  }, [accessToken, selectedProject?.uid, interval]);

  const formatDateForDisplay = (dateString, intervalType) => {
    const date = new Date(dateString);
    
    switch (intervalType) {
      case 'days':
        return date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        });
      case 'weeks':
        const weekNumber = getWeekNumber(date);
        return `Week ${weekNumber}`;
      case 'months':
        return date.toLocaleDateString('en-US', { 
          month: 'short',
          year: 'numeric' 
        });
      default:
        return date.toLocaleDateString();
    }
  };

  const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const handleFetch = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getOverviewGraph(accessToken, selectedProject?.uid, interval);
      
      if (response && response.statusCode === 200) {
        const formattedData = response.data.data.map(item => ({
          name: formatDateForDisplay(item.date, response.data.interval),
          trees: item.value,
          fullDate: item.date
        }));
        
        setChartData(formattedData);
      } else {
        throw new Error(response?.message || 'Failed to fetch data');
      }
    } catch (err) {
      console.error('Error fetching chart data:', err);
      setError(err.message || 'Failed to load chart data');
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleIntervalChange = (newInterval) => {
    setInterval(newInterval);
    setDropdownOpen(false);
  };

  const getIntervalDisplayName = (intervalValue) => {
    const displayNames = {
      days: 'Days',
      weeks: 'Weeks', 
      months: 'Months'
    };
    return displayNames[intervalValue] || intervalValue;
  };

  const calculateTotal = () => {
    return chartData.reduce((sum, item) => sum + item.trees, 0);
  };

  const formatTooltipValue = (value, name, props) => {
    const totalTrees = calculateTotal();
    const percentage = totalTrees > 0 ? ((value / totalTrees) * 100).toFixed(1) : 0;
    return [`${value.toLocaleString()} trees (${percentage}%)`, 'Trees Planted'];
  };

  if (!accessToken || !selectedProject?.uid) {
    return (
      <div className="bg-white rounded-2xl shadow p-6 w-full">
        <div className="flex items-center justify-center h-80">
          <p className="text-gray-500">Please select a project to view tree planting data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Overview of Trees Planted</h2>
          {!loading && !error && (
            <p className="text-sm text-gray-600 mt-1">
              Total: {calculateTotal().toLocaleString()} trees
            </p>
          )}
        </div>
        <div className="relative">
          <button
            onClick={toggleDropdown}
            disabled={loading}
            className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-700 w-40 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            <span>{getIntervalDisplayName(interval)}</span>
            <svg
              className={`w-4 h-4 ml-2 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 z-10 bg-white border border-gray-200 rounded-lg shadow-lg min-w-full">
              <div className="py-1">
                {['days', 'weeks', 'months'].map((intervalOption) => (
                  <button
                    key={intervalOption}
                    className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                      interval === intervalOption 
                        ? 'bg-green-50 text-green-700 font-medium' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => handleIntervalChange(intervalOption)}
                  >
                    {getIntervalDisplayName(intervalOption)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="h-80">
        {loading ? <TreeLoader/> : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-red-500 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <p className="text-gray-600 mb-3">{error}</p>
              <button
                onClick={handleFetch}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
              <p className="text-gray-600">No tree planting data available for this period</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
                angle={chartData.length > 10 ? -45 : 0}
                textAnchor={chartData.length > 10 ? 'end' : 'middle'}
                height={chartData.length > 10 ? 80 : 60}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
                tickFormatter={(value) => value === 0 ? '0' : value.toLocaleString()}
              />
              <Tooltip
                formatter={formatTooltipValue}
                cursor={{ fill: 'rgba(34, 197, 94, 0.1)' }}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar
                dataKey="trees"
                fill="#007A49"
                radius={[4, 4, 0, 0]}
                barSize={Math.min(40, Math.max(20, 400 / chartData.length))}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default TreePlantingChart;