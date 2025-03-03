import React from 'react';
import { Bell } from '@tamagui/lucide-icons';
import { XStack, YStack, Text, Stack } from 'tamagui';

/**
 * Enhanced NotificationIcon component with customizable badge
 * 
 * @param {Object} props Component props
 * @param {number} props.count Number of notifications to display in the badge
 * @param {string} props.color Icon color (defaults to black)
 * @param {number} props.size Icon size (defaults to 24)
 * @param {Function} props.onPress Function to call when notification icon is pressed
 * @param {number} props.maxCount Maximum count to display before showing "+" (defaults to 99)
 * @param {string} props.badgeColor Background color of the badge (defaults to red)
 * @param {string} props.badgeTextColor Text color of the badge (defaults to white)
 * @param {string} props.badgePosition Position of the badge: 'top-right', 'top-left', 'bottom-right', 'bottom-left' (defaults to 'top-right')
 * @param {Object} props.badgeStyle Additional styles for the badge
 * @param {React.ReactNode} props.icon Custom icon component (defaults to Bell icon)
 */
const NotificationIcon = ({
  count = 0,
  color = 'black',
  size = 24,
  onPress,
  maxCount = 99,
  badgeColor = '#007A49',
  badgeTextColor = 'white',
  badgePosition = 'top-right',
  badgeStyle,
  icon,
  ...props
}) => {
  // Only show badge if count is greater than 0
  const showBadge = count > 0;
  
  // Format the count for display
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();
  
  // Calculate badge size based on icon size
  const badgeSize = Math.max(size * 0.5, 16);
  
  // Calculate text size based on badge size
  const textSize = badgeSize * 0.6;
  
  // Determine badge position based on badgePosition prop
  const getBadgePosition = () => {
    switch (badgePosition) {
      case 'top-left':
        return { top: -badgeSize / 3, left: -badgeSize / 3 };
      case 'bottom-right':
        return { bottom: -badgeSize / 3, right: -badgeSize / 3 };
      case 'bottom-left':
        return { bottom: -badgeSize / 3, left: -badgeSize / 3 };
      case 'top-right':
      default:
        return { top: -badgeSize / 3, right: -badgeSize / 3 };
    }
  };
  
  // Get the icon to display
  const IconComponent = icon || <Bell size={size} color={color} />;
  
  return (
    <XStack onPress={onPress} {...props} width="$2" style={{position: 'absolute', right:25, top:54}}>
      {typeof IconComponent === 'function' 
        ? <IconComponent size={size} color={color} />
        : IconComponent}
      
      {showBadge && (
        <Stack
          position="absolute"
          width={badgeSize}
          height={badgeSize}
          borderRadius={badgeSize / 2}
          backgroundColor={badgeColor}
          alignItems="center"
          justifyContent="center"
          {...getBadgePosition()}
          {...badgeStyle}
        >
          <Text
            color={badgeTextColor}
            fontSize={textSize}
            fontWeight="bold"
            lineHeight={textSize}
            textAlign="center"
          >
            {displayCount}
          </Text>
        </Stack>
      )}
    </XStack>
  );
};

export default NotificationIcon;