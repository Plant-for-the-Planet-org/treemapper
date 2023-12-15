import { StyleSheet, TouchableOpacity, View, Text, Dimensions } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';
import {
  SingleTreeIcon,
  MultipleTreeIcon,
  Intervention,
  ChartIcon,
  CrossArrow,
} from '../../assets';

import React, { useMemo } from 'react';
import i18next from 'i18next';
import { Colors, Typography } from '../../styles';
import { GradientText } from '../Common';

const { width, height } = Dimensions.get('screen');

export default React.forwardRef(({ visible, setVisible = () => {}, navigation }, ref) => {
  const heightValue = useDerivedValue(() => {
    return withTiming(visible ? 0 : 500, { duration: 500 });
  }, [visible]);

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ translateY: heightValue.value }],
  }));

  const addOptions = [
    {
      svgIcon: <ChartIcon />,
      title: 'Monitoring Plot',
      coming_soon: true,
      onPress: () => navigation.navigate('Interventions'),
      disabled: true,
    },
    {
      svgIcon: <CrossArrow />,
      title: 'Project Site',
      coming_soon: true,
      onPress: () => navigation.navigate('Interventions'),
      disabled: true,
    },
    {
      svgIcon: <Intervention />,
      title: 'Intervention',
      coming_soon: true,
      onPress: () => navigation.navigate('CreateIntervention'),
      disabled: true,
    },
    {
      svgIcon: <SingleTreeIcon />,
      title: 'label.tree_registration_type_1',
      coming_soon: false,
      onPress: () => navigation.navigate('RegisterSingleTree'),
      disabled: false,
    },
    {
      svgIcon: <MultipleTreeIcon />,
      title: 'label.tree_registration_type_2',
      coming_soon: false,
      onPress: () => navigation.navigate('LocateTree'),
      disabled: false,
    },
  ];

  const calcComponents = useMemo(() => {
    return addOptions.map((option, index) => (
      <View key={`addOption${index}`} style={styles.addButtonOptionWrap}>
        <TouchableOpacity disabled={option.disabled} onPress={option.onPress}>
          <View style={styles.addButtonOption}>
            <View style={styles.icon}>{option.svgIcon}</View>
            <View>
              <Text style={styles.text}>{i18next.t(option.title)}</Text>
              {option.coming_soon && (
                <GradientText style={styles.coming_soon}>Coming Soon</GradientText>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    ));
  }, [addOptions]);

  return (
    <>
      {visible && (
        <TouchableOpacity
          onPress={() => setVisible(false)}
          style={{
            height,
            width,
            position: 'absolute',
          }}
          activeOpacity={1}
        />
      )}
      <Animated.View
        style={[
          {
            overflow: 'hidden',
            position: 'absolute',
            right: 18,
            bottom: 120,
            backgroundColor: 'white',
            borderRadius: 12,
            elevation: 4,
            paddingLeft: 18,
            paddingRight: 18,
            paddingVertical: 10,
            height: 340,
            width: 230,
            zIndex: 10,
          },
          animatedStyles,
        ]}>
        <Animated.View style={{ zIndex: 100 }}>{calcComponents}</Animated.View>
      </Animated.View>
    </>
  );
});

const styles = StyleSheet.create({
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
    paddingVertical: 3,
    paddingHorizontal: 5,
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
});
