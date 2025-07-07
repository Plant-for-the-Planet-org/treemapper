import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface TabData {
  id: string | number;
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  [key: string]: any; // Allow additional properties
}

interface HorizontalTabsProps {
  tabs: TabData[];
  onTabChange: (tabData: TabData, index: number) => void;
  style?: ViewStyle;
  initialSelectedIndex?: number;
}

const HorizontalTabs: React.FC<HorizontalTabsProps> = ({
  tabs,
  onTabChange,
  style,
  initialSelectedIndex = 0,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(initialSelectedIndex);
  const [animatedValues] = useState(
    tabs.map(() => new Animated.Value(0))
  );

  useEffect(() => {
    // Animate all tabs
    tabs.forEach((_, index) => {
      Animated.timing(animatedValues[index], {
        toValue: selectedIndex === index ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    });
  }, [selectedIndex]);

  const handleTabPress = (tabData: TabData, index: number) => {
    setSelectedIndex(index);
    onTabChange(tabData, index);
  };

  const getTabStyle = (index: number) => {
    const animatedValue = animatedValues[index];

    return {
      backgroundColor: animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['#FFFFFF', '#007A49'],
      }),
    };
  };

  const getTextStyle = (index: number) => {
    const animatedValue = animatedValues[index];

    return {
      color: animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['#666666', '#FFFFFF'],
      }),
    };
  };

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => handleTabPress(tab, index)}
            activeOpacity={0.7}
            style={styles.tabButton}
          >
            <Animated.View style={[styles.tabContainer, getTabStyle(index)]}>
              <View style={styles.tabContent}>
                {/* {tab.icon && (
                  <Animated.View style={styles.iconContainer}>
                    <Ionicons
                      name={tab.icon}
                      size={18}
                      color={selectedIndex === index ? '#FFFFFF' : '#666666'}
                    />
                  </Animated.View>
                )} */}
                <Animated.Text style={[styles.tabText, getTextStyle(index)]}>
                  {tab.title}
                </Animated.Text>
              </View>
            </Animated.View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 50,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 5,
    alignItems: 'center',
  },
  tabButton: {
    marginHorizontal: 5,
  },
  tabContainer: {
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default HorizontalTabs;