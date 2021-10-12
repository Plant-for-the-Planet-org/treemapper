import React, { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as shape from 'd3-shape';
import Svg, { Path, SvgXml } from 'react-native-svg';
import { Colors, Typography } from '../../styles';
import FA5Icon from 'react-native-vector-icons/FontAwesome5';
import i18next from 'i18next';
import { multipleTreesIcon, singleTreeIcon } from '../../assets';
import { useNavigation } from '@react-navigation/core';

let { width } = Dimensions.get('window');
const buttonWidth = 64;
const buttonGutter = 10;
const tabbarHeight = 60;

const tabWidth = buttonWidth + buttonGutter * 2;
width = (width - tabWidth) / 2;
const curveHeight = tabbarHeight - 22;

const getPath = (): string => {
  const left = shape
    .line()
    .x((d) => d[0])
    .y((d) => d[1])([
    [0, 0],
    [width - 5, 0],
  ]);

  const tab = shape
    .line()
    .x((d) => d[0])
    .y((d) => d[1])
    .curve(shape.curveBasis)([
    [width - 5, 0],
    [width, 0],
    [width + 5, 5],
    [width + 7, curveHeight / 2],
    [width + tabWidth / 2 - 16, curveHeight],
    [width + tabWidth / 2 + 16, curveHeight],
    [width + tabWidth - 7, curveHeight / 2],
    [width + tabWidth - 5, 5],
    [width + tabWidth, 0],
    [width + 5 + tabWidth, 0],
  ]);

  const right = shape
    .line()
    .x((d) => d[0])
    .y((d) => d[1])([
    [width + 5 + tabWidth, 0],
    [width * 2 + tabWidth, 0],
    [width * 2 + tabWidth, tabbarHeight],
    [0, tabbarHeight],
    [0, 0],
  ]);
  return `${left} ${tab} ${right}`;
};

const d = getPath();

const AddOptions = ({ navigation }: any) => {
  const addOptions = [
    {
      svgXML: singleTreeIcon,
      title: 'label.tree_registration_type_1',
      onPress: () => navigation.navigate('RegisterSingleTree'),
    },
    {
      svgXML: multipleTreesIcon,
      title: 'label.tree_registration_type_2',
      onPress: () => navigation.navigate('LocateTree'),
    },
  ];

  return (
    <View style={styles.addOptionsParent}>
      <View style={styles.addOptionsContainer}>
        {addOptions.length > 0
          ? addOptions.map((option: any, index: number) => (
              <TouchableOpacity
                style={[
                  styles.addButtonOption,
                  addOptions.length - 1 !== index ? { marginBottom: 8 } : {},
                ]}
                onPress={option.onPress}
                key={`addOption${index}`}>
                <View style={styles.icon}>
                  <SvgXml xml={option.svgXML} />
                </View>
                <Text style={styles.text}>{i18next.t(option.title)}</Text>
              </TouchableOpacity>
            ))
          : []}
      </View>
    </View>
  );
};

interface IBottomBarProps {
  onMenuPress: any;
  onTreeInventoryPress: any;
  numberOfInventory: number;
}

const BottomBar = ({ onMenuPress, onTreeInventoryPress, numberOfInventory }: IBottomBarProps) => {
  const [showAddOptions, setShowAddOptions] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    return () => setShowAddOptions(false);
  }, []);

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
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddOptions(!showAddOptions)}>
          <FA5Icon name="plus" color={Colors.WHITE} size={32} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.left, styles.tabButton]} onPress={onMenuPress}>
          <>
            <View style={[styles.menuDash, { width: 16 }]} />
            <View style={[styles.menuDash, { width: 24, marginTop: 6 }]} />
          </>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.right, styles.tabButton]} onPress={onTreeInventoryPress}>
          <Text style={styles.tabText}>{i18next.t('label.tree_inventory')}</Text>
          <Text style={styles.inventoryCount}>
            {numberOfInventory > 99 ? '99+' : numberOfInventory}
          </Text>
        </TouchableOpacity>
        <SafeAreaView style={styles.safeArea} />
      </View>
      {showAddOptions ? <AddOptions navigation={navigation} /> : []}
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
    justifyContent: 'space-around',
    alignItems: 'flex-start',
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
    backgroundColor: Colors.PRIMARY_DARK,
    left: width + buttonGutter,
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addOptionsParent: {
    position: 'absolute',
    bottom: tabbarHeight + 42,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  addOptionsContainer: {
    borderRadius: 14,
    padding: 8,
    backgroundColor: Colors.WHITE,
    justifyContent: 'center',
    alignItems: 'flex-start',
    elevation: 4,
  },
  addButtonOption: {
    padding: 12,
    borderRadius: 8,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    // borderWidth: 1,
    // backgroundColor: '#f2f2f2',
  },
  inventoryCount: {
    position: 'absolute',
    top: 0,
    right: -6,
    height: 20,
    width: 20,
    lineHeight: 20,
    borderRadius: 100,
    textAlign: 'center',
    backgroundColor: Colors.PRIMARY_DARK,
    color: Colors.WHITE,
    fontSize: Typography.FONT_SIZE_10,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
  },
  icon: { height: 48, width: 48, marginRight: 16 },
  text: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_16,
    color: Colors.TEXT_COLOR,
  },
});
