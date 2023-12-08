import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useRef, useState } from 'react';
import { SvgXml } from 'react-native-svg';
import { add_icon, ListIcon, PlotIcon, MapExplore } from '../../assets';
import { GradientText } from '../Common';
import { Colors, Spacing, Typography } from '../../styles';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, { useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';
import AddOptionsModal from './AddOptionsModal';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface IBottomBarProps {
  state: BottomTabBarProps;
  descriptors: BottomTabBarProps;
  navigation: BottomTabBarProps;
}

const BottomBar = ({ state, descriptors, navigation }: IBottomBarProps) => {
  const [open, setOpen] = useState(false);

  const rotation = useDerivedValue(() => {
    return withTiming(open ? '135deg' : '0deg');
  }, [open]);

  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: rotation.value }],
  }));

  const _addOptionsRef = useRef();

  const onAddPress = () => {
    setOpen(prev => !prev);
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.tabItemContainer}>
          {state?.routes?.map((route, index) => {
            const { options } = descriptors[route.key];
            const label =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                ? options.title
                : route.name;

            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                // The `merge: true` option makes sure that the params inside the tab screen are preserved
                navigation.navigate({ name: route.name, merge: true });
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            if (label == 'Add') {
              return (
                <TouchableOpacity
                  accessibilityRole="button"
                  activeOpacity={1}
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={options.tabBarAccessibilityLabel}
                  testID={options.tabBarTestID}
                  key={index}
                  onLongPress={onLongPress}
                  style={[styles.tabItem]}
                  onPress={() => onAddPress()}>
                  <AnimatedTouchableOpacity
                    style={[styles.animatedTouch, rotationStyle]}
                    onPress={() => onAddPress()}>
                    <SvgXml xml={add_icon} style={styles.addIcon} />
                  </AnimatedTouchableOpacity>
                  {state?.index === index ? (
                    <GradientText style={styles.tabItemText}>{label}</GradientText>
                  ) : (
                    <Text style={styles.tabItemText}>{label}</Text>
                  )}
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                key={index}
                onLongPress={onLongPress}
                style={styles.tabItem}
                onPress={onPress}>
                {index === 0 && <MapExplore color={state?.index === index} />}
                {index === 1 && <ListIcon color={state?.index === index} />}
                {index === 2 && <PlotIcon color={state?.index === index} />}
                {state?.index === index ? (
                  <GradientText style={styles.tabItemText}>{label}</GradientText>
                ) : (
                  <Text style={styles.tabItemText}>{label}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <AddOptionsModal
        setVisible={setOpen}
        visible={open}
        ref={_addOptionsRef}
        navigation={navigation}
      />
    </>
  );
};

export default BottomBar;

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    elevation: 4,
    borderTopLeftRadius: Spacing.SCALE_12,
    borderTopRightRadius: Spacing.SCALE_12,
  },
  animatedTouch: {
    backgroundColor: 'white',
    borderRadius: 100,
    padding: Spacing.SCALE_12,
    position: 'absolute',
    top: -Spacing.SCALE_36,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4.62,
    elevation: 5,
  },
  addIcon: {
    width: Spacing.SCALE_48,
    height: Spacing.SCALE_48,
  },
  tabItemContainer: {
    justifyContent: 'space-around',
    flexDirection: 'row',
    marginVertical: Spacing.SCALE_16,
  },
  tabItem: {
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  tabItemText: {
    marginTop: Spacing.SCALE_8,
    color: Colors.TEXT_LIGHT,
    fontSize: Typography.FONT_SIZE_14,
    fontWeight: Typography.FONT_WEIGHT_BOLD,
  },
});
