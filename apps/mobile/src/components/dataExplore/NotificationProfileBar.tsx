import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NotificationProfileBarProps {
  notificationCount?: number;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  style?: ViewStyle;
  showProfileImage?: boolean;
  profileImageUri?: string;
}

const NotificationProfileBar: React.FC<NotificationProfileBarProps> = ({
  notificationCount = 0,
  onNotificationPress,
  onProfilePress,
  style,
  showProfileImage = false,
  profileImageUri,
}) => {
  const hasNotifications = notificationCount > 0;
  const displayCount = notificationCount > 99 ? '99+' : notificationCount.toString();

  return (
    <View style={[styles.container, style]}>
      {/* Notification Icon */}
      <TouchableOpacity
        style={styles.iconButton}
        onPress={onNotificationPress}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name="notifications-outline"
            size={24}
            color="#007A49"
          />
          {hasNotifications && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{displayCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Profile Icon */}
      <TouchableOpacity
        style={styles.iconButton}
        onPress={onProfilePress}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          {showProfileImage && profileImageUri ? (
            <View style={styles.profileImageContainer}>
              {/* You can replace this with expo-image if needed */}
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileInitial}>U</Text>
              </View>
            </View>
          ) : (
            <Ionicons
              name="person-outline"
              size={24}
              color="#007A49"
            />
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    minWidth: 100,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 122, 73, 0.1)',
    marginHorizontal: 4,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  profileImageContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#007A49',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  profileInitial: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default NotificationProfileBar;