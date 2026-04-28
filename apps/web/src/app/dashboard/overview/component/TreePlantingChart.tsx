import React, { useEffect, useState } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useToken } from '@/context/useTokenContext';
import useProjectStore from '@shared-core/store/useProjectStore';
import { getOverviewGraph } from '@shared-core/fetchApi/api.fetch';
import { ChevronDown, TrendingUp } from 'lucide-react';

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
          month: 'short', 
          day: 'numeric' 
        });
      case 'weeks':
        const weekNumber = getWeekNumber(date);
        return `W${weekNumber}`;
      case 'months':
        return date.toLocaleDateString('en-US', { 
          month: 'short',
          year: '2-digit' 
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
      days: 'Daily',
      weeks: 'Weekly', 
      months: 'Monthly'
    };
    return displayNames[intervalValue] || intervalValue;
  };

  const calculateTotal = () => {
    return chartData.reduce((sum, item) => sum + item.trees, 0);
  };

  const calculateGrowth = () => {
    if (chartData.length < 2) return null;
    const current = chartData[chartData.length - 1]?.trees || 0;
    const previous = chartData[chartData.length - 2]?.trees || 0;
    if (previous === 0) return null;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const formatTooltipValue = (value, name, props) => {
    return [`${value.toLocaleString()} trees`, 'Trees Planted'];
  };

  if (!accessToken || !selectedProject?.uid) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-center h-48">
          <p className="text-xs text-gray-500">Please select a project to view data</p>
        </div>
      </div>
    );
  }

  const growth = calculateGrowth();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 w-full ">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-gray-900">Trees Planted</h3>
            {growth !== null && (
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                parseFloat(growth) >= 0 
                  ? 'bg-green-50 text-green-700' 
                  : 'bg-red-50 text-red-700'
              }`}>
                <TrendingUp className={`w-3 h-3 ${parseFloat(growth) < 0 ? 'rotate-180' : ''}`} />
                {Math.abs(growth)}%
              </div>
            )}
          </div>
          {!loading && !error && (
            <p className="text-lg font-bold text-gray-900">
              {formatNumber(calculateTotal())}
            </p>
          )}
        </div>
        
        {/* Dropdown */}
        <div className="relative">
          <button
            onClick={toggleDropdown}
            disabled={loading}
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span>{getIntervalDisplayName(interval)}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-1 z-10 bg-white border border-gray-200 rounded-md shadow-lg min-w-[80px]">
              <div className="py-1">
                {['days', 'weeks', 'months'].map((intervalOption) => (
                  <button
                    key={intervalOption}
                    className={`block w-full text-left px-3 py-1.5 text-xs transition-colors ${
                      interval === intervalOption 
                        ? 'bg-gray-50 text-gray-900 font-medium' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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

      {/* Chart */}
      <div className="h-48">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-[#007A49] rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-2">{error}</p>
              <button
                onClick={handleFetch}
                className="px-2 py-1 bg-[#007A49] text-white rounded text-xs hover:bg-[#006239] transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-gray-500">No data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <defs>
                <linearGradient id="treeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#007A49" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#007A49" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false} 
                stroke="#f1f5f9" 
                strokeWidth={1}
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickMargin={8}
                interval={'preserveStartEnd'}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickMargin={8}
                width={35}
                tickFormatter={(value) => formatNumber(value)}
              />
              <Tooltip
                formatter={formatTooltipValue}
                cursor={{ stroke: '#007A49', strokeWidth: 1, strokeDasharray: '3 3' }}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  fontSize: '11px',
                  padding: '8px'
                }}
                labelStyle={{ color: '#374151', fontSize: '11px' }}
              />
              <Area
                type="monotone"
                dataKey="trees"
                stroke="#007A49"
                strokeWidth={2}
                fill="url(#treeGradient)"
                dot={false}
                activeDot={{ 
                  r: 3, 
                  fill: '#007A49',
                  stroke: 'white',
                  strokeWidth: 2
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default TreePlantingChart;