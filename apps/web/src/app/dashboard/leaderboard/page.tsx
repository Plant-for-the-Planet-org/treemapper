'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Medal,
  Award,
  TreePine,
  Users,
  Calendar,
  ChevronDown,
  Crown,
  Leaf,
  MapPin,
  Loader2,
  TreeDeciduous
} from 'lucide-react';
import { getProjectAnalytics } from '@shared-core/fetchApi/api.fetch';
import { useToken } from '@/context/useTokenContext';
import useProjectStore from '@shared-core/store/useProjectStore';

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

const getRoleColor = (role) => {
  switch (role) {
    case 'owner':
      return 'bg-purple-100 text-purple-800';
    case 'admin':
      return 'bg-blue-100 text-blue-800';
    case 'contributor':
      return 'bg-green-100 text-green-800';
    case 'observer':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getRoleLabel = (role) => {
  switch (role) {
    case 'owner':
      return 'Owner';
    case 'admin':
      return 'Admin';
    case 'contributor':
      return 'Contributor';
    case 'observer':
      return 'Observer';
    default:
      return role || 'Member';
  }
};

// Skeleton loader component
const LeaderboardSkeleton = () => (
  <div className="divide-y divide-gray-100">
    {[...Array(5)].map((_, index) => (
      <div key={index} className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 flex justify-center">
              <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse"></div>
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mt-2"></div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-right">
              <div className="h-6 w-12 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Empty state component
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-16">
    <TreeDeciduous className="h-16 w-16 text-gray-300 mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">No Champions Yet</h3>
    <p className="text-gray-500 text-center max-w-sm">
      Start planting trees and interventions to appear on the leaderboard
    </p>
  </div>
);

export default function ForestLeaderboard() {
  const [selectedFilter, setSelectedFilter] = useState('all-time');
  const [showDetails, setShowDetails] = useState({});
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState(null);
  const selectedProject = useProjectStore(state => state.selectedProject);
  const { accessToken } = useToken();
  const toggleDetails = (userId) => {
    setShowDetails(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // API call function
  const fetchLeaderboard = useCallback(async (page = 1, timeFilter = 'all-time', append = false) => {
    try {
      if (page === 1) {
        setLoading(true);
        setLeaderboardData([]);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const response = await getProjectAnalytics(accessToken || '', selectedProject?.uid);

      const data = response.data

      if (append && page > 1) {
        setLeaderboardData(prev => [...prev, ...data.items]);
      } else {
        setLeaderboardData(data.items);
      }

      setTotalCount(data.totalCount);
      setHasMore(data.currentPage < data.totalPages);
      setCurentPage(data.currentPage);

    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedProject]);

  // Initial load and filter change
  useEffect(() => {
    if (selectedProject) {
      fetchLeaderboard(1, selectedFilter, false);
    }
  }, [selectedProject, selectedFilter, fetchLeaderboard]);

  // Load more function for infinite scroll
  const loadMore = () => {
    if (hasMore && !loadingMore) {
      const nextPage = currentPage + 1;
      fetchLeaderboard(nextPage, selectedFilter, true);
    }
  };

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000
      ) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadingMore, currentPage]);

  const handleFilterChange = (filterId) => {
    setSelectedFilter(filterId);
    setCurentPage(1);
    setHasMore(true);
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
        {totalCount > 0 && (
          <p className="text-sm text-gray-500 mt-1">
            Showing {leaderboardData.length} of {totalCount.toLocaleString()} champions
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
          {timeFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => handleFilterChange(filter.id)}
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all disabled:opacity-50 ${selectedFilter === filter.id
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

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="text-red-400 mr-2">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-red-800">Error loading leaderboard</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={() => fetchLeaderboard(1, selectedFilter, false)}
                className="text-sm text-red-800 underline mt-2"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Rankings</h2>
        </div>

        {/* Loading State */}
        {loading && <LeaderboardSkeleton />}

        {/* Empty State */}
        {!loading && leaderboardData.length === 0 && !error && <EmptyState />}

        {/* Leaderboard Data */}
        {!loading && leaderboardData.length > 0 && (
          <div className="divide-y divide-gray-100">
            {leaderboardData.map((user, index) => (
              <motion.div
                key={user.uid}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="flex-shrink-0 w-12 flex justify-center">
                      {getRankIcon(index + 1 + (currentPage - 1) * 20)}
                    </div>

                    {/* User Info */}
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.displayName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Users className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{user.displayName}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                            {getRoleLabel(user.role)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Member since {user.joinDate ? new Date(user.joinDate).toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric'
                          }) : 'N/A'}
                        </p>
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
                          <p className="text-sm font-medium text-gray-700">Trees Planted</p>
                          <p className="text-lg font-semibold text-gray-900">{user.totalTrees.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Interventions</p>
                          <p className="text-lg font-semibold text-gray-900">{user.totalInterventions.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Species Count</p>
                          <p className="text-lg font-semibold text-gray-900">{user.totalSpecies.toLocaleString()}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}

            {/* Load More Indicator */}
            {loadingMore && (
              <div className="p-6 flex justify-center">
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading more champions...</span>
                </div>
              </div>
            )}

            {/* End of Results */}
            {!hasMore && leaderboardData.length > 0 && (
              <div className="p-6 text-center">
                <p className="text-sm text-gray-500">
                  You've reached the end! 🌳 All {totalCount.toLocaleString()} champions shown.
                </p>
              </div>
            )}
          </div>
        )}
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