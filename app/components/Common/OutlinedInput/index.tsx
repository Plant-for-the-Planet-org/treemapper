import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, EasingFunction, StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors, Typography } from '../../../styles';
import Icon from 'react-native-vector-icons/FontAwesome5';
import i18next from 'i18next';

type secureTextEntryType = true | false;
type autoCapitalizeType = 'characters' | 'words' | 'sentences' | 'none';

interface PropTypes {
  label?: string;
  onChangeText?: any;
  value?: string;
  secureTextEntry?: secureTextEntryType;
  autoCapitalize?: autoCapitalizeType;
  fontSize?: number;
  height?: number;
  duration?: number;
  easing?: EasingFunction;
  activeValueColor?: string;
  passiveValueColor?: string;
  activeLabelColor?: string;
  passiveLabelColor?: string;
  activeBorderColor?: string;
  passiveBorderColor?: string;
  fontFamily?: string;
  keyboardType?: string;
  rightText?: string;
  returnKeyType?: string;
  blurOnSubmit?: boolean;
  onSubmitEditing?: any;
  ref?: any;
  editable?: boolean;
  error?: string | boolean;
  style?: any;
  isDropdown?: boolean;
  showOptions?: boolean;
  backgroundLabelColor?: string;
  containerBackgroundColor?: string;
  autoFocus?: boolean;
}

interface CommonAnimatedPropsTypes {
  duration: number;
  useNativeDriver: boolean;
  easing: EasingFunction;
}

interface LabelStylePropTypes {
  isFocused: boolean;
  initialTopValue: number;
  activeLabelColor: string;
  passiveLabelColor: string;
  isError: boolean;
  errorColor: string;
  backgroundLabelColor: string;
}

interface InputStyleProps {
  padding: number;
  height: number;
  fontSize: number;
  isFocused: boolean;
  activeValueColor: string;
  passiveValueColor: string;
  isError: boolean;
  errorColor: string;
  // backgroundValueColor: string
}

const OutlinedInput = React.forwardRef(
  (
    {
      label,
      onChangeText,
      value,
      secureTextEntry = false,
      autoCapitalize = 'none',
      fontSize = Typography.FONT_SIZE_16,
      height = 50,
      duration = 300,
      easing = Easing.inOut(Easing.ease),
      activeValueColor = Colors.TEXT_COLOR,
      passiveValueColor = Colors.TEXT_COLOR,
      activeLabelColor = Colors.PRIMARY,
      passiveLabelColor = Colors.GRAY_LIGHTEST,
      backgroundLabelColor = Colors.WHITE,
      activeBorderColor = Colors.PRIMARY,
      passiveBorderColor = Colors.GRAY_LIGHT,
      containerBackgroundColor = Colors.WHITE,
      fontFamily = Typography.FONT_FAMILY_REGULAR,
      keyboardType = 'default',
      rightText,
      returnKeyType = 'done',
      blurOnSubmit,
      onSubmitEditing,
      editable = true,
      error = '',
      style = {},
      isDropdown = false,
      showOptions,
      autoFocus = false,
    }: PropTypes,
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState<boolean>(false);
    const [borderColor, setBorderColor] = useState<string>(Colors.GRAY_LIGHTEST);
    const lineHeightValue: number = fontSize + 2;
    const initialTopValue: number = (height - lineHeightValue) / 2;
    const labelPositionEmptyValue: number = 0;
    const inputValueFontSize: number = fontSize;
    const padding: number = 8;
    const labelPositionFillValue: number = lineHeightValue / 2 + initialTopValue;
    const inputHeight: number = height;
    const errorColor = Colors.ALERT;

    const labelPositionRef = useRef(
      new Animated.Value(value ? labelPositionFillValue : labelPositionEmptyValue),
    ).current;
    const fontSizeRef = useRef(new Animated.Value(value ? fontSize - 2 : fontSize)).current;
    const lineHeightRef = useRef(new Animated.Value(value ? lineHeightValue - 2 : lineHeightValue))
      .current;
    const zIndexRef = useRef(new Animated.Value(value ? 2 : -1)).current;

    const commonAnimatedProps: CommonAnimatedPropsTypes = {
      duration,
      useNativeDriver: false,
      easing,
    };

    useEffect(() => {
      if (error) {
        setBorderColor(errorColor);
      } else if (isFocused) {
        setBorderColor(activeBorderColor);
      } else if (value) {
        setBorderColor(passiveValueColor);
      } else {
        setBorderColor(passiveBorderColor);
      }
    }, [error, isFocused, value]);

    useEffect(() => {
      if (!!value) {
        onFocus();
        setIsFocused(false);
      } else {
        onBlur();
      }
    }, [value]);

    const onBlur: () => void = useCallback(() => {
      setIsFocused(false);
      if (!value) {
        Animated.parallel([
          Animated.timing(labelPositionRef, {
            toValue: labelPositionEmptyValue,
            ...commonAnimatedProps,
          }),
          Animated.timing(fontSizeRef, {
            toValue: fontSize,
            ...commonAnimatedProps,
          }),
          Animated.timing(lineHeightRef, {
            toValue: lineHeightValue,
            ...commonAnimatedProps,
          }),
          Animated.timing(zIndexRef, {
            toValue: -1,
            ...commonAnimatedProps,
          }),
        ]).start();
      }
    }, [!!value]);

    const onFocus: () => void = useCallback(() => {
      setIsFocused(true);
      Animated.parallel([
        Animated.timing(labelPositionRef, {
          toValue: labelPositionFillValue,
          ...commonAnimatedProps,
        }),
        Animated.timing(fontSizeRef, {
          toValue: fontSize - 2,
          ...commonAnimatedProps,
        }),
        Animated.timing(lineHeightRef, {
          toValue: lineHeightValue - 2,
          ...commonAnimatedProps,
        }),
        Animated.timing(zIndexRef, {
          toValue: 2,
          ...commonAnimatedProps,
        }),
      ]).start();
    }, [!!value]);

    const animatedViewProps = {
      style: {
        position: 'absolute',
        bottom: labelPositionRef,
        left: 10,
        zIndex: zIndexRef,
        height,
      },
    };

    const animatedTextProps = {
      style: [
        LabelStyle({
          isFocused,
          initialTopValue,
          activeLabelColor,
          passiveLabelColor,
          isError: !!error,
          errorColor,
          backgroundLabelColor,
        }),
        { fontSize: fontSizeRef, lineHeight: lineHeightRef, fontFamily },
      ],
    };

    const inputProps = {
      secureTextEntry,
      value,
      onChangeText,
      onFocus,
      onBlur,
      autoCapitalize,
      isFocused,
      height: inputHeight,
      padding,
      paddingLeft: 15,
      fontSize: inputValueFontSize,
      returnKeyType,
      keyboardType,
      blurOnSubmit,
      onSubmitEditing,
      ref,
      editable,
      autoFocus,
      style: [
        { fontFamily, flex: 1 },
        InputStyle({
          padding,
          height,
          fontSize,
          isFocused,
          activeValueColor,
          passiveValueColor,
          isError: !!error,
          errorColor,
        }),
      ],
    };

    return (
      <View style={style}>
        <View style={[styles.container, { backgroundColor: containerBackgroundColor }]}>
          <Animated.View {...animatedViewProps}>
            <Animated.Text {...animatedTextProps}>{label}</Animated.Text>
          </Animated.View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              borderWidth: 1,
              borderRadius: 5,
              borderColor,
              alignItems: 'center',
            }}>
            {isDropdown || !editable ? (
              <Text
                style={[
                  inputProps.style,
                  {
                    paddingVertical: 14,
                    paddingLeft: 16,
                    height: 'auto',
                    color: Colors.TEXT_COLOR,
                  },
                ]}>
                {value ?? i18next.t('label.select_dropdown_option')}
              </Text>
            ) : (
              <TextInput {...inputProps} />
            )}
            {isDropdown ? (
              <View style={{ paddingHorizontal: 16 }}>
                <Icon
                  name={showOptions ? 'caret-up' : 'caret-down'}
                  color={Colors.TEXT_COLOR}
                  size={20}
                />
              </View>
            ) : (
              <Text
                style={{
                  color: Colors.TEXT_COLOR,
                  fontFamily,
                  fontSize: Typography.FONT_SIZE_18,
                  // padding: 10,
                  paddingRight: 20,
                }}>
                {rightText}
              </Text>
            )}
          </View>
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : []}
      </View>
    );
  },
);

const LabelStyle = ({
  isFocused,
  initialTopValue,
  activeLabelColor,
  passiveLabelColor,
  backgroundLabelColor,
  isError,
  errorColor,
}: LabelStylePropTypes) => ({
  fontStyle: 'normal',
  fontWeight: 'normal',
  color: isError ? errorColor : isFocused ? activeLabelColor : passiveLabelColor,
  backgroundColor: backgroundLabelColor || Colors.WHITE,
  paddingRight: 5,
  paddingLeft: 5,
  top: initialTopValue,
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    marginRight: 5,
    backgroundColor: Colors.WHITE,
  },
  errorText: {
    color: Colors.ALERT,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_12,
    marginTop: 6,
  },
});

const InputStyle = ({
  padding,
  height,
  fontSize,
  isFocused,
  activeValueColor,
  passiveValueColor,
  isError,
  errorColor,
}: InputStyleProps) => ({
  padding,
  height,
  fontSize,
  color: isError ? errorColor : isFocused ? activeValueColor : passiveValueColor,
});

export default memo(OutlinedInput);
