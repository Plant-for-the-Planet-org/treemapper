import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native'
import React, { useState, useEffect } from 'react'
import Header from 'src/components/common/Header'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Typography } from 'src/utils/constants'
import { scaleFont, scaleSize } from 'src/utils/constants/mixins'
import { RouteProp, useRoute } from '@react-navigation/native'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { getNotifications, markNotificationAsRead } from 'src/api/api.fetch'
import { Ionicons } from '@expo/vector-icons'

type NotificationDetailRouteProp = RouteProp<RootStackParamList, 'NotificationDetail'>

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

const NotificationDetailView = () => {
  const route = useRoute<NotificationDetailRouteProp>()
  const { notificationUid } = route.params
  const [notification, setNotification] = useState<NotificationItem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotification()
  }, [notificationUid])

  const loadNotification = async () => {
    try {
      setLoading(true)
      // Fetch all notifications and find the one with matching UID
      const result = await getNotifications(1, 100)
      
      if (result.success && result.response) {
        const found = result.response.notifications.find(
          (n: NotificationItem) => n.uid === notificationUid
        )
        if (found) {
          setNotification(found)
          
          // Mark as read if not already read
          if (!found.isRead) {
            try {
              await markNotificationAsRead(found.uid)
            } catch (error) {
              console.error('Error marking notification as read:', error)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading notification:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header label="Notification Details" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.NEW_PRIMARY || '#007A49'} />
        </View>
      </SafeAreaView>
    )
  }

  if (!notification) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header label="Notification Details" />
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.TEXT_LIGHT} />
          <Text style={styles.emptyText}>Notification not found</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header label="Notification Details" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {!!notification.image && (
          <Image source={{ uri: notification.image }} style={styles.image} />
        )}
        
        <View style={styles.headerSection}>
          <Text style={styles.title}>{notification.title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.date}>{formatDate(notification.createdAt)}</Text>
            {notification.priority && (
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(notification.priority) }]}>
                <Text style={styles.priorityText}>{notification.priority}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.messageSection}>
          <Text style={styles.message}>{notification.message}</Text>
        </View>

        {notification.category && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Category:</Text>
            <Text style={styles.infoValue}>{notification.category}</Text>
          </View>
        )}

        {notification.type && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type:</Text>
            <Text style={styles.infoValue}>{notification.type}</Text>
          </View>
        )}

        {!!notification.actionUrl && !!notification.actionText && (
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>{notification.actionText}</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.WHITE} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

export default NotificationDetailView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: scaleSize(20),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
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
  },
  image: {
    width: '100%',
    height: scaleSize(200),
    borderRadius: 12,
    marginBottom: scaleSize(20),
    backgroundColor: Colors.BACKDROP_COLOR,
  },
  headerSection: {
    marginBottom: scaleSize(20),
  },
  title: {
    fontSize: scaleFont(24),
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: Colors.DARK_TEXT_COLOR,
    marginBottom: scaleSize(12),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: {
    fontSize: scaleFont(14),
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_LIGHT,
  },
  priorityBadge: {
    paddingHorizontal: scaleSize(12),
    paddingVertical: scaleSize(6),
    borderRadius: 6,
  },
  priorityText: {
    fontSize: scaleFont(12),
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.WHITE,
    textTransform: 'uppercase',
  },
  messageSection: {
    marginBottom: scaleSize(24),
    paddingBottom: scaleSize(24),
    borderBottomWidth: 1,
    borderBottomColor: Colors.BACKDROP_COLOR,
  },
  message: {
    fontSize: scaleFont(16),
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_COLOR,
    lineHeight: scaleFont(24),
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: scaleSize(12),
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: scaleFont(14),
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
    marginRight: scaleSize(8),
    width: scaleSize(100),
  },
  infoValue: {
    fontSize: scaleFont(14),
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_LIGHT,
    flex: 1,
    textTransform: 'capitalize',
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: Colors.NEW_PRIMARY || '#007A49',
    borderRadius: 8,
    padding: scaleSize(16),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scaleSize(20),
  },
  actionButtonText: {
    fontSize: scaleFont(16),
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.WHITE,
    marginRight: scaleSize(8),
  },
})
