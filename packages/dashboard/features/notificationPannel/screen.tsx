import React, { useState, useEffect } from 'react';
import { YStack, XStack, Text, Avatar, ScrollView, Button, Card } from 'tamagui';
import { Check, ArrowLeft } from '@tamagui/lucide-icons';
import { useRouter } from 'solito/router';

// Sample notification data
const DUMMY_NOTIFICATIONS = [
  {
    id: '1',
    userName: 'Sarah Johnson',
    userImage: 'https://randomuser.me/api/portraits/women/44.jpg',
    message: 'Joined the project "Amazon Rainforest Conservation"',
    time: new Date(Date.now() - 10 * 60000), // 10 minutes ago
    isNew: true,
    type: 'project_join'
  },
  {
    id: '2',
    userName: 'Michael Chen',
    userImage: 'https://randomuser.me/api/portraits/men/22.jpg',
    message: 'Created new site for "Amazon Rainforest Conservation"',
    time: new Date(Date.now() - 2 * 60 * 60000), // 2 hours ago
    isNew: true,
    type: 'site_creation'
  },
  {
    id: '3',
    userName: 'Elena Rodriguez',
    userImage: 'https://randomuser.me/api/portraits/women/65.jpg',
    message: 'Added new intervention in Yucatan, Mexico',
    time: new Date(Date.now() - 5 * 60 * 60000), // 5 hours ago
    isNew: true,
    type: 'intervention'
  },
  {
    id: '4',
    userName: 'James Wilson',
    userImage: 'https://randomuser.me/api/portraits/men/32.jpg',
    message: 'Created project "Coral Reef Restoration - Caribbean"',
    time: new Date(Date.now() - 1 * 24 * 60 * 60000), // 1 day ago
    isNew: false,
    type: 'project_creation'
  },
  {
    id: '5',
    userName: 'Aisha Patel',
    userImage: 'https://randomuser.me/api/portraits/women/30.jpg',
    message: 'Added new species "Panthera onca" to Amazon monitoring database',
    time: new Date(Date.now() - 2 * 24 * 60 * 60000), // 2 days ago
    isNew: false,
    type: 'species_addition'
  },
  {
    id: '6',
    userName: 'System Notification',
    userImage: null,
    message: 'Conservation Impact Report for Q1 2025 is now available',
    time: new Date(Date.now() - 7 * 24 * 60 * 60000), // 7 days ago
    isNew: false,
    type: 'system'
  }
];

// Individual notification item component
const NotificationItem = ({ notification, onMarkAsRead }) => {
  const { userName, userImage, message, time, isNew, type } = notification;
  
  function getRelativeTime(time) {
    const now = new Date();
    const past = new Date(time);
    const diffInSeconds = Math.floor((now - past) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} days ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths} months ago`;
    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} years ago`;
  }
  
  // Format the time as a relative string (e.g., "10 minutes ago")
  const formattedTime = getRelativeTime(new Date(time));
  
  return (
    <XStack 
      padding="$3" 
      backgroundColor={isNew ? '$blue1' : 'transparent'}
      borderRadius="$2"
      marginBottom="$2"
      position="relative"
    >
      {/* User avatar */}
      <Avatar circular size="$5" marginRight="$3">
        {userImage ? (
          <Avatar.Image src={userImage} />
        ) : (
          <Avatar.Fallback backgroundColor="$blue8">
            <Text color="white" fontSize="$3">
              {userName.charAt(0)}
            </Text>
          </Avatar.Fallback>
        )}
      </Avatar>
      
      {/* Notification content */}
      <YStack flex={1}>
        <Text fontWeight="bold" fontSize="$3" marginBottom="$1">
          {userName}
        </Text>
        <Text fontSize="$2" color="$gray11">
          {message}
        </Text>
        <Text fontSize="$1" color="$gray9" marginTop="$1">
          {formattedTime}
        </Text>
      </YStack>
      
      {/* New indicator and mark as read button */}
      {isNew && (
        <XStack position="absolute" right="$3" top="$3" alignItems="center" space="$2">
          <XStack
            width={8}
            height={8}
            borderRadius={4}
            backgroundColor="$blue9"
          />
          <Button
            size="$2"
            circular
            icon={<Check size={12} />}
            onPress={() => onMarkAsRead(notification.id)}
            backgroundColor="transparent"
            hoverStyle={{ backgroundColor: '$gray3' }}
          />
        </XStack>
      )}
    </XStack>
  );
};

// Main notification panel component as a regular component instead of a modal
const NotificationPanel = ({ onBack }) => {
  const [notifications, setNotifications] = useState(DUMMY_NOTIFICATIONS);
  const [screenHeight, setScreenHeight] = useState(0);
  
  // Get screen height on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateHeight = () => {
        setScreenHeight(window.innerHeight);
      };
      
      updateHeight();
    }
  }, []);
  
  // Mark a single notification as read
  const handleMarkAsRead = (id) => {
    setNotifications(
      notifications.map(notification => 
        notification.id === id 
          ? { ...notification, isNew: false } 
          : notification
      )
    );
  };
  
  // Mark all notifications as read
  const handleMarkAllAsRead = () => {
    setNotifications(
      notifications.map(notification => ({ ...notification, isNew: false }))
    );
  };
  
  const router = useRouter();
  
  // Count of new notifications
  const newNotificationsCount = notifications.filter(n => n.isNew).length;
  
  // Handle back navigation
  const handleBack = () => {
    router.back();
  };
  
  // Calculate the height for the ScrollView
  // Subtracting header height (approx 80px) from total height
  const scrollViewHeight = screenHeight ? screenHeight - 80 : '100%';
  
  return (
    <Card
      width="100%"
      borderRadius="$3"
      borderWidth={1}
      borderColor="$gray4"
      f={1}
      display="flex"
      flexDirection="column"
    >
      {/* Header with back button */}
      <XStack
        justifyContent="space-between"
        alignItems="center"
        padding="$4"
        paddingTop="$8"
        borderBottomWidth={1}
        borderBottomColor="$gray4"
        backgroundColor="white"
      >
        <XStack alignItems="center" justifyContent="space-between" flex={1}>
          <XStack alignItems="center" space="$2">
            <Button
              size="$3"
              circular
              icon={<ArrowLeft size={24} color="black" />}
              onPress={handleBack}
              backgroundColor="transparent"
              hoverStyle={{ backgroundColor: '$gray3' }}
            />
            <Text fontSize="$6" fontWeight="bold" color="black">
              Notifications {newNotificationsCount > 0 && `(${newNotificationsCount})`}
            </Text>
          </XStack>
          
          {newNotificationsCount > 0 && (
            <Button 
              size="$3" 
              onPress={handleMarkAllAsRead}
              backgroundColor="#007A49"
              color="white"
              fontWeight="normal"
            >
              Mark all as read
            </Button>
          )}
        </XStack>
      </XStack>
      
      {/* Notifications list with dynamic height */}
      <ScrollView style={{ height: scrollViewHeight, flex: 1 }}>
        <YStack padding="$3" space="$2">
          {notifications.length > 0 ? (
            notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
              />
            ))
          ) : (
            <YStack alignItems="center" justifyContent="center" height={200}>
              <Text fontSize="$4" color="$gray9">
                No notifications yet
              </Text>
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </Card>
  );
};

export default NotificationPanel;