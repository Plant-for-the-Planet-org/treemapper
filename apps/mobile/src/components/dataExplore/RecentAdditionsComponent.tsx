import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { SvgXml } from 'react-native-svg';
// Note: You'll need to install animal-avatar-generator for React Native
// import avatar from 'animal-avatar-generator';

interface User {
  id: string;
  name: string;
  image?: string;
}

interface ActivityDetails {
  treeCount?: number;
  areaInHa?: number;
  speciesName?: string;
  memberName?: string;
}

interface Activity {
  id: string;
  activityType: 'intervention' | 'site' | 'species' | 'member';
  description: string;
  timeOfActivity: string;
  user: User;
  details?: ActivityDetails;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

interface RecentAdditionsProps {
  onFetchActivities?: (page: number, limit: number) => Promise<{
    activities: Activity[];
    pagination: Pagination;
  }>;
}

const { width: screenWidth } = Dimensions.get('window');

const RecentAdditionsComponent: React.FC<RecentAdditionsProps> = ({
  onFetchActivities,
}) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    hasMore: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Activity type to icon mapping
  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'intervention':
        return <Ionicons name="leaf-outline" size={20} color="#059669" />;
      case 'site':
        return <Ionicons name="location-outline" size={20} color="#2563EB" />;
      case 'species':
        return <Ionicons name="flower-outline" size={20} color="#047857" />;
      case 'member':
        return <Ionicons name="people-outline" size={20} color="#7C3AED" />;
      default:
        return <Ionicons name="leaf-outline" size={20} color="#6B7280" />;
    }
  };

  // Format activity value based on type
  const getActivityValue = (activity: Activity): string => {
    switch (activity.activityType) {
      case 'intervention':
        return activity.details?.treeCount 
          ? `${activity.details.treeCount.toLocaleString()}`
          : '';
      case 'site':
        return activity.details?.areaInHa 
          ? `${activity.details.areaInHa} ha`
          : '';
      case 'species':
        return activity.details?.speciesName || '';
      case 'member':
        return activity.details?.memberName || '';
      default:
        return '';
    }
  };

  // Generate dummy data for demonstration
  const generateDummyData = (page: number, limit: number) => {
    const activityTypes = ['intervention', 'site', 'species', 'member'];
    const users = [
      'John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 
      'David Brown', 'Emily Davis', 'Chris Miller', 'Anna Garcia'
    ];
    
    const activities: Activity[] = [];
    const startIndex = (page - 1) * limit;
    
    for (let i = 0; i < limit; i++) {
      const index = startIndex + i;
      if (index >= 50) break; // Limit total to 50 items
      
      const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const user = users[Math.floor(Math.random() * users.length)];
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      let details: ActivityDetails = {};
      let description = '';
      
      switch (activityType) {
        case 'intervention':
          details.treeCount = Math.floor(Math.random() * 100) + 10;
          description = `Planted ${details.treeCount} trees in the northern sector`;
          break;
        case 'site':
          details.areaInHa = parseFloat((Math.random() * 5 + 0.5).toFixed(2));
          description = `Created new planting site covering ${details.areaInHa} hectares`;
          break;
        case 'species':
          const species = ['Oak', 'Pine', 'Maple', 'Birch', 'Cedar'];
          details.speciesName = species[Math.floor(Math.random() * species.length)];
          description = `Added new species: ${details.speciesName}`;
          break;
        case 'member':
          details.memberName = user;
          description = `New team member ${details.memberName} joined the project`;
          break;
      }
      
      activities.push({
        id: `activity-${index}`,
        activityType: activityType as any,
        description,
        timeOfActivity: date.toISOString(),
        user: {
          id: `user-${index}`,
          name: user,
        },
        details,
      });
    }
    
    return {
      activities,
      pagination: {
        page,
        limit,
        total: 50,
        hasMore: startIndex + limit < 50,
      },
    };
  };

  // User Avatar component
  const UserAvatar: React.FC<{ user: User; index: number }> = ({ user, index }) => {
    // For now, using a placeholder. You can implement animal-avatar-generator here
    // const avatarSvg = avatar(user.id, { size: 48 });
    
    const fallbackUrl = `https://avatar.iran.liara.run/public/${(index % 50) + 1}`;
    
    return (
      <View style={styles.avatarContainer}>
        {user.image ? (
          <Image
            source={{ uri: user.image }}
            style={styles.avatar}
            onError={() => {
              // Handle error by showing fallback
            }}
          />
        ) : (
          <Image
            source={{ uri: fallbackUrl }}
            style={styles.avatar}
          />
        )}
        {/* 
        Alternative: Use animal-avatar-generator with SvgXml
        <SvgXml xml={avatarSvg} width={48} height={48} />
        */}
      </View>
    );
  };

  // Format date to readable format
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Fetch activities
  const fetchActivities = async (page: number = 1, limit: number = 10) => {
    setLoading(true);
    setError(null);

    try {
      let result;
      if (onFetchActivities) {
        result = await onFetchActivities(page, limit);
      } else {
        // Simulate API call with dummy data
        await new Promise(resolve => setTimeout(resolve, 1000));
        result = generateDummyData(page, limit);
      }

      setActivities(result.activities);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch activities';
      setError(errorMessage);
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handlePageChange = (newPage: number) => {
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    if (newPage >= 1 && newPage <= totalPages) {
      fetchActivities(newPage, pagination.limit);
    }
  };

  const handleRetry = () => {
    Alert.alert(
      'Retry',
      'Do you want to retry loading the activities?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Retry', onPress: () => fetchActivities(pagination.page, pagination.limit) },
      ]
    );
  };

  const renderActivityItem = ({ item, index }: { item: Activity; index: number }) => (
    <View style={styles.activityCard}>
      <View style={styles.activityContent}>
        <UserAvatar user={item.user} index={index} />
        <View style={styles.activityDetails}>
          <View style={styles.activityHeader}>
            <Text style={styles.userName} numberOfLines={1}>
              {item.user.name}
            </Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.timeText}>
              {formatDate(item.timeOfActivity)}
            </Text>
          </View>
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
      </View>
      
      <View style={styles.activityMeta}>
        {getActivityValue(item) && (
          <View style={styles.valueContainer}>
            <Text style={styles.valueText}>
              {getActivityValue(item)}
            </Text>
            <Text style={styles.typeText}>
              {item.activityType}
            </Text>
          </View>
        )}
        <View style={styles.iconContainer}>
          {getActivityIcon(item.activityType)}
        </View>
      </View>
    </View>
  );

  const renderPagination = () => {
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const maxVisible = 5;
      
      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else if (pagination.page <= 3) {
        for (let i = 1; i <= maxVisible; i++) {
          pages.push(i);
        }
      } else if (pagination.page >= totalPages - 2) {
        for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = pagination.page - 2; i <= pagination.page + 2; i++) {
          pages.push(i);
        }
      }
      
      return pages;
    };

    return (
      <View style={styles.paginationContainer}>
        <Text style={styles.paginationInfo}>
          Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
        </Text>

        <View style={styles.paginationControls}>
          <TouchableOpacity
            style={[styles.paginationButton, pagination.page === 1 && styles.paginationButtonDisabled]}
            onPress={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1 || loading}
          >
            <Ionicons name="chevron-back" size={16} color={pagination.page === 1 ? '#9CA3AF' : '#374151'} />
          </TouchableOpacity>

          <View style={styles.pageNumbers}>
            {getPageNumbers().map((pageNum) => (
              <TouchableOpacity
                key={pageNum}
                style={[
                  styles.pageButton,
                  pagination.page === pageNum && styles.pageButtonActive
                ]}
                onPress={() => handlePageChange(pageNum)}
                disabled={loading}
              >
                <Text style={[
                  styles.pageButtonText,
                  pagination.page === pageNum && styles.pageButtonTextActive
                ]}>
                  {pageNum}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.paginationButton, !pagination.hasMore && styles.paginationButtonDisabled]}
            onPress={() => handlePageChange(pagination.page + 1)}
            disabled={!pagination.hasMore || loading}
          >
            <Ionicons name="chevron-forward" size={16} color={!pagination.hasMore ? '#9CA3AF' : '#374151'} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Recent Additions</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Error loading activities</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Recent Additions</Text>
        <Text style={styles.subtitle}>
          {pagination.total > 0
            ? `${pagination.total} recent activities`
            : 'No recent activities found'
          }
        </Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007A49" />
            <Text style={styles.loadingText}>Loading activities...</Text>
          </View>
        ) : activities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="leaf-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No activities yet</Text>
            <Text style={styles.emptyMessage}>Recent project activities will appear here</Text>
          </View>
        ) : (
          <FlashList
            data={activities}
            renderItem={renderActivityItem}
            keyExtractor={(item) => item.id}
            estimatedItemSize={100}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      {/* Pagination */}
      {renderPagination()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    height: 600,
    marginVertical:10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 16,
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
  },
  activityDetails: {
    flex: 1,
    minWidth: 0,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  separator: {
    color: '#9CA3AF',
    marginRight: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  valueContainer: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  valueText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  typeText: {
    fontSize: 10,
    color: '#6B7280',
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
  },
  paginationContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#F9FAFB',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  paginationInfo: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
    marginBottom: 12,
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paginationButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  pageNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pageButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  pageButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  pageButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  pageButtonTextActive: {
    color: '#FFFFFF',
  },
});

export default RecentAdditionsComponent;