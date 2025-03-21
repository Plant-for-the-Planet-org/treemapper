import * as shape from 'd3-shape';
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';


import { Colors } from 'src/utils/constants';
import { scaleSize } from 'src/utils/constants/mixins';

const windowWidth = Dimensions.get('screen').width

let width = windowWidth/4-10
const buttonWidth = scaleSize(56);
const buttonGutter = scaleSize(10);
const tabBarHeight =scaleSize(100);

const tabWidth = buttonWidth + buttonGutter * 2;
width = (width - tabWidth) / 2;
const curveHeight = scaleSize(32);

const getPath = (): string => {
  const left = shape
    .line()
    .x(d => d[0])
    .y(d => d[1])([
      [0, 0],
      [ 5, 0],
    ]);

  const tab = shape
    .line()
    .x(d => d[0])
    .y(d => d[1])
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
    .x(d => d[0])
    .y(d => d[1])([
      [0 + tabWidth, 0],
      [width * 2 + tabWidth, 0],
      [width * 2 + tabWidth, tabBarHeight],
      [0, tabBarHeight],
      [0, 0],
    ]);
  return `${left} ${tab} ${right}`;
};

const d = getPath();


const BottomBar = () => {
  return (
    <View style={style.container}>
      <Svg
        width={'100%'}
        height={tabBarHeight}>
        <Path {...{ d }} fill={Colors.WHITE} />
      </Svg>
    <View style={style.rightPadding}/>
    </View>
  );
};

export default BottomBar;

const style=StyleSheet.create({
  container:{
    width:"100%",
    height:'100%'
  },
  rightPadding:{
    width:20,
    height:'100%',
    backgroundColor:Colors.WHITE,
    position:'absolute',
    right:-10
  }
})


