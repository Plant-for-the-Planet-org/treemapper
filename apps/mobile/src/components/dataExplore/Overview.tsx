import { ScrollView, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import StatCardsContainer from './StatCardsContainer'
import TreePlantingChart from './TreePlantingChart';
import RecentAdditionsComponent from './RecentAdditionsComponent';



interface ChartDataItem {
    name: string;
    trees: number;
    fullDate: string;
}

const Overview = () => {
    const handleDataFetch = async (interval: string): Promise<ChartDataItem[]> => {
        try {
            // Replace this with your actual API call
            // const response = await getOverviewGraph(accessToken, selectedProject?.uid, interval);

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Mock data that matches your API response format
            const mockApiResponse = {
                statusCode: 200,
                data: {
                    interval: interval,
                    data: [
                        { date: '2024-01-01', value: 45 },
                        { date: '2024-01-02', value: 32 },
                        { date: '2024-01-03', value: 78 },
                        { date: '2024-01-04', value: 56 },
                        { date: '2024-01-05', value: 89 },
                        { date: '2024-01-06', value: 23 },
                        { date: '2024-01-07', value: 67 },
                    ]
                }
            };

            if (mockApiResponse.statusCode === 200) {
                const formattedData = mockApiResponse.data.data.map(item => ({
                    name: formatDateForDisplay(item.date, mockApiResponse.data.interval),
                    trees: item.value,
                    fullDate: item.date
                }));

                return formattedData;
            } else {
                throw new Error('Failed to fetch data');
            }
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    };

    const formatDateForDisplay = (dateString: string, intervalType: string): string => {
        const date = new Date(dateString);

        switch (intervalType) {
            case 'days':
                return date.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                });
            case 'weeks':
                const weekNumber = getWeekNumber(date);
                return `Week ${weekNumber}`;
            case 'months':
                return date.toLocaleDateString('en-US', {
                    month: 'short',
                });
            default:
                return date.toLocaleDateString();
        }
    };

    const getWeekNumber = (date: Date): number => {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    };

    const handleIntervalChange = (interval: string) => {
        // You can add additional logic here if needed
    };
    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <StatCardsContainer style={styles.statsContainer} />
                <TreePlantingChart
                    onDataFetch={handleDataFetch}
                    onIntervalChange={handleIntervalChange}
                />
                <RecentAdditionsComponent/>
                <View style={styles.footer} />

            </ScrollView>
        </View>
    )
}

export default Overview

const styles = StyleSheet.create({
    container: {
        flex:1,
    },
    statsContainer: {
        marginVertical: 8,
        paddingTop: 10,
        marginBottom:10,
    },
    scrollView: {
    },
    footer: {
        height: 200,
        width: '100%',
    }
})