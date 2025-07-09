import React, { useState, useEffect } from 'react';
import { Trees, MapPin, Users, Leaf, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useToken } from '../../../../context/TokenContext'
import useProject from '../../../../store/useProjectStore';
import { getDashboardRecentAddition } from '../../../../api/api.fetch';
import avatar from 'animal-avatar-generator'

// Activity type to icon mapping
const getActivityIcon = (activityType) => {
  switch (activityType) {
    case 'intervention':
      return <Trees size={20} className="text-green-600" />;
    case 'site':
      return <MapPin size={20} className="text-blue-600" />;
    case 'species':
      return <Leaf size={20} className="text-emerald-600" />;
    case 'member':
      return <Users size={20} className="text-purple-600" />;
    default:
      return <Trees size={20} className="text-gray-600" />;
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
      return activity.details?.memberName || '';
    default:
      return '';
  }
};

// User Avatar component
const UserAvatar = ({ user, index }) => {
  if (!user.image) {
    return customImageGenerator(user.uid)
  }
  const imageUrl = user.image
    ? `${user.image}`
    : `https://avatar.iran.liara.run/public/${(index % 50) + 1}`;

  return (
    <div className="w-12 h-12 rounded-full mr-4 overflow-hidden bg-gray-200 flex-shrink-0">
      <img
        src={imageUrl}
        alt={`${user.name}'s avatar`}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.target.src = `https://avatar.iran.liara.run/public/${(index % 50) + 1}`;
        }}
      />
    </div>
  );
};

const customImageGenerator = (id) => {
  const svg = avatar(id, { size: 40 })
  return <div
    style={{ marginRight: 10 }}
    className="h-15 w-15 rounded-full overflow-hidden"
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-[600px] max-w-4xl w-full flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-red-600">
            <p className="text-gray-900 font-medium mb-2">Error loading activities</p>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <button
              onClick={() => fetchActivities()}
              className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-[600px] max-w-4xl w-full flex flex-col">
      {/* Header - Fixed */}
      <div className="px-6 py-5 border-b border-gray-100 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Recent Additions</h2>
            <p className="text-gray-500 mt-1">
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
              <Loader2 className="w-6 h-6 animate-spin mr-3" />
              <span className="font-medium">Loading activities...</span>
            </div>
          </div>
        ) : activities.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Trees className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="font-medium text-gray-900">No activities yet</p>
              <p className="text-sm mt-1">Recent project activities will appear here</p>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                >
                  <div className="flex items-center min-w-0 flex-1">
                    <UserAvatar user={activity.user} index={index} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {activity.user.name}
                        </h3>
                        <span className="text-gray-400">•</span>
                        <time className="text-sm text-gray-500 flex-shrink-0">
                          {formatDate(activity.timeOfActivity)}
                        </time>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {activity.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                    {getActivityValue(activity) && (
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {getActivityValue(activity)}
                        </div>
                        <div className="text-xs text-gray-500 capitalize font-medium">
                          {activity.activityType}
                        </div>
                      </div>
                    )}
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
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
        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 font-medium">
              Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1 || loading}
                className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-1 mx-2">
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
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm ${pagination.page === pageNum
                          ? 'bg-blue-600 text-white shadow-blue-200'
                          : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'
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
                className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentAdditionsComponent;