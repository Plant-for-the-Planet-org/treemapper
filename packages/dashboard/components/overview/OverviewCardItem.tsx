import React from 'react';
import { Card, Text, XStack, YStack } from 'tamagui';
import { Trees } from '@tamagui/lucide-icons'; // Import the tree icon or your preferred icon

export const OverviewCardItem = ({
  title = "Trees Planted",
  value = "990.4k",
  changePercentage = "+20.1% from last month",
  iconColor = "#6E6E6E",
  customIcon = null,
  backgroundColor = "white",
  borderRadius = 24,
  padding = 24,
  titleSize = "$2", // Adjust sizes according to your theme
  valueSize = "$8",
  changePercentageSize = "$2",
  titleColor = "black",
  valueColor = "black",
  changePercentageColor = "#6E6E6E"
}) => {
  return (
    <Card
      bordered
      animation="bouncy"
      width="100%"
      height="auto"
      scale={0.9}
      hoverStyle={{ scale: 0.925 }}
      pressStyle={{ scale: 0.875 }}
      borderRadius={borderRadius}
      backgroundColor={backgroundColor}
      padding={padding}
      shadowColor="rgba(0, 0, 0, 0.1)"
      shadowRadius={10}
      shadowOffset={{ width: 2, height: 4 }}
    >
      <XStack justifyContent="space-between" alignItems="center">
        <YStack space="$2">
          <Text
            fontSize={titleSize}
            fontWeight="bold"
            color={titleColor}
          >
            {title}
          </Text>

          <Text
            fontSize={valueSize}
            fontWeight="bold"
            color={valueColor}
          >
            {value}
          </Text>

          <Text
            fontSize={changePercentageSize}
            color={changePercentageColor}
          >
            {changePercentage}
          </Text>
        </YStack>

        {customIcon || <Trees size={32} color={iconColor} />}
      </XStack>
    </Card>
  );
};