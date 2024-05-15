import React from 'react';
import { View, Text, StyleSheet , TouchableOpacity} from 'react-native';
import { Colors, Typography } from 'src/utils/constants';

interface ICustomTabBarProps {
  tabRoutes: any;
  layout: any;
  setRouteIndex: any;
  navigationState: any;
}

export default function AdditionalFormTabBar({
  tabRoutes,
  layout,
  setRouteIndex,
  navigationState,
}: ICustomTabBarProps) {
  return (
    <View style={[{ width: layout.width }]}>
      <View style={styles.tabMainContainer}>
        {tabRoutes &&
          tabRoutes.map((route: any, index: number) => (
            <TouchableOpacity
              key={index}
              style={[styles.tabItemContainer, { width: layout.width / 2 }]}
              onPress={() => setRouteIndex(index)}>
              <Text
                style={[
                  styles.tabTitle,
                  navigationState.index === index ? { color: Colors.NEW_PRIMARY } : {},
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
    backgroundColor:Colors.WHITE,
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
    backgroundColor: Colors.NEW_PRIMARY,
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
