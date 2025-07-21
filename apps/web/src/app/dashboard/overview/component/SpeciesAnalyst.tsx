import React, { useState } from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, LineChart, Line, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { motion } from 'framer-motion';
import { 
  Leaf, Filter, TrendingUp, AlertTriangle, Search,
  Sun, Droplets, ThermometerSnowflake, ChevronUp, ChevronDown
} from 'lucide-react';

// Sample species data
const speciesData = {
  // Top species by count
  speciesDistribution: [
    { name: 'Acacia', count: 2876, nativeStatus: 'Native' },
    { name: 'Eucalyptus', count: 2105, nativeStatus: 'Native' },
    { name: 'Pine', count: 1840, nativeStatus: 'Non-native' },
    { name: 'Oak', count: 1560, nativeStatus: 'Native' },
    { name: 'Cedar', count: 1285, nativeStatus: 'Native' },
    { name: 'Bamboo', count: 942, nativeStatus: 'Non-native' },
    { name: 'Maple', count: 893, nativeStatus: 'Native' },
    { name: 'Others', count: 1283, nativeStatus: 'Mixed' },
  ],
  
  // Species performance metrics
  speciesPerformance: [
    { name: 'Acacia', survivalRate: 92, growthRate: 88, climateResilience: 85, soilCompatibility: 90, diseaseResistance: 78 },
    { name: 'Eucalyptus', survivalRate: 85, growthRate: 95, climateResilience: 80, soilCompatibility: 75, diseaseResistance: 65 },
    { name: 'Pine', survivalRate: 78, growthRate: 72, climateResilience: 68, soilCompatibility: 82, diseaseResistance: 70 },
    { name: 'Oak', survivalRate: 89, growthRate: 65, climateResilience: 90, soilCompatibility: 88, diseaseResistance: 85 },
    { name: 'Cedar', survivalRate: 81, growthRate: 68, climateResilience: 75, soilCompatibility: 78, diseaseResistance: 72 },
  ],
  
  // Monthly growth tracking
  growthTimeline: [
    { month: 'Jan', acacia: 2.1, eucalyptus: 3.2, pine: 1.8, oak: 1.2, cedar: 1.7 },
    { month: 'Feb', acacia: 2.4, eucalyptus: 3.5, pine: 1.9, oak: 1.4, cedar: 1.9 },
    { month: 'Mar', acacia: 2.8, eucalyptus: 3.9, pine: 2.2, oak: 1.7, cedar: 2.2 },
    { month: 'Apr', acacia: 3.2, eucalyptus: 4.5, pine: 2.4, oak: 2.0, cedar: 2.5 },
    { month: 'May', acacia: 3.6, eucalyptus: 5.2, pine: 2.7, oak: 2.3, cedar: 2.9 },
    { month: 'Jun', acacia: 4.1, eucalyptus: 5.8, pine: 3.0, oak: 2.5, cedar: 3.2 },
  ],
  
  // Species diversity index per site
  diversityIndex: [
    { site: 'Site A', index: 0.82 },
    { site: 'Site B', index: 0.73 },
    { site: 'Site C', index: 0.91 },
    { site: 'Site D', index: 0.68 },
    { site: 'Site E', index: 0.77 },
  ],
  
  // Overview stats
  totalSpecies: 24,
  nativeSpecies: 18,
  nonNativeSpecies: 6,
  endangeredSpecies: 3,
  highestSurvival: 'Acacia (92%)',
  fastestGrowing: 'Eucalyptus (5.8 cm/month)'
};

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff6b6b'];
const STATUS_COLORS = {
  'Native': '#4CAF50',
  'Non-native': '#FF9800',
  'Mixed': '#9E9E9E'
};

const SpeciesAnalytics = () => {
  const [selectedPerformanceSpecies, setSelectedPerformanceSpecies] = useState('Acacia');
  const [filterNative, setFilterNative] = useState(false);
  
  // Filter species distribution data based on native status filter
  const filteredSpeciesData = filterNative 
    ? speciesData.speciesDistribution.filter(item => item.nativeStatus === 'Native')
    : speciesData.speciesDistribution;
  
  // Calculate total trees for filtered data
  const totalFilteredTrees = filteredSpeciesData.reduce((sum, species) => sum + species.count, 0);
  
  return (
    <div className="w-full p-4">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          
          {/* Filter toggle */}
          <div 
            className={`flex items-center px-3 py-2 rounded-lg cursor-pointer transition-colors ${
              filterNative ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}
            onClick={() => setFilterNative(!filterNative)}
          >
            <Filter className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">
              {filterNative ? 'Showing Native Only' : 'Show All Species'}
            </span>
          </div>
        </div>
        
        {/* Species Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-4 rounded-lg shadow-md"
          >
            <div className="flex flex-col items-center">
              <div className="bg-blue-100 p-3 rounded-full mb-2">
                <Leaf className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-gray-500 text-xs">Total Species</p>
              <h3 className="text-2xl font-bold">{speciesData.totalSpecies}</h3>
            </div>
          </motion.div>
          
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-4 rounded-lg shadow-md"
          >
            <div className="flex flex-col items-center">
              <div className="bg-green-100 p-3 rounded-full mb-2">
                <Leaf className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-gray-500 text-xs">Native Species</p>
              <h3 className="text-2xl font-bold">{speciesData.nativeSpecies}</h3>
            </div>
          </motion.div>
          
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-4 rounded-lg shadow-md"
          >
            <div className="flex flex-col items-center">
              <div className="bg-orange-100 p-3 rounded-full mb-2">
                <Leaf className="h-5 w-5 text-orange-500" />
              </div>
              <p className="text-gray-500 text-xs">Non-native Species</p>
              <h3 className="text-2xl font-bold">{speciesData.nonNativeSpecies}</h3>
            </div>
          </motion.div>
          
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-4 rounded-lg shadow-md"
          >
            <div className="flex flex-col items-center">
              <div className="bg-red-100 p-3 rounded-full mb-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <p className="text-gray-500 text-xs">Endangered Species</p>
              <h3 className="text-2xl font-bold">{speciesData.endangeredSpecies}</h3>
            </div>
          </motion.div>
          
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-4 rounded-lg shadow-md"
          >
            <div className="flex flex-col items-center">
              <div className="bg-purple-100 p-3 rounded-full mb-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
              <p className="text-gray-500 text-xs">Highest Survival</p>
              <h3 className="text-lg font-bold">{speciesData.highestSurvival}</h3>
            </div>
          </motion.div>
          
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-4 rounded-lg shadow-md"
          >
            <div className="flex flex-col items-center">
              <div className="bg-teal-100 p-3 rounded-full mb-2">
                <TrendingUp className="h-5 w-5 text-teal-500" />
              </div>
              <p className="text-gray-500 text-xs">Fastest Growing</p>
              <h3 className="text-lg font-bold">{speciesData.fastestGrowing}</h3>
            </div>
          </motion.div>
        </div>
        
        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Species Distribution Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white p-6 rounded-lg shadow-md"
          >
            <h3 className="text-lg font-semibold mb-4">Species Distribution</h3>
            <div className="text-center text-sm text-gray-500 mb-4">
              {filterNative ? 'Showing native species only' : 'All species'}
              <span className="font-medium ml-1">
                ({filteredSpeciesData.length} species, {totalFilteredTrees.toLocaleString()} trees)
              </span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={filteredSpeciesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {filteredSpeciesData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value.toLocaleString()} trees`, 'Count']}
                />
                <Legend 
                  layout="vertical" 
                  verticalAlign="middle" 
                  align="right"
                  formatter={(value, entry, index) => {
                    const item = filteredSpeciesData[index];
                    return (
                      <span style={{ color: '#333', marginRight: '10px' }}>
                        {value} <span className="text-xs" style={{ 
                          color: STATUS_COLORS[item.nativeStatus] 
                        }}>
                          ({item.nativeStatus})
                        </span>
                      </span>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
          
          {/* Species Diversity Index */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white p-6 rounded-lg shadow-md"
          >
            <h3 className="text-lg font-semibold mb-4">Species Diversity Index by Site</h3>
            <div className="text-center text-sm text-gray-500 mb-4">
              Shannon-Wiener Diversity Index (Higher is better)
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={speciesData.diversityIndex}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="site" />
                <YAxis domain={[0, 1]} />
                <Tooltip 
                  formatter={(value) => [`${value.toFixed(2)}`, 'Diversity Index']}
                  labelFormatter={(value) => `Site: ${value}`}
                />
                <Legend />
                <Bar 
                  dataKey="index" 
                  name="Diversity Index" 
                  fill="#0088FE"
                  radius={[4, 4, 0, 0]}
                >
                  {speciesData.diversityIndex.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.index > 0.8 ? '#4CAF50' : entry.index > 0.7 ? '#FFC107' : '#FF5722'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
        
        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Species Performance - Radar Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white p-6 rounded-lg shadow-md"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Species Performance Metrics</h3>
              <div className="relative">
                <select
                  value={selectedPerformanceSpecies}
                  onChange={(e) => setSelectedPerformanceSpecies(e.target.value)}
                  className="appearance-none bg-gray-100 border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
                >
                  {speciesData.speciesPerformance.map((species) => (
                    <option key={species.name} value={species.name}>
                      {species.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <Search className="h-4 w-4" />
                </div>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart 
                outerRadius={90} 
                data={[
                  speciesData.speciesPerformance.find(s => s.name === selectedPerformanceSpecies)
                ].map(item => ({
                  subject: 'Survival Rate',
                  A: item.survivalRate,
                  fullMark: 100,
                })).concat([
                  {
                    subject: 'Growth Rate',
                    A: speciesData.speciesPerformance.find(s => s.name === selectedPerformanceSpecies).growthRate,
                    fullMark: 100,
                  },
                  {
                    subject: 'Climate Resilience',
                    A: speciesData.speciesPerformance.find(s => s.name === selectedPerformanceSpecies).climateResilience,
                    fullMark: 100,
                  },
                  {
                    subject: 'Soil Compatibility',
                    A: speciesData.speciesPerformance.find(s => s.name === selectedPerformanceSpecies).soilCompatibility,
                    fullMark: 100,
                  },
                  {
                    subject: 'Disease Resistance',
                    A: speciesData.speciesPerformance.find(s => s.name === selectedPerformanceSpecies).diseaseResistance,
                    fullMark: 100,
                  }
                ])}
              >
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar 
                  name={selectedPerformanceSpecies} 
                  dataKey="A" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6} 
                />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
            
            {/* Performance indicators */}
            <div className="grid grid-cols-5 gap-2 mt-4">
              <div className="flex flex-col items-center">
                <div className="bg-blue-100 p-2 rounded-full">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                </div>
                <p className="text-xs text-gray-500 mt-1 text-center">Survival Rate</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-green-100 p-2 rounded-full">
                  <Sun className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-xs text-gray-500 mt-1 text-center">Growth Rate</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-yellow-100 p-2 rounded-full">
                  <ThermometerSnowflake className="h-4 w-4 text-yellow-500" />
                </div>
                <p className="text-xs text-gray-500 mt-1 text-center">Climate Resilience</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-orange-100 p-2 rounded-full">
                  <Droplets className="h-4 w-4 text-orange-500" />
                </div>
                <p className="text-xs text-gray-500 mt-1 text-center">Soil Compatibility</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-red-100 p-2 rounded-full">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </div>
                <p className="text-xs text-gray-500 mt-1 text-center">Disease Resistance</p>
              </div>
            </div>
          </motion.div>
          
          {/* Growth Timeline */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white p-6 rounded-lg shadow-md"
          >
            <h3 className="text-lg font-semibold mb-4">Monthly Growth Comparison (cm)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={speciesData.growthTimeline}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="eucalyptus" 
                  name="Eucalyptus" 
                  stroke="#0088FE" 
                  activeDot={{ r: 8 }} 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="acacia" 
                  name="Acacia" 
                  stroke="#00C49F" 
                  activeDot={{ r: 8 }}
                  strokeWidth={2} 
                />
                <Line 
                  type="monotone" 
                  dataKey="pine" 
                  name="Pine" 
                  stroke="#FFBB28" 
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="oak" 
                  name="Oak" 
                  stroke="#FF8042" 
                  activeDot={{ r: 8 }}
                  strokeWidth={2} 
                />
                <Line 
                  type="monotone" 
                  dataKey="cedar" 
                  name="Cedar" 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }}
                  strokeWidth={2} 
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SpeciesAnalytics;