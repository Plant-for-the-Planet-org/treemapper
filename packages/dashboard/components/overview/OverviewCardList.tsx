import React from 'react';
import { ScrollView } from 'react-native';
import { XStack, YStack, H2, Spacer } from 'tamagui';
import { Droplets, Wind, Leaf, BarChart2, Trees } from '@tamagui/lucide-icons'; // Import additional icons
import { OverviewCardItem } from './OverviewCardItem';

export const OverviewCardList = ({
    title = "Environmental Impact",
    metrics = [
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
    ]
}) => {
    // Function to render the appropriate icon based on the icon name
    const renderIcon = (iconName) => {
        switch (iconName) {
            case 'tree':
                return <Trees size={32} color="#6E6E6E" />;
            case 'droplets':
                return <Droplets size={32} color="#6E6E6E" />;
            case 'leaf':
                return <Leaf size={32} color="#6E6E6E" />;
            case 'barChart2':
                return <BarChart2 size={32} color="#6E6E6E" />;
            case 'wind':
                return <Wind size={32} color="#6E6E6E" />;
            default:
                return <Trees size={32} color="#6E6E6E" />;
        }
    };

    return (
        <YStack>
            <ScrollView 
                horizontal
                showsHorizontalScrollIndicator={false}
            >
                <XStack gap="$4" paddingBottom={20}>
                    {metrics.map((metric, index) => (
                        <XStack key={metric.id || index} width={300} height="auto">
                            <OverviewCardItem
                                title={metric.title}
                                value={metric.value}
                                changePercentage={metric.changePercentage}
                                backgroundColor={metric.backgroundColor}
                                customIcon={renderIcon(metric.icon)}
                            />
                        </XStack>
                    ))}
                    <Spacer width="$2" />
                </XStack>
            </ScrollView>
        </YStack>
    );
};