'use client'
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Medal, 
  Award, 
  TreePine, 
  TrendingUp, 
  Users, 
  Calendar,
  ChevronDown,
  Crown,
  Leaf,
  MapPin
} from 'lucide-react';

const leaderboardData = [
  {
    id: 1,
    uid: "user-001",
    displayName: "Hassan Khan",
    firstName: "Hassan",
    lastName: "Khan",
    image: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=150&h=150&fit=crop&crop=face",
    type: "individual",
    country: "Pakistan",
    totalTrees: 55,
    totalInterventions: 6,
    areaRestored: 1.0,
    joinDate: "2024-01-15",
    recentActivity: "Planted 10 neem saplings in Karachi park"
  },
  {
    id: 2,
    uid: "user-002",
    displayName: "Beaconhouse School",
    firstName: "Beaconhouse",
    lastName: "School",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=150&h=150&fit=crop",
    type: "school",
    country: "Pakistan",
    totalTrees: 42,
    totalInterventions: 3,
    areaRestored: 0.6,
    joinDate: "2024-08-20",
    recentActivity: "Students planted fruit trees on campus"
  },
  {
    id: 3,
    uid: "user-003",
    displayName: "Oliver Smith",
    firstName: "Oliver",
    lastName: "Smith",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    type: "individual",
    country: "UK",
    totalTrees: 38,
    totalInterventions: 6,
    areaRestored: 0.5,
    joinDate: "2024-02-10",
    recentActivity: "Completed tree health survey in local woodland"
  },
  {
    id: 4,
    uid: "user-004",
    displayName: "Manchester Grammar School",
    firstName: "Manchester",
    lastName: "Grammar School",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=150&h=150&fit=crop",
    type: "school",
    country: "UK",
    totalTrees: 35,
    totalInterventions: 4,
    areaRestored: 0.4,
    joinDate: "2024-09-05",
    recentActivity: "Year 7 science project on tree planting"
  },
  {
    id: 5,
    uid: "user-005",
    displayName: "Zara Ahmed",
    firstName: "Zara",
    lastName: "Ahmed",
    image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face",
    type: "individual",
    country: "Pakistan",
    totalTrees: 31,
    totalInterventions: 4,
    areaRestored: 0.3,
    joinDate: "2024-03-22",
    recentActivity: "Measured growth of 12 mango saplings"
  },
  {
    id: 6,
    uid: "user-006",
    displayName: "Lahore Grammar School",
    firstName: "Lahore Grammar",
    lastName: "School",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=150&h=150&fit=crop",
    type: "school",
    country: "Pakistan",
    totalTrees: 28,
    totalInterventions: 2,
    areaRestored: 0.2,
    joinDate: "2024-10-14",
    recentActivity: "Earth Day plantation drive"
  },
  {
    id: 7,
    uid: "user-007",
    displayName: "Amelia Brown",
    firstName: "Amelia",
    lastName: "Brown",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    type: "individual",
    country: "UK",
    totalTrees: 24,
    totalInterventions: 3,
    areaRestored: 0.2,
    joinDate: "2024-04-08",
    recentActivity: "Monitoring oak trees in community park"
  },
  {
    id: 8,
    uid: "user-008",
    displayName: "Cambridge High School",
    firstName: "Cambridge",
    lastName: "High School",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=150&h=150&fit=crop",
    type: "school",
    country: "UK",
    totalTrees: 19,
    totalInterventions: 2,
    areaRestored: 0.1,
    joinDate: "2024-11-30",
    recentActivity: "Biology students started woodland restoration project"
  },
  {
    id: 9,
    uid: "user-009",
    displayName: "Hassan Raza",
    firstName: "Hassan",
    lastName: "Raza",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    type: "individual",
    country: "Pakistan",
    totalTrees: 40,
    totalInterventions: 5,
    areaRestored: 0.7,
    joinDate: "2024-05-02",
    recentActivity: "Planted eucalyptus trees near Faisalabad canal"
  },
  {
    id: 10,
    uid: "user-010",
    displayName: "Oxford Academy",
    firstName: "Oxford",
    lastName: "Academy",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=150&h=150&fit=crop",
    type: "school",
    country: "UK",
    totalTrees: 33,
    totalInterventions: 4,
    areaRestored: 0.5,
    joinDate: "2024-06-10",
    recentActivity: "Hosted tree-planting awareness week"
  },
  {
    id: 11,
    uid: "user-011",
    displayName: "Sara Malik",
    firstName: "Sara",
    lastName: "Malik",
    image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150&h=150&fit=crop&crop=face",
    type: "individual",
    country: "Pakistan",
    totalTrees: 26,
    totalInterventions: 3,
    areaRestored: 0.2,
    joinDate: "2024-07-18",
    recentActivity: "Started home garden with 15 guava plants"
  },
  {
    id: 12,
    uid: "user-012",
    displayName: "Kingston College",
    firstName: "Kingston",
    lastName: "College",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=150&h=150&fit=crop",
    type: "school",
    country: "UK",
    totalTrees: 37,
    totalInterventions: 5,
    areaRestored: 0.6,
    joinDate: "2024-08-01",
    recentActivity: "Eco-club planted maples in school yard"
  },
  {
    id: 13,
    uid: "user-013",
    displayName: "Bilal Hussain",
    firstName: "Bilal",
    lastName: "Hussain",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
    type: "individual",
    country: "Pakistan",
    totalTrees: 22,
    totalInterventions: 2,
    areaRestored: 0.1,
    joinDate: "2024-09-12",
    recentActivity: "Volunteered for mangrove plantation in Sindh"
  },
  {
    id: 14,
    uid: "user-014",
    displayName: "Emily Taylor",
    firstName: "Emily",
    lastName: "Taylor",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    type: "individual",
    country: "UK",
    totalTrees: 29,
    totalInterventions: 4,
    areaRestored: 0.3,
    joinDate: "2024-10-05",
    recentActivity: "Surveyed tree canopy coverage in village"
  },
  {
    id: 15,
    uid: "user-015",
    displayName: "Roots International School",
    firstName: "Roots International",
    lastName: "School",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=150&h=150&fit=crop",
    type: "school",
    country: "Pakistan",
    totalTrees: 48,
    totalInterventions: 6,
    areaRestored: 0.9,
    joinDate: "2024-11-01",
    recentActivity: "Organized inter-school plantation competition"
  },
  {
    id: 16,
    uid: "user-016",
    displayName: "George Williams",
    firstName: "George",
    lastName: "Williams",
    image: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=150&h=150&fit=crop&crop=face",
    type: "individual",
    country: "UK",
    totalTrees: 32,
    totalInterventions: 3,
    areaRestored: 0.4,
    joinDate: "2024-12-15",
    recentActivity: "Took part in city council’s green drive"
  },
  {
    id: 17,
    uid: "user-017",
    displayName: "Fatima Javed",
    firstName: "Fatima",
    lastName: "Javed",
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop&crop=face",
    type: "individual",
    country: "Pakistan",
    totalTrees: 18,
    totalInterventions: 2,
    areaRestored: 0.1,
    joinDate: "2024-12-20",
    recentActivity: "Created a mini-forest in her backyard"
  },
  {
    id: 18,
    uid: "user-018",
    displayName: "London Central School",
    firstName: "London Central",
    lastName: "School",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=150&h=150&fit=crop",
    type: "school",
    country: "UK",
    totalTrees: 41,
    totalInterventions: 5,
    areaRestored: 0.7,
    joinDate: "2024-12-25",
    recentActivity: "Christmas tree planting event"
  },
  {
    id: 19,
    uid: "user-019",
    displayName: "Imran Siddiqui",
    firstName: "Imran",
    lastName: "Siddiqui",
    image: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150&h=150&fit=crop&crop=face",
    type: "individual",
    country: "Pakistan",
    totalTrees: 34,
    totalInterventions: 3,
    areaRestored: 0.5,
    joinDate: "2025-01-10",
    recentActivity: "Planted shade trees in Lahore streets"
  },
  {
    id: 20,
    uid: "user-020",
    displayName: "Charlotte Evans",
    firstName: "Charlotte",
    lastName: "Evans",
    image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150&h=150&fit=crop&crop=face",
    type: "individual",
    country: "UK",
    totalTrees: 27,
    totalInterventions: 3,
    areaRestored: 0.2,
    joinDate: "2025-01-22",
    recentActivity: "Maintained 20 newly planted beech trees"
  }
];


const timeFilters = [
  { id: 'all-time', label: 'All Time', icon: Calendar },
  { id: 'this-year', label: 'This Year', icon: Calendar },
  { id: 'this-month', label: 'This Month', icon: Calendar }
];

const getRankIcon = (position) => {
  switch (position) {
    case 1:
      return <Crown className="h-6 w-6 text-yellow-500" />;
    case 2:
      return <Medal className="h-6 w-6 text-gray-400" />;
    case 3:
      return <Award className="h-6 w-6 text-amber-600" />;
    default:
      return <span className="text-lg font-bold text-gray-400">#{position}</span>;
  }
};

const getUserTypeColor = (type) => {
  switch (type) {
    case 'organization':
      return 'bg-blue-100 text-blue-800';
    case 'tpo':
      return 'bg-green-100 text-green-800';
    case 'school':
      return 'bg-purple-100 text-purple-800';
    case 'individual':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getUserTypeLabel = (type) => {
  switch (type) {
    case 'tpo':
      return 'TPO';
    case 'organization':
      return 'Org';
    case 'school':
      return 'School';
    case 'individual':
      return 'Individual';
    default:
      return type;
  }
};

export default function ForestLeaderboard() {
  const [selectedFilter, setSelectedFilter] = useState('all-time');
  const [showDetails, setShowDetails] = useState({});

  const toggleDetails = (userId) => {
    setShowDetails(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  return (
    <div className="w-full mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-[#007A49] rounded-lg">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Forest Champions</h1>
        </div>
        <p className="text-gray-600">Leading contributors for the project.</p>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
          {timeFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedFilter(filter.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                selectedFilter === filter.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <filter.icon className="h-4 w-4" />
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TreePine className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Trees</p>
              <p className="text-2xl font-bold text-gray-900">
                {leaderboardData.reduce((sum, user) => sum + user.totalTrees, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Leaf className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Area Restored</p>
              <p className="text-2xl font-bold text-gray-900">
                {leaderboardData.reduce((sum, user) => sum + user.areaRestored, 0).toFixed(1)} ha
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Contributors</p>
              <p className="text-2xl font-bold text-gray-900">{leaderboardData.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Rankings</h2>
        </div>
        
        <div className="divide-y divide-gray-100">
          {leaderboardData.map((user, index) => (
            <motion.div
              key={user.uid}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="flex-shrink-0 w-12 flex justify-center">
                    {getRankIcon(index + 1)}
                  </div>
                  
                  {/* User Info */}
                  <div className="flex items-center gap-4">
                    <img
                      src={user.image}
                      alt={user.displayName}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{user.displayName}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUserTypeColor(user.type)}`}>
                          {getUserTypeLabel(user.type)}
                        </span>
                        {user.country && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="h-3 w-3" />
                            {user.country}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{user.recentActivity}</p>
                    </div>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{user.totalTrees.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">trees planted</p>
                  </div>
                  
                  <button
                    onClick={() => toggleDetails(user.uid)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <motion.div
                      animate={{ rotate: showDetails[user.uid] ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    </motion.div>
                  </button>
                </div>
              </div>
              
              {/* Expandable Details */}
              <AnimatePresence>
                {showDetails[user.uid] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 pl-16"
                  >
                    <div className="grid grid-cols-3 gap-6 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Interventions</p>
                        <p className="text-lg font-semibold text-gray-900">{user.totalInterventions}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Area Restored</p>
                        <p className="text-lg font-semibold text-gray-900">{user.areaRestored} ha</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Member Since</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {new Date(user.joinDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Rankings updated in real-time • Join the global reforestation movement
        </p>
      </div>
    </div>
  );
}