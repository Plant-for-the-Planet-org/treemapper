import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Colors, Typography } from '_styles';

export default function LogsTabBar({ tabRoutes, layout, setRouteIndex, navigationState }) {
  return (
    <View style={[{ width: layout.width }]}>
      <View style={styles.tabMainContainer}>
        {tabRoutes &&
          tabRoutes.map((route, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.tabItemContainer, { width: layout.width / 2 }]}
              onPress={() => setRouteIndex(index)}>
              <Text
                style={[
                  styles.tabTitle,
                  navigationState.index === index ? { color: Colors.PRIMARY } : {},
                ]}>
                {route.title}
              </Text>
              {navigationState.index === index && <View style={styles.activeBar} />}
            </TouchableOpacity>
          ))}
      </View>
      <View style={[styles.bottomLine, { width: layout.width }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  tabMainContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  tabItemContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  tabTitle: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_16,
    color: Colors.TEXT_COLOR,
  },
  activeBar: {
    height: 5,
    width: 60,
    borderRadius: 10,
    backgroundColor: Colors.PRIMARY,
    position: 'absolute',
    bottom: 0,
  },
  bottomLine: {
    height: 1,
    backgroundColor: Colors.LIGHT_BORDER_COLOR,
    position: 'absolute',
    bottom: 2,
  },
});
