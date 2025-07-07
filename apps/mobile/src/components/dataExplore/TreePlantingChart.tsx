import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { Dropdown } from 'react-native-element-dropdown';
import { Ionicons } from '@expo/vector-icons';

interface ChartDataItem {
  name: string;
  trees: number;
  fullDate: string;
}

interface TreePlantingChartProps {
  onIntervalChange?: (interval: string) => void;
  onDataFetch?: (interval: string) => Promise<ChartDataItem[]>;
}

const TreePlantingChart: React.FC<TreePlantingChartProps> = ({
  onIntervalChange,
  onDataFetch,
}) => {
  const [interval, setInterval] = useState('days');
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 32; // 16px padding on each side

  // Dropdown data
  const intervalOptions = [
    { label: 'Days', value: 'days' },
    { label: 'Weeks', value: 'weeks' },
    { label: 'Months', value: 'months' },
  ];

  // Dummy data for demonstration
  const generateDummyData = (intervalType: string): ChartDataItem[] => {
    const data = [];
    const now = new Date();
    
    switch (intervalType) {
      case 'days':
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          data.push({
            name: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            trees: Math.floor(Math.random() * 100) + 20,
            fullDate: date.toISOString(),
          });
        }
        break;
      case 'weeks':
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - (i * 7));
          data.push({
            name: `Week ${getWeekNumber(date)}`,
            trees: Math.floor(Math.random() * 300) + 100,
            fullDate: date.toISOString(),
          });
        }
        break;
      case 'months':
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now);
          date.setMonth(date.getMonth() - i);
          data.push({
            name: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            trees: Math.floor(Math.random() * 800) + 200,
            fullDate: date.toISOString(),
          });
        }
        break;
    }
    return data;
  };

  const getWeekNumber = (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const handleFetch = async () => {
    try {
      setLoading(true);
      setError(null);

      let data: ChartDataItem[];
      if (onDataFetch) {
        data = await onDataFetch(interval);
      } else {
        // Simulate API call with dummy data
        await new Promise(resolve => setTimeout(resolve, 1000));
        data = generateDummyData(interval);
      }

      setChartData(data);
    } catch (err) {
      console.error('Error fetching chart data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chart data');
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetch();
  }, [interval]);

  const handleIntervalChange = (newInterval: string) => {
    setInterval(newInterval);
    if (onIntervalChange) {
      onIntervalChange(newInterval);
    }
  };

  const calculateTotal = (): number => {
    return chartData.reduce((sum, item) => sum + item.trees, 0);
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const prepareChartData = () => {
    if (chartData.length === 0) return null;

    const labels = chartData.map(item => {
      // Truncate long labels for better display
      return item.name.length > 8 ? item.name.substring(0, 8) + '..' : item.name;
    });
    
    const datasets = [{
      data: chartData.map(item => item.trees),
    }];

    return { labels, datasets };
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 122, 73, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    barPercentage: Math.min(0.8, Math.max(0.3, 1 / chartData.length * 2)),
    propsForBackgroundLines: {
      strokeDasharray: '3,3',
      stroke: '#f3f4f6',
      strokeWidth: 1,
    },
    propsForLabels: {
      fontSize: 10,
    },
  };

  const handleRetry = () => {
    Alert.alert(
      'Retry',
      'Do you want to retry loading the chart data?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Retry', onPress: handleFetch },
      ]
    );
  };

  const renderLoader = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color="#007A49" />
      <Text style={styles.loadingText}>Loading chart data...</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.centerContainer}>
      <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
      <Text style={styles.errorTitle}>Failed to load data</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.centerContainer}>
      <Ionicons name="bar-chart-outline" size={48} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>No Data Available</Text>
      <Text style={styles.emptyMessage}>No tree planting data available for this period</Text>
    </View>
  );

  const renderChart = () => {
    const data = prepareChartData();
    if (!data) return renderEmptyState();

    return (
      <View style={styles.chartContainer}>
        <BarChart
          data={data}
          width={chartWidth}
          height={300}
          chartConfig={chartConfig}
          showValuesOnTopOfBars={false}
          showBarTops={false}
          withInnerLines={true}
          withHorizontalLabels={true}
          withVerticalLabels={true}
          style={styles.chart}
          yAxisSuffix=""
          fromZero={true}
        />
        
        {/* Custom tooltip-like info */}
        <View style={styles.tooltipContainer}>
          <Text style={styles.tooltipText}>
            Tap on bars to see details • Total: {formatNumber(calculateTotal())} trees
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Overview of Trees Planted</Text>
          {!loading && !error && chartData.length > 0 && (
            <Text style={styles.subtitle}>
              Total: {formatNumber(calculateTotal())} trees
            </Text>
          )}
        </View>
        
        <View style={styles.dropdownContainer}>
          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.dropdownPlaceholder}
            selectedTextStyle={styles.dropdownSelectedText}
            inputSearchStyle={styles.dropdownInputSearch}
            iconStyle={styles.dropdownIcon}
            data={intervalOptions}
            search={false}
            maxHeight={200}
            labelField="label"
            valueField="value"
            placeholder="Select interval"
            value={interval}
            onChange={(item) => handleIntervalChange(item.value)}
            renderRightIcon={() => (
              <Ionicons name="chevron-down" size={16} color="#6B7280" />
            )}
            disable={loading}
          />
        </View>
      </View>

      {/* Chart Content */}
      <View style={styles.content}>
        {loading ? renderLoader() : error ? renderError() : renderChart()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width:'98%',
    marginLeft:'1%',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  dropdownContainer: {
    width: 120,
  },
  dropdown: {
    height: 40,
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  dropdownPlaceholder: {
    fontSize: 14,
    color: '#6B7280',
  },
  dropdownSelectedText: {
    fontSize: 14,
    color: '#1F2937',
  },
  dropdownInputSearch: {
    height: 40,
    fontSize: 14,
  },
  dropdownIcon: {
    width: 16,
    height: 16,
  },
  content: {
    height: 350,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#007A49',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  chartContainer: {
    flex: 1,
    alignItems: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  tooltipContainer: {
    marginTop: 12,
    paddingHorizontal: 16,
  },
  tooltipText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default TreePlantingChart;