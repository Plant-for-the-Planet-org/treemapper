import {
  Text,
  View,
  Platform,
  Animated,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import i18next from 'i18next';
import * as shape from 'd3-shape';
import React, { useEffect, useState } from 'react';
import Svg, { Path, SvgXml } from 'react-native-svg';

import {
  add_icon,
  ListIcon,
  PlotIcon,
  MapExplore,
  singleTreeIcon,
  multipleTreesIcon,
  SingleTreeIcon,
  MultipleTreeIcon,
  Intervention,
  ChartIcon,
  CrossArrow,
} from '../../assets';
import { GradientText } from '../Common';
import { Colors, Typography } from '../../styles';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const IS_ANDROID = Platform.OS === 'android';

let { width, height } = Dimensions.get('window');
const buttonWidth = 64;
const buttonGutter = 10;
const extraHeight = IS_ANDROID ? 0 : 20;
const tabbarHeight = 60 + extraHeight;

const tabWidth = buttonWidth + buttonGutter * 2;
width = (width - tabWidth) / 2;
const curveHeight = tabbarHeight - (22 + extraHeight);

const getPath = (): string => {
  const left = shape
    .line()
    .x(d => d[0])
    .y(d => d[1])([
    [0, 0],
    [width * 1.9 + 5, 0],
  ]);

  const tab = shape
    .line()
    .x(d => d[0])
    .y(d => d[1])
    .curve(shape.curveBasis)([
    [width * 1.9 + 5, 0],
    [width * 1.9 + 5, 0],
    [width * 1.9 + 5, 5],
    [width * 1.9 + 7, curveHeight / 2],
    [width * 1.9 + tabWidth / 2 - 16, curveHeight],
    [width * 1.9 + tabWidth / 2 + 16, curveHeight],
    [width * 1.9 + tabWidth - 7, curveHeight / 2],
    [width * 1.9 + tabWidth - 5, 0],
    [width * 1.9 + tabWidth - 5, 0],
    [width * 1.9 + 5 + tabWidth - 5, 0],
  ]);

  const right = shape
    .line()
    .x(d => d[0])
    .y(d => d[1])([
    [width * 2 + tabWidth - 15, 0],
    [width * 2 + tabWidth, 0],
    [width * 2 + tabWidth, tabbarHeight],
    [0, tabbarHeight],
    [0, 0],
  ]);
  return `${left} ${tab} ${right}`;
};

const d = getPath();

const AddOptions = ({ onReqClose, navigation }: any) => {
  const addOptions = [
    {
      svgIcon: <ChartIcon />,
      title: 'Monitoring Plot',
      coming_soon: true,
      onPress: () => navigation.navigate('Interventions'),
    },
    {
      svgIcon: <CrossArrow />,
      title: 'Project Site',
      coming_soon: true,
      onPress: () => navigation.navigate('Interventions'),
    },
    {
      svgIcon: <Intervention />,
      title: 'Intervention',
      coming_soon: true,
      onPress: () => navigation.navigate('Interventions'),
    },
    {
      svgIcon: <SingleTreeIcon />,
      title: 'label.tree_registration_type_1',
      coming_soon: false,
      onPress: () => navigation.navigate('RegisterSingleTree'),
    },
    {
      svgIcon: <MultipleTreeIcon />,
      title: 'label.tree_registration_type_2',
      coming_soon: false,
      onPress: () => navigation.navigate('LocateTree'),
    },
  ];

  return (
    <TouchableOpacity activeOpacity={1} onPress={onReqClose} style={styles.addOptionsParent}>
      <View style={[styles.addOptionsContainer, styles.boxShadow]}>
        {addOptions.length > 0
          ? addOptions.map((option: any, index: number) => (
              <View key={`addOption${index}`} style={styles.addButtonOptionWrap}>
                <TouchableOpacity onPress={option.onPress} style={styles.addButtonOption}>
                  <View style={styles.icon}>{option.svgIcon}</View>
                  <View>
                    <Text style={styles.text}>{i18next.t(option.title)}</Text>
                    {option.coming_soon && (
                      <GradientText style={styles.coming_soon}>Coming Soon</GradientText>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            ))
          : []}
      </View>
    </TouchableOpacity>
  );
};

interface IBottomBarProps {
  onMenuPress: any;
  onTreeInventoryPress: any;
  numberOfInventory: number;
  state: BottomTabBarProps;
  descriptors: BottomTabBarProps;
  navigation: BottomTabBarProps;
}

const BottomBar = ({
  onMenuPress,
  onTreeInventoryPress,
  numberOfInventory,
  state,
  descriptors,
  navigation,
}: IBottomBarProps) => {
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [spinValue] = useState(new Animated.Value(0));

  useEffect(() => {
    return () => setShowAddOptions(false);
  }, []);

  // Next, interpolate beginning and end values (in this case 0 and 1)
  // if Clockwise icon will rotate clockwise, else anti-clockwise
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '225deg'],
  });

  const animatedScaleStyle = {
    transform: [{ rotate: spin }],
  };

  const onAddPress = () => {
    setShowAddOptions(!showAddOptions);
    Animated.spring(
      spinValue, // The animated value to drive
      {
        toValue: showAddOptions ? 0 : 1,
        useNativeDriver: true,
      },
    ).start();
  };

  return (
    <>
      <View style={styles.bottomBarContainer}>
        <Svg
          width={width * 2 + tabWidth}
          height={tabbarHeight}
          style={styles.bottomBar}
          strokeWidth="1"
          stroke={Colors.GRAY_LIGHT}>
          <Path {...{ d }} fill={Colors.WHITE} />
        </Svg>
        {/* add button */}
        <TouchableOpacity style={styles.addButton} onPress={() => onAddPress()}>
          <Animated.View style={animatedScaleStyle}>
            <SvgXml xml={add_icon} style={styles.addIcon} />
          </Animated.View>
        </TouchableOpacity>

        {/* menu button */}
        {/* <TouchableOpacity style={[styles.left, styles.tabButton]} onPress={onMenuPress}>
          <>
            <View style={[styles.menuDash, styles.firstDash]} />
            <View style={[styles.menuDash, styles.secondDash]} />
          </>
        </TouchableOpacity> */}

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

            return (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
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
        <View style={styles.tabButton}>
          {showAddOptions ? (
            <GradientText style={styles.tabItemAddText}>Add</GradientText>
          ) : (
            <Text style={styles.tabItemAddText}>Add</Text>
          )}
        </View>
        {/* Tree Inventory button */}
        {/* <TouchableOpacity style={[styles.right, styles.tabButton]} onPress={onTreeInventoryPress}>
          <Text style={styles.tabText}>{i18next.t('label.tree_inventory')}</Text>
          <View style={styles.inventoryCount}>
            <Text style={styles.inventoryCountText}>{numberOfInventory}</Text>
          </View>
        </TouchableOpacity> */}
      </View>
      {showAddOptions ? <AddOptions onReqClose={onAddPress} navigation={navigation} /> : []}
    </>
  );
};

export default BottomBar;

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.WHITE,
  },
  bottomBar: { backgroundColor: 'transparent' },
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
  },
  menuDash: {
    height: 3,
    borderRadius: 10,
    backgroundColor: Colors.TEXT_COLOR,
  },
  tabButton: {
    position: 'absolute',
    width: width / 2.1,
    right: 0,
    justifyContent: 'flex-end',
    height: tabbarHeight,
  },
  firstDash: {
    width: 16,
  },
  secondDash: {
    width: 24,
    marginTop: 6,
  },
  // 44 = height of menu container + 2 * padding
  left: {
    left: 16,
    bottom: (tabbarHeight - 44) / 2,
    padding: 16,
  },
  // 38 = height of text + 2 * padding
  right: {
    right: 16,
    bottom: (tabbarHeight - 38) / 2,
    padding: 10,
    borderRadius: 8,
    position: 'relative',
  },
  tabText: {
    fontSize: Typography.FONT_SIZE_14,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
  },
  addButton: {
    position: 'absolute',
    bottom: tabbarHeight - buttonWidth / 2,
    width: buttonWidth,
    height: buttonWidth,
    borderRadius: 60,
    backgroundColor: Colors.WHITE,
    left: width * 1.9 + buttonGutter,
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addOptionsParent: {
    position: 'absolute',
    left: 0,
    right: 25,
    bottom: 0,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    height,
  },
  addOptionsContainer: {
    width: 229,
    borderRadius: 12,
    marginBottom: 130,
    backgroundColor: Colors.WHITE,
    justifyContent: 'center',
    alignItems: 'flex-start',
    elevation: 4,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  addButtonOptionWrap: {
    borderRadius: 8,
  },
  addButtonOption: {
    marginVertical: 10,
    backgroundColor: Colors.PRIMARY + '1A',
    flexDirection: 'row',
    alignItems: 'center',
    width: 193,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingLeft: 6,
    borderColor: Colors.PRIMARY + '1A',
  },
  icon: { height: 36, width: 36, marginRight: 6 },
  text: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_16,
    color: Colors.TEXT_COLOR,
  },
  coming_soon: {
    fontSize: Typography.FONT_SIZE_8,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
  },
  addIcon: {
    width: 48,
    height: 48,
  },
  tabItemContainer: {
    position: 'absolute',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: IS_ANDROID ? 0 : 6,
    flexDirection: 'row',
    width: width * 2,
    height: tabbarHeight,
  },
  tabItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabItemText: {
    marginTop: 7,
    color: Colors.TEXT_LIGHT,
    fontSize: Typography.FONT_SIZE_12,
    fontWeight: Typography.FONT_WEIGHT_BOLD,
  },
  tabItemAddText: {
    marginBottom: 17,
    color: Colors.TEXT_LIGHT,
    fontSize: Typography.FONT_SIZE_12,
    fontWeight: Typography.FONT_WEIGHT_BOLD,
  },
});
