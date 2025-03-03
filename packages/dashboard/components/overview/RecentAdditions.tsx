import React from 'react';
import { 
  Card, 
  XStack, 
  YStack, 
  Text, 
  Avatar, 
  View, 
  Button,
} from 'tamagui';
import { 
  Trees, 
  Droplets, 
  Leaf, 
  BarChart2, 
  Wind 
} from '@tamagui/lucide-icons';

// Metrics data for random icons
const metrics = [
  {
    id: '1',
    title: 'Trees Planted',
    value: '990.4k',
    changePercentage: '+20.1% from last month',
    icon: 'tree',
    backgroundColor: 'white',
  },
  {
    id: '2',
    title: 'Water Saved',
    value: '1.2M',
    changePercentage: '+5.3% from last month',
    icon: 'droplets',
    backgroundColor: 'white',
  },
  {
    id: '3',
    title: 'Carbon Offset',
    value: '840.6T',
    changePercentage: '+15.7% from last month',
    icon: 'leaf',
    backgroundColor: 'white',
  },
  {
    id: '4',
    title: 'Energy Saved',
    value: '320.8k',
    changePercentage: '+8.2% from last month',
    icon: 'barChart2',
    backgroundColor: 'white',
  }
];

// Function to render the appropriate icon based on the icon name
const renderIcon = (iconName) => {
  switch (iconName) {
    case 'tree':
      return <Trees size={20} color="#6E6E6E" />;
    case 'droplets':
      return <Droplets size={20} color="#6E6E6E" />;
    case 'leaf':
      return <Leaf size={20} color="#6E6E6E" />;
    case 'barChart2':
      return <BarChart2 size={20} color="#6E6E6E" />;
    case 'wind':
      return <Wind size={20} color="#6E6E6E" />;
    default:
      return <Trees size={20} color="#6E6E6E" />;
  }
};

// Function to get random icon from metrics
const getRandomIcon = () => {
  const randomIndex = Math.floor(Math.random() * metrics.length);
  return metrics[randomIndex].icon;
};

// Custom component for user item row
const UserItem = ({ name, subtitle, value, useTrash = false, userId }) => {
  // Get random icon
  const randomIconName = getRandomIcon();
  
  return (
    <XStack space="$4" alignItems="center" paddingVertical="$3">
      <Avatar circular size="$6">
        <Avatar.Image 
          src={`https://avatar.iran.liara.run/public/${userId}`} 
          accessibilityLabel={`${name}'s profile`} 
        />
        <Avatar.Fallback backgroundColor="$gray5" />
      </Avatar>
      
      <YStack flex={1}>
        <Text fontWeight="bold" fontSize="$5" color="$gray12">{name}</Text>
        <Text fontSize="$3" color="$gray10">{subtitle}</Text>
      </YStack>
      
      <XStack space="$2" alignItems="center">
        <Text fontWeight="bold" fontSize="$6" color="$gray12">{value}</Text>
        {useTrash && renderIcon(randomIconName)}
      </XStack>
    </XStack>
  );
};

const RecentAdditions = () => {
  return (
    <Card 
      elevate 
      bordered 
      animation="bouncy" 
      width="100%" 
      padding="$4"
      borderRadius="$4"
    >
      <YStack >
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontWeight="bold" fontSize="$8" color="$gray12">Recent Additions</Text>
          <Button size="$3" chromeless style={{ right: -10 }}>
            <Text color="$gray10" fontWeight="normal">View All</Text>
          </Button>
        </XStack>
        
        {/* Subtitle */}
        <Text color="$gray9" fontSize="$4" marginBottom="$2">
          You added 72 interventions this month.
        </Text>
        
        {/* Divider */}
        <View height={1} backgroundColor="$gray5" marginVertical="$2" />
        
        {/* User List */}
        <YStack >
          <UserItem 
            name="Olivia Martin" 
            subtitle="Jan 9, 2024" 
            value="4,100" 
            userId="1"
          />
          
          <UserItem 
            name="Jackson Lee" 
            subtitle="Jan 9, 2024" 
            value="12 ha" 
            useTrash={true}
            userId="2"
          />
          
          <UserItem 
            name="Isabella Nguyen" 
            subtitle="Jan 6, 2024" 
            value="7,100" 
            userId="3"
          />
          
          <UserItem 
            name="William Kim" 
            subtitle="will@email.com" 
            value="1,200" 
            userId="4"
          />
          
          <UserItem 
            name="Sofia Davis" 
            subtitle="sofia.davis@email.com" 
            value="5 ha" 
            useTrash={true}
            userId="5"
          />
        </YStack>
      </YStack>
    </Card>
  );
};

export default RecentAdditions;