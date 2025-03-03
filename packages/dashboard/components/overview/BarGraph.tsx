import React, { useState } from 'react';
import { ScrollView, Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText, Line, G } from 'react-native-svg';
import { XStack, YStack, Text, Select } from 'tamagui';

const TreesPlantedChart = () => {
  // Sample data for trees planted per month
  const data = [
    { month: 'Jan', trees: 5100 },
    { month: 'Feb', trees: 4500 },
    { month: 'Mar', trees: 1800 },
    { month: 'Apr', trees: 3400 },
    { month: 'May', trees: 4000 },
    { month: 'Jun', trees: 5300 },
    { month: 'Jul', trees: 4000 },
    { month: 'Aug', trees: 1300 },
    { month: 'Sep', trees: 4000 },
    { month: 'Oct', trees: 1300 },
    { month: 'Nov', trees: 5200 },
    { month: 'Dec', trees: 5100 }
  ];

  // State for data interval dropdown
  const [dataInterval, setDataInterval] = useState('monthly');

  // Chart dimensions
  const CHART_WIDTH = data.length * 50;
  const CHART_HEIGHT = 300;
  const CHART_PADDING = { top: 30, right: 20, bottom: 50, left: 60 };
  const BAR_WIDTH = 30;
  
  // Calculate chart area dimensions
  const graphWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const graphHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

  // Find the maximum value for scaling
  const maxValue = Math.max(...data.map(item => item.trees));
  const roundedMax = Math.ceil(maxValue / 1500) * 1500; // Round to nearest 1500

  // Generate Y-axis ticks
  const yTicks = [];
  const numTicks = 5;
  for (let i = 0; i <= numTicks; i++) {
    yTicks.push(Math.round((i / numTicks) * roundedMax));
  }

  // Calculate bar positions and dimensions
  const barSpacing = graphWidth / data.length;
  const bars = data.map((item, index) => {
    const barHeight = (item.trees / roundedMax) * graphHeight;
    const x = CHART_PADDING.left + (index * barSpacing) + (barSpacing - BAR_WIDTH) / 2;
    const y = CHART_HEIGHT - CHART_PADDING.bottom - barHeight;
    
    return {
      x,
      y,
      width: BAR_WIDTH,
      height: barHeight,
      label: item.month,
      value: item.trees
    };
  });

  return (
    <YStack space="$4" width="100%">
      <XStack justifyContent="space-between" alignItems="center">
        <Text fontSize={20} fontWeight="bold">Overview of Trees Planted</Text>
        {/* <Select
          id="data-interval"
          value={dataInterval}
          onValueChange={setDataInterval}
        >
          <Select.Trigger borderWidth={1} borderColor="$gray5">
            <Select.Value placeholder="Data Interval" />
          </Select.Trigger>
          
          <Select.Content>
            <Select.Item index={0} value="daily">
              <Select.ItemText>Daily</Select.ItemText>
            </Select.Item>
            <Select.Item index={1} value="weekly">
              <Select.ItemText>Weekly</Select.ItemText>
            </Select.Item>
            <Select.Item index={2} value="monthly">
              <Select.ItemText>Monthly</Select.ItemText>
            </Select.Item>
            <Select.Item index={3} value="yearly">
              <Select.ItemText>Yearly</Select.ItemText>
            </Select.Item>
          </Select.Content>
        </Select> */}
      </XStack>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          {/* Y-axis line */}
          <Line
            x1={CHART_PADDING.left}
            y1={CHART_PADDING.top}
            x2={CHART_PADDING.left}
            y2={CHART_HEIGHT - CHART_PADDING.bottom}
            stroke="#EAEAEA"
            strokeWidth="1"
          />
          
          {/* X-axis line */}
          <Line
            x1={CHART_PADDING.left}
            y1={CHART_HEIGHT - CHART_PADDING.bottom}
            x2={CHART_WIDTH - CHART_PADDING.right}
            y2={CHART_HEIGHT - CHART_PADDING.bottom}
            stroke="#EAEAEA"
            strokeWidth="1"
          />
          
          {/* Y-axis grid lines and labels */}
          {yTicks.map((tick, index) => {
            const y = CHART_HEIGHT - CHART_PADDING.bottom - (index / numTicks) * graphHeight;
            return (
              <G key={`y-tick-${index}`}>
                <Line
                  x1={CHART_PADDING.left}
                  y1={y}
                  x2={CHART_WIDTH - CHART_PADDING.right}
                  y2={y}
                  stroke="#EAEAEA"
                  strokeWidth="1"
                />
                <SvgText
                  x={CHART_PADDING.left - 10}
                  y={y + 5}
                  textAnchor="end"
                  fontSize="12"
                  fill="#666"
                >
                  {tick}
                </SvgText>
              </G>
            );
          })}
          
          {/* Bars */}
          {bars.map((bar, index) => (
            <G key={`bar-${index}`}>
              <Rect
                x={bar.x}
                y={bar.y}
                width={bar.width}
                height={bar.height}
                fill="#3F612D"
                rx={2}
              />
              
              {/* X-axis labels */}
              <SvgText
                x={bar.x + bar.width / 2}
                y={CHART_HEIGHT - CHART_PADDING.bottom + 20}
                textAnchor="middle"
                fontSize="12"
                fill="#333"
              >
                {bar.label}
              </SvgText>
            </G>
          ))}
        </Svg>
      </ScrollView>
    </YStack>
  );
};

export default TreesPlantedChart;