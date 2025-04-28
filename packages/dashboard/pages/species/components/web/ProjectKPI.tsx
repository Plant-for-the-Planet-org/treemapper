import React, { useState } from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { motion } from 'framer-motion';
import { 
  Users, Leaf, Map, CheckCircle, BarChart2, Calendar, 
  ArrowUp, ArrowDown
} from 'lucide-react';

// Sample data
const sampleData = {
  totalTrees: 12784,
  completionPercentage: 68,
  activeSites: 24,
  teamMembers: 37,
  weeklyGrowth: 14.3,
  
  // Intervention type distribution
  interventionDistribution: [
    { name: 'Single Tree Registration', value: 4230 },
    { name: 'Multi Tree Registration', value: 6125 },
    { name: 'Removal Invasive Species', value: 527 },
    { name: 'Fire Suppression', value: 348 },
    { name: 'Fire Patrol', value: 412 },
    { name: 'Fencing', value: 259 },
    { name: 'Other', value: 883 } // Combined smaller categories
  ],
  
  // Monthly registration trends
  monthlyTrends: [
    { name: 'Jan', trees: 850 },
    { name: 'Feb', trees: 920 },
    { name: 'Mar', trees: 1100 },
    { name: 'Apr', trees: 1450 },
    { name: 'May', trees: 1280 },
    { name: 'Jun', trees: 1800 },
    { name: 'Jul', trees: 2400 },
    { name: 'Aug', trees: 2984 }
  ]
};

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const ProjectSummaryKPIs = () => {
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  
  const getStatusColor = (value) => {
    if (value > 10) return 'text-green-500';
    if (value > 0) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  // Handle pie chart click
  const handlePieClick = (data, index) => {
    setSelectedIntervention(selectedIntervention === index ? null : index);
  };
  
  return (
    <div className="w-full p-4">
      <div className="mb-6">        
        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-4 rounded-lg shadow-md"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">Total Trees</p>
                <h3 className="text-3xl font-bold">{sampleData.totalTrees.toLocaleString()}</h3>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Leaf className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="mt-2 flex items-center">
              <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500 text-sm">{sampleData.weeklyGrowth}% growth</span>
              <span className="text-gray-400 text-xs ml-1">vs last week</span>
            </div>
          </motion.div>
          
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-4 rounded-lg shadow-md"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">Project Completion</p>
                <h3 className="text-3xl font-bold">{sampleData.completionPercentage}%</h3>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-green-500 h-2.5 rounded-full" 
                style={{ width: `${sampleData.completionPercentage}%` }}
              ></div>
            </div>
          </motion.div>
          
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-4 rounded-lg shadow-md"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">Active Sites</p>
                <h3 className="text-3xl font-bold">{sampleData.activeSites}</h3>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Map className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
            <div className="mt-2 flex items-center">
              <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500 text-sm">2 new</span>
              <span className="text-gray-400 text-xs ml-1">this month</span>
            </div>
          </motion.div>
          
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-4 rounded-lg shadow-md"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">Team Members</p>
                <h3 className="text-3xl font-bold">{sampleData.teamMembers}</h3>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-purple-500" />
              </div>
            </div>
            <div className="mt-2 flex items-center">
              <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500 text-sm">5 new</span>
              <span className="text-gray-400 text-xs ml-1">this quarter</span>
            </div>
          </motion.div>
        </div>
        
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Intervention Type Distribution */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white p-6 rounded-lg shadow-md"
          >
            <h3 className="text-lg font-semibold mb-4">Intervention Type Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sampleData.interventionDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  onClick={handlePieClick}
                >
                  {sampleData.interventionDistribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      opacity={selectedIntervention === null || selectedIntervention === index ? 1 : 0.5}
                      stroke={selectedIntervention === index ? '#333' : 'none'}
                      strokeWidth={selectedIntervention === index ? 2 : 0}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} trees`, 'Count']}
                  labelFormatter={(index) => sampleData.interventionDistribution[index].name}
                />
                <Legend layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
          
          {/* Monthly Registration Trends */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white p-6 rounded-lg shadow-md"
          >
            <h3 className="text-lg font-semibold mb-4">Monthly Registration Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={sampleData.monthlyTrends}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} trees`, 'Registrations']} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="trees" 
                  stroke="#0088FE" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
          
          {/* Top Intervention Types Bar Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white p-6 rounded-lg shadow-md lg:col-span-2"
          >
            <h3 className="text-lg font-semibold mb-4">Registration by Intervention Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={sampleData.interventionDistribution}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Trees Registered" fill="#8884d8">
                  {sampleData.interventionDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSummaryKPIs;