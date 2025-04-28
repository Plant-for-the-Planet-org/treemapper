import React, { useState, useRef, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { motion } from 'framer-motion';
import { 
  Map, Filter, Calendar, ChevronDown, ChevronRight, Check,
  AlertTriangle, TrendingUp, Activity, MapPin, 
  Layers, Eye, EyeOff, Search, X, RefreshCw
} from 'lucide-react';
import * as d3 from 'd3';

import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Sample data
const INTERVENTION_TYPES = [
  'single-tree-registration', 'multi-tree-registration', 'removal-invasive-species',
  'fire-suppression', 'fire-patrol', 'fencing', 'marking-regenerant', 
  'liberating-regenerant', 'grass-suppression', 'firebreaks', 'assisting-seed-rain', 
  'soil-improvement', 'stop-tree-harvesting', 'direct-seeding', 
  'enrichment-planting', 'other-intervention', 'maintenance', 'unknown'
];

const INTERVENTION_NAMES = {
  'single-tree-registration': 'Single Tree Registration',
  'multi-tree-registration': 'Multi Tree Registration',
  'removal-invasive-species': 'Removal of Invasive Species',
  'fire-suppression': 'Fire Suppression',
  'fire-patrol': 'Fire Patrol',
  'fencing': 'Fencing',
  'marking-regenerant': 'Marking Regenerant',
  'liberating-regenerant': 'Liberating Regenerant',
  'grass-suppression': 'Grass Suppression',
  'firebreaks': 'Firebreaks',
  'assisting-seed-rain': 'Assisting Seed Rain',
  'soil-improvement': 'Soil Improvement',
  'stop-tree-harvesting': 'Stop Tree Harvesting',
  'direct-seeding': 'Direct Seeding',
  'enrichment-planting': 'Enrichment Planting',
  'other-intervention': 'Other Intervention',
  'maintenance': 'Maintenance',
  'unknown': 'Unknown'
};

// Sites data with geolocation
const siteData = [
  { 
    id: 1, 
    name: 'Northern Site', 
    lat: 40.7128, 
    lng: -74.0060, 
    registrations: 3542,
    successRate: 87,
    areaHectares: 120,
    interventions: {
      'single-tree-registration': 842,
      'multi-tree-registration': 1250,
      'removal-invasive-species': 245,
      'fire-suppression': 85,
      'fencing': 120,
      'other-intervention': 1000
    }
  },
  { 
    id: 2, 
    name: 'Eastern Forest', 
    lat: 40.6635, 
    lng: -73.9387, 
    registrations: 2815,
    successRate: 92,
    areaHectares: 85,
    interventions: {
      'single-tree-registration': 715,
      'multi-tree-registration': 980,
      'removal-invasive-species': 320,
      'direct-seeding': 450,
      'enrichment-planting': 350
    }
  },
  { 
    id: 3, 
    name: 'Southern Grove', 
    lat: 40.5795, 
    lng: -73.9442, 
    registrations: 1985,
    successRate: 78,
    areaHectares: 65,
    interventions: {
      'single-tree-registration': 520,
      'multi-tree-registration': 875,
      'fencing': 190,
      'maintenance': 400
    }
  },
  { 
    id: 4, 
    name: 'Western Hills', 
    lat: 40.7831, 
    lng: -73.9712, 
    registrations: 4120,
    successRate: 85,
    areaHectares: 150,
    interventions: {
      'single-tree-registration': 1200,
      'multi-tree-registration': 1850,
      'fire-patrol': 220,
      'soil-improvement': 350,
      'stop-tree-harvesting': 500
    }
  },
  { 
    id: 5, 
    name: 'Central Park', 
    lat: 40.7812, 
    lng: -73.9665, 
    registrations: 3250,
    successRate: 91,
    areaHectares: 110,
    interventions: {
      'single-tree-registration': 950,
      'multi-tree-registration': 1100,
      'marking-regenerant': 300,
      'liberating-regenerant': 275,
      'grass-suppression': 180,
      'firebreaks': 215,
      'maintenance': 230
    }
  }
];

// Intervention data for all sites combined
const interventionData = INTERVENTION_TYPES.map(type => {
  const count = siteData.reduce((total, site) => {
    return total + (site.interventions[type] || 0);
  }, 0);
  
  return {
    type,
    name: INTERVENTION_NAMES[type],
    count: count,
    successRate: Math.floor(Math.random() * 20) + 75 // Random success rate between 75-95%
  };
}).filter(intervention => intervention.count > 0);

// Monthly intervention data for timeline (sample)
const monthlyData = [
  { month: 'Jan', 'Single Tree': 250, 'Multi Tree': 450, 'Invasive Removal': 180, 'Fencing': 120, 'Other': 350 },
  { month: 'Feb', 'Single Tree': 280, 'Multi Tree': 520, 'Invasive Removal': 210, 'Fencing': 150, 'Other': 380 },
  { month: 'Mar', 'Single Tree': 350, 'Multi Tree': 650, 'Invasive Removal': 270, 'Fencing': 210, 'Other': 420 },
  { month: 'Apr', 'Single Tree': 450, 'Multi Tree': 720, 'Invasive Removal': 330, 'Fencing': 190, 'Other': 480 },
  { month: 'May', 'Single Tree': 520, 'Multi Tree': 820, 'Invasive Removal': 290, 'Fencing': 220, 'Other': 550 },
  { month: 'Jun', 'Single Tree': 580, 'Multi Tree': 950, 'Invasive Removal': 310, 'Fencing': 240, 'Other': 600 },
  { month: 'Jul', 'Single Tree': 650, 'Multi Tree': 1050, 'Invasive Removal': 340, 'Fencing': 230, 'Other': 580 },
  { month: 'Aug', 'Single Tree': 600, 'Multi Tree': 980, 'Invasive Removal': 325, 'Fencing': 210, 'Other': 520 },
  { month: 'Sep', 'Single Tree': 550, 'Multi Tree': 870, 'Invasive Removal': 290, 'Fencing': 180, 'Other': 490 },
  { month: 'Oct', 'Single Tree': 490, 'Multi Tree': 780, 'Invasive Removal': 270, 'Fencing': 160, 'Other': 450 },
  { month: 'Nov', 'Single Tree': 420, 'Multi Tree': 680, 'Invasive Removal': 240, 'Fencing': 140, 'Other': 400 },
  { month: 'Dec', 'Single Tree': 380, 'Multi Tree': 580, 'Invasive Removal': 200, 'Fencing': 150, 'Other': 370 },
];

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#FF7F50', '#9370DB', '#20B2AA', '#B0C4DE', '#FF69B4', '#CD5C5C', '#4682B4', '#6B8E23', '#483D8B', '#BDB76B', '#4B0082'];

const GeographicalInterventionAnalytics = () => {
  const mapContainerRef = useRef(null);
  const [map, setMap] = useState(null);
  const [selectedDateRange, setSelectedDateRange] = useState('30d');
  const [selectedInterventionType, setSelectedInterventionType] = useState('all');
  const [selectedSite, setSelectedSite] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [interventionFilterOpen, setInterventionFilterOpen] = useState(false);
  
  const dateRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last quarter' },
    { value: 'custom', label: 'Custom range' }
  ];
  
  // Filter data based on selections
  const filteredInterventionData = selectedInterventionType === 'all' 
    ? interventionData 
    : interventionData.filter(item => item.type === selectedInterventionType);
  
  const filteredSiteData = selectedInterventionType === 'all'
    ? siteData
    : siteData.filter(site => site.interventions[selectedInterventionType] && site.interventions[selectedInterventionType] > 0);
  
  // Set up the map when component mounts
  useEffect(() => {
    // This is a mock implementation since we can't actually initialize MapLibre here
    // In a real implementation, you would do something like:
    
    /*
    if (mapContainerRef.current && !map) {
      const newMap = new maplibregl.Map({
        container: mapContainerRef.current,
        style: 'https://demotiles.maplibre.org/style.json',
        center: [siteData[0].lng, siteData[0].lat],
        zoom: 9
      });
      
      newMap.on('load', () => {
        setMapLoaded(true);
        
        // Add markers for each site
        siteData.forEach(site => {
          const marker = new maplibregl.Marker({ color: '#0088FE' })
            .setLngLat([site.lng, site.lat])
            .setPopup(new maplibregl.Popup().setHTML(`
              <strong>${site.name}</strong><br/>
              Registrations: ${site.registrations}<br/>
              Success Rate: ${site.successRate}%
            `))
            .addTo(newMap);
        });
      });
      
      setMap(newMap);
    }
    */
    
    // Simulate map loading after a delay
    const timer = setTimeout(() => {
      setMapLoaded(true);
    }, 500);
    
    return () => {
      clearTimeout(timer);
      // In a real implementation: map?.remove();
    };
  }, []);
  
  // Filter sites on the map when intervention type changes
  useEffect(() => {
    if (mapLoaded && map) {
      // In a real implementation, you would update markers or layers here
      // For example:
      /*
      siteData.forEach(site => {
        const isVisible = selectedInterventionType === 'all' || 
          (site.interventions[selectedInterventionType] && site.interventions[selectedInterventionType] > 0);
        
        // Update marker visibility or styling
      });
      */
    }
  }, [selectedInterventionType, mapLoaded]);
  
  return (
    <div className="w-full h-full flex flex-col p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold"></h2>
        
        {/* Date Range Selector */}
        <div className="relative">
          <div 
            className="flex items-center px-4 py-2 bg-white rounded-lg shadow cursor-pointer"
            onClick={() => setDateRangeOpen(!dateRangeOpen)}
          >
            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
            <span className="text-sm font-medium">
              {dateRangeOptions.find(option => option.value === selectedDateRange).label}
            </span>
            <ChevronDown className="h-4 w-4 ml-2 text-gray-500" />
          </div>
          
          {/* Date Range Dropdown */}
          {dateRangeOpen && (
            <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg z-10 w-48 py-1">
              {dateRangeOptions.map(option => (
                <div 
                  key={option.value}
                  className={`px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center ${
                    selectedDateRange === option.value ? 'text-blue-500 font-medium' : ''
                  }`}
                  onClick={() => {
                    setSelectedDateRange(option.value);
                    setDateRangeOpen(false);
                  }}
                >
                  {selectedDateRange === option.value && <Check className="h-4 w-4 mr-2" />}
                  <span>{option.label}</span>
                </div>
              ))}
              
              {/* Custom date range would have additional UI here */}
              {selectedDateRange === 'custom' && (
                <div className="px-4 py-2 border-t">
                  {/* Date pickers would go here */}
                  <div className="text-xs text-gray-500">Custom date selector</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex flex-1 h-full overflow-hidden">
        {/* Filter Panel */}
        <motion.div 
          className="bg-white rounded-lg shadow mr-4 overflow-y-auto"
          initial={{ width: '320px' }}
          animate={{ width: isFilterOpen ? '320px' : '48px' }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-4 flex justify-between items-center border-b">
            {isFilterOpen && <h3 className="font-semibold">Filters & Analysis</h3>}
            <button 
              className="p-1 rounded-full hover:bg-gray-100"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              {isFilterOpen ? <ChevronRight className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
          </div>
          
          {isFilterOpen && (
            <div className="p-4">
              {/* Intervention Filter */}
              <div className="mb-6">
                <div 
                  className="flex justify-between items-center cursor-pointer mb-2"
                  onClick={() => setInterventionFilterOpen(!interventionFilterOpen)}
                >
                  <h4 className="font-medium">Intervention Type</h4>
                  {interventionFilterOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
                
                {interventionFilterOpen && (
                  <div className="bg-gray-50 p-2 rounded">
                    <div 
                      className={`px-3 py-2 mb-1 rounded cursor-pointer transition-colors ${
                        selectedInterventionType === 'all' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
                      }`}
                      onClick={() => setSelectedInterventionType('all')}
                    >
                      <span className="text-sm">All Interventions</span>
                    </div>
                    
                    {interventionData.map(intervention => (
                      <div 
                        key={intervention.type}
                        className={`px-3 py-2 mb-1 rounded cursor-pointer transition-colors ${
                          selectedInterventionType === intervention.type ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
                        }`}
                        onClick={() => setSelectedInterventionType(intervention.type)}
                      >
                        <span className="text-sm truncate block">{intervention.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Intervention Type Distribution */}
              <div className="mb-6">
                <h4 className="font-medium mb-2">Intervention Distribution</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={filteredInterventionData}
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="name"
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      >
                        {filteredInterventionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value.toLocaleString()}`, 'Count']} />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="mt-2 text-xs text-gray-500 text-center">
                    {selectedInterventionType === 'all' 
                      ? 'Distribution of all intervention types' 
                      : `${INTERVENTION_NAMES[selectedInterventionType]} distribution across sites`}
                  </div>
                </div>
              </div>
              
              {/* Success Metrics */}
              <div className="mb-6">
                <h4 className="font-medium mb-2">Success Metrics</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart
                      data={filteredInterventionData.slice(0, 5)}
                      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={false} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip 
                        formatter={(value) => [`${value}%`, 'Success Rate']}
                        labelFormatter={(index) => filteredInterventionData[index]?.name}
                      />
                      <Bar dataKey="successRate" fill="#0088FE" radius={[4, 4, 0, 0]}>
                        {filteredInterventionData.slice(0, 5).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.successRate > 85 ? '#4CAF50' : entry.successRate > 75 ? '#FFC107' : '#FF5722'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  
                  <div className="mt-2 text-xs text-gray-500 text-center">
                    {selectedInterventionType === 'all' 
                      ? 'Success rates by intervention type (top 5)' 
                      : `Success rate for ${INTERVENTION_NAMES[selectedInterventionType]}`}
                  </div>
                </div>
              </div>
              
              {/* Intervention Timeline */}
              <div className="mb-6">
                <h4 className="font-medium mb-2">Seasonal Trends</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart
                      data={monthlyData}
                      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="Single Tree" stackId="1" stroke="#0088FE" fill="#0088FE" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="Multi Tree" stackId="1" stroke="#00C49F" fill="#00C49F" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="Invasive Removal" stackId="1" stroke="#FFBB28" fill="#FFBB28" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="Fencing" stackId="1" stroke="#FF8042" fill="#FF8042" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="Other" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                  
                  <div className="mt-2 text-xs text-gray-500 text-center">
                    Monthly intervention activity over time
                  </div>
                </div>
              </div>
              
              {/* Site Comparison */}
              <div className="mb-6">
                <h4 className="font-medium mb-2">Site Comparison</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart
                      data={filteredSiteData}
                      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        tick={{ fontSize: 10 }}
                        width={80}
                      />
                      <Tooltip formatter={(value) => [`${value.toLocaleString()}`, 'Registrations']} />
                      <Bar 
                        dataKey="registrations" 
                        fill="#0088FE" 
                        onClick={(data) => setSelectedSite(data.id)}
                        cursor="pointer"
                      >
                        {filteredSiteData.map((entry) => (
                          <Cell 
                            key={`cell-${entry.id}`} 
                            fill={selectedSite === entry.id ? '#FF8042' : '#0088FE'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  
                  <div className="mt-2 text-xs text-gray-500 text-center">
                    Click on a site to view details on map
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
        
        {/* Map Container */}
        <div className="flex-1 bg-white rounded-lg shadow relative">
          {/* Map Controls */}
          <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
            <button className="p-2 bg-white rounded-full shadow hover:bg-gray-50">
              <Layers className="h-5 w-5 text-gray-700" />
            </button>
            <button className="p-2 bg-white rounded-full shadow hover:bg-gray-50">
              <Eye className="h-5 w-5 text-gray-700" />
            </button>
            <button className="p-2 bg-white rounded-full shadow hover:bg-gray-50">
              <Search className="h-5 w-5 text-gray-700" />
            </button>
            <button className="p-2 bg-white rounded-full shadow hover:bg-gray-50">
              <RefreshCw className="h-5 w-5 text-gray-700" />
            </button>
          </div>
          
          {/* Map Legend */}
          <div className="absolute bottom-4 left-4 z-10 bg-white p-3 rounded-lg shadow">
            <h4 className="text-sm font-medium mb-2">Map Legend</h4>
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
              <span className="text-xs">Registration Sites</span>
            </div>
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
              <span className="text-xs">Selected Site</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded opacity-50 bg-red-500 mr-2"></div>
              <span className="text-xs">Heat Map Intensity</span>
            </div>
          </div>
          
          {/* Map Container */}
          <div 
            ref={mapContainerRef}
            className="w-full h-full rounded-lg overflow-hidden"
            style={{ backgroundColor: '#e5e7eb' }}  // Placeholder color
          >
            {!mapLoaded && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            )}
            
            {/* MapLibre would render here */}
            {mapLoaded && (
              <div className="w-full h-full flex items-center justify-center bg-blue-50">
                <div className="text-center p-6 bg-white rounded-lg shadow-lg">
                  <Map className="h-10 w-10 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Map Visualization</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    This is a placeholder for the MapLibre implementation.<br/>
                    In the final version, this would show an interactive map with:
                  </p>
                  <ul className="text-sm text-left text-gray-600 space-y-1">
                    <li className="flex items-center">
                      <ChevronRight className="h-4 w-4 mr-1 text-blue-500" />
                      Site markers for all {filteredSiteData.length} filtered sites
                    </li>
                    <li className="flex items-center">
                      <ChevronRight className="h-4 w-4 mr-1 text-blue-500" />
                      Heat map overlay showing registration density
                    </li>
                    <li className="flex items-center">
                      <ChevronRight className="h-4 w-4 mr-1 text-blue-500" />
                      Highlighted view of {selectedSite ? 'selected site' : 'sites when clicked'}
                    </li>
                    <li className="flex items-center">
                      <ChevronRight className="h-4 w-4 mr-1 text-blue-500" />
                      Filtering by {selectedInterventionType === 'all' ? 'all intervention types' : INTERVENTION_NAMES[selectedInterventionType]}
                    </li>
                  </ul>
                  
                  {selectedSite && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg text-left">
                      <h4 className="font-medium text-sm">
                        {siteData.find(site => site.id === selectedSite)?.name}
                      </h4>
                      <div className="text-xs text-gray-600 mt-1">
                        <div>Registrations: {siteData.find(site => site.id === selectedSite)?.registrations.toLocaleString()}</div>
                        <div>Success Rate: {siteData.find(site => site.id === selectedSite)?.successRate}%</div>
                        <div>Area: {siteData.find(site => site.id === selectedSite)?.areaHectares} hectares</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeographicalInterventionAnalytics;