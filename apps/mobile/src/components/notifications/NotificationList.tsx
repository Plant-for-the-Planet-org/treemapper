import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'
import React, { useState, useEffect, useCallback } from 'react'
import { Colors, Typography } from 'src/utils/constants'
import { scaleFont, scaleSize } from 'src/utils/constants/mixins'
import { getNotifications, markNotificationAsRead } from 'src/api/api.fetch'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'

interface NotificationItem {
  uid: string
  type: string
  title: string
  message: string
  isRead: boolean
  priority?: string
  category?: string
  actionUrl?: string
  actionText?: string
  image?: string
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

interface NotificationResponse {
  notifications: NotificationItem[]
  pagination: Pagination
  unreadCount: number
}

const NotificationList = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  const loadNotifications = useCallback(async (pageNum: number = 1, isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else if (pageNum === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      const result = await getNotifications(pageNum, 20)
      
      if (result.success && result.response) {
        const data: NotificationResponse = result.response
        if (pageNum === 1) {
          setNotifications(data.notifications)
        } else {
          setNotifications(prev => [...prev, ...data.notifications])
        }
        setPagination(data.pagination)
      }
    } catch (error) {
      console.log('Error loading notifications:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications(1)
  }, [loadNotifications])

  const handleRefresh = useCallback(() => {
    setPage(1)
    loadNotifications(1, true)
  }, [loadNotifications])

  const handleLoadMore = useCallback(() => {
    if (pagination?.hasNextPage && !loadingMore) {
      const nextPage = page + 1
      setPage(nextPage)
      loadNotifications(nextPage)
    }
  }, [pagination, loadingMore, page, loadNotifications])

  const handleNotificationPress = async (notification: NotificationItem) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification.uid)
        // Update local state
        setNotifications(prev =>
          prev.map(item =>
            item.uid === notification.uid ? { ...item, isRead: true } : item
          )
        )
      } catch (error) {
        console.log('Error marking notification as read:', error)
      }
    }

    // Navigate to detail screen (we'll create this)
    navigation.navigate('NotificationDetail', { notificationUid: notification.uid })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return 'Just now'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes}m ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours}h ago`
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'HIGH':
        return Colors.NEW_PRIMARY || '#007A49'
      case 'MEDIUM':
        return '#FFA500'
      case 'LOW':
        return Colors.TEXT_LIGHT
      default:
        return Colors.TEXT_LIGHT
    }
  }

  const renderNotificationItem = ({ item }: { item: NotificationItem }) => {
    return (
      <TouchableOpacity
        style={[styles.notificationItem, !item.isRead && styles.unreadNotification]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle} numberOfLines={2}>
              {item.title}
            </Text>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.message}
          </Text>
          <View style={styles.notificationFooter}>
            <Text style={styles.notificationDate}>{formatDate(item.createdAt)}</Text>
            {item.priority && (
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
                <Text style={styles.priorityText}>{item.priority}</Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.TEXT_LIGHT} />
      </TouchableOpacity>
    )
  }

  const renderFooter = () => {
    if (!loadingMore) return null
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.NEW_PRIMARY || '#007A49'} />
      </View>
    )
  }

  const renderEmpty = () => {
    if (loading) return null
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="notifications-outline" size={64} color={Colors.TEXT_LIGHT} />
        <Text style={styles.emptyText}>No notifications yet</Text>
        <Text style={styles.emptySubtext}>You'll see notifications here when you receive them</Text>
      </View>
    )
  }

  if (loading && notifications.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.NEW_PRIMARY || '#007A49'} />
      </View>
    )
  }

  return (
    <FlatList
      data={notifications}
      renderItem={renderNotificationItem}
      keyExtractor={(item) => item.uid}
      contentContainerStyle={styles.listContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[Colors.NEW_PRIMARY || '#007A49']}
        />
      }
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
    />
  )
}

export default NotificationList

const styles = StyleSheet.create({
  listContainer: {
    padding: scaleSize(16),
    paddingBottom: scaleSize(32),
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
    padding: scaleSize(16),
    marginBottom: scaleSize(12),
    shadowColor: Colors.GRAY_BACKDROP,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.NEW_PRIMARY || '#007A49',
    backgroundColor: Colors.LIGHT_PRIMARY || '#F0F9F6',
  },
  notificationContent: {
    flex: 1,
    marginRight: scaleSize(12),
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleSize(4),
  },
  notificationTitle: {
    flex: 1,
    fontSize: scaleFont(16),
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.DARK_TEXT_COLOR,
    marginRight: scaleSize(8),
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.NEW_PRIMARY || '#007A49',
  },
  notificationMessage: {
    fontSize: scaleFont(14),
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_COLOR,
    marginBottom: scaleSize(8),
    lineHeight: scaleFont(20),
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationDate: {
    fontSize: scaleFont(12),
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_LIGHT,
  },
  priorityBadge: {
    paddingHorizontal: scaleSize(8),
    paddingVertical: scaleSize(4),
    borderRadius: 4,
  },
  priorityText: {
    fontSize: scaleFont(10),
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.WHITE,
    textTransform: 'uppercase',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLoader: {
    paddingVertical: scaleSize(20),
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: scaleSize(80),
  },
  emptyText: {
    fontSize: scaleFont(18),
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
    marginTop: scaleSize(16),
    marginBottom: scaleSize(8),
  },
  emptySubtext: {
    fontSize: scaleFont(14),
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_LIGHT,
    textAlign: 'center',
  },
})
