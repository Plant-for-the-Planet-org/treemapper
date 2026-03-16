import React, { useState, useEffect } from 'react';
import { Trees, MapPin, Users, Leaf, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useToken } from '@/context/useTokenContext'
import useProject from '@shared-core/store/useProjectStore';
import { getDashboardRecentAddition } from '@shared-core/fetchApi/api.fetch';
import avatar from 'animal-avatar-generator'

// Activity type to icon mapping
const getActivityIcon = (activityType) => {
  switch (activityType) {
    case 'intervention':
      return <Trees size={18} className="text-green-600" />;
    case 'site':
      return <MapPin size={18} className="text-blue-600" />;
    case 'species':
      return <Leaf size={18} className="text-emerald-600" />;
    case 'member':
      return <Users size={18} className="text-purple-600" />;
    default:
      return <Trees size={18} className="text-gray-600" />;
  }
};

// Format activity value based on type
const getActivityValue = (activity) => {
  switch (activity.activityType) {
    case 'intervention':
      return activity.details?.treeCount ? `${activity.details.treeCount.toLocaleString()}` : '';
    case 'site':
      return activity.details?.areaInHa ? `${activity.details.areaInHa} ha` : '';
    case 'species':
      return activity.details?.speciesName || '';
    case 'member':
      return ''; // Remove duplicate member name display
    default:
      return '';
  }
};

// Gender-neutral default avatar SVG
const DefaultAvatar = () => (
  <div className="w-10 h-10 rounded-full mr-3 overflow-hidden bg-gray-200 flex-shrink-0 flex items-center justify-center">
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="20" cy="20" r="20" fill="#D1D5DB" />
      <circle cx="20" cy="16" r="7" fill="#9CA3AF" />
      <path d="M6 36c0-7.732 6.268-14 14-14s14 6.268 14 14" fill="#9CA3AF" />
    </svg>
  </div>
);

// User Avatar component
const UserAvatar = ({ user }) => {
  const [imgError, setImgError] = React.useState(false);

  if (!user.image || imgError) {
    return user.image && imgError
      ? <DefaultAvatar />
      : customImageGenerator(user.uid);
  }

  return (
    <div className="w-10 h-10 rounded-full mr-3 overflow-hidden bg-gray-200 flex-shrink-0">
      <img
        src={user.image}
        alt={`${user.name}'s avatar`}
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
      />
    </div>
  );
};

const customImageGenerator = (id) => {
  const svg = avatar(id, { size: 36 })
  return <div
    style={{ marginRight: 10 }}
    className="h-10 w-10 rounded-full overflow-hidden"
    dangerouslySetInnerHTML={{ __html: svg }}
  />
}

// Format date to readable format
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const RecentAdditionsComponent = () => {
  const [activities, setActivities] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    hasMore: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { accessToken } = useToken()
  const selectedProject = useProject(state => state.selectedProject)

  // Fetch activities from API
  const fetchActivities = async (page = 1, limit = 10) => {
    setLoading(true);
    setError(null);

    try {
      const response = await getDashboardRecentAddition(accessToken || '', selectedProject?.uid || '', page, limit)
      if (response && response.statusCode !== 200) {
        throw new Error('Failed to fetch activities');
      }

      if (response.data) {
        setActivities(response.data.activities);
        setPagination({
          page: parseInt(response.data.pagination.page),
          limit: parseInt(response.data.pagination.limit),
          total: response.data.pagination.total,
          hasMore: response.data.pagination.hasMore
        });
      } else {
        throw new Error(response.message || 'Failed to fetch activities');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProject && selectedProject.uid) {
      fetchActivities();
    }
  }, [selectedProject]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= Math.ceil(pagination.total / pagination.limit)) {
      fetchActivities(newPage, pagination.limit);
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[10vh] max-h-[50vh] max-w-4xl w-full flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-red-600">
            <p className="text-gray-900 text-sm font-medium mb-2">Error loading activities</p>
            <p className="text-xs text-gray-500 mb-3">{error}</p>
            <button
              onClick={() => fetchActivities()}
              className="px-3 py-1.5 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors text-xs font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[20vh] max-h-[50vh] max-w-4xl w-full flex flex-col">
      {/* Header - Fixed */}
      <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {pagination.total > 0
                ? `${pagination.total} recent activities`
                : 'No recent activities found'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Content Area - Scrollable */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex items-center text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm font-medium">Loading activities...</span>
            </div>
          </div>
        ) : activities.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Trees className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-800">No activities yet</p>
              <p className="text-xs mt-1">Recent project activities will appear here</p>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto px-5 py-3">
            <div className="space-y-2.5">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
                >
                  <div className="flex items-center min-w-0 flex-1">
                    <UserAvatar user={activity.user} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {activity.user.name}
                        </h3>
                        <span className="text-gray-400 text-xs">•</span>
                        <time className="text-xs text-gray-500 flex-shrink-0">
                          {formatDate(activity.timeOfActivity)}
                        </time>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {activity.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 ml-3 flex-shrink-0">
                    {getActivityValue(activity) && (
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">
                          {getActivityValue(activity)}
                        </div>
                        <div className="text-[10px] text-gray-500 capitalize font-medium">
                          {activity.activityType}
                        </div>
                      </div>
                    )}
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                      {getActivityIcon(activity.activityType)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pagination Footer - Fixed */}
      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-gray-100 flex-shrink-0 bg-gray-50 rounded-b-xl">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600 font-medium">
              Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1 || loading}
                className="p-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <ChevronLeft size={14} />
              </button>

              <div className="flex items-center gap-1 mx-1.5">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={loading}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors shadow-sm ${pagination.page === pageNum
                          ? 'bg-blue-600 text-white shadow-blue-100'
                          : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasMore || loading}
                className="p-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentAdditionsComponent;