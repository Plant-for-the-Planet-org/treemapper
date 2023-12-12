import React from 'react';
import { useNavigation } from '@react-navigation/native';
import MIcon from 'react-native-vector-icons/MaterialIcons';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { ArrowBack } from '../../../assets';
import { Colors, Typography } from '../../../styles';

interface IHeaderProps {
  hideBackIcon?: any;
  closeIcon?: any;
  headingText?: string;
  headingTextEditable?: any;
  onPressHeading?: any;
  subHeadingText?: any;
  onBackPress?: any;
  textAlignStyle?: any;
  style?: any;
  containerStyle?: any;
  subHeadingStyle?: any;
  testID?: any;
  accessibilityLabel?: any;
  rightText?: any;
  onPressFunction?: any;
  TopRightComponent?: any;
  TitleRightComponent?: any;
  whiteBackIcon?: any;
}

const Header = ({
  hideBackIcon,
  closeIcon,
  headingText,
  headingTextEditable,
  onPressHeading,
  subHeadingText,
  onBackPress,
  textAlignStyle = {},
  style = {},
  subHeadingStyle = {},
  testID,
  accessibilityLabel,
  rightText,
  onPressFunction,
  TopRightComponent,
  TitleRightComponent,
  whiteBackIcon,
  containerStyle = {},
}: IHeaderProps) => {
  const navigation = useNavigation();
  const onPressBack = onBackPress ? onBackPress : () => navigation.goBack();
  return (
    <View style={style}>
      <View style={[styles.containerStyle, containerStyle]}>
        <View style={styles.arrowContainer}>
          {!hideBackIcon ? (
            <TouchableOpacity
              onPress={onPressBack}
              testID={testID}
              accessible={true}
              accessibilityLabel={accessibilityLabel}
              style={styles.paddingVertical}>
              <ArrowBack />
            </TouchableOpacity>
          ) : (
            []
          )}
          {headingText ? (
            <Text
              style={[
                styles.headerText,
                textAlignStyle,
                TitleRightComponent ? { flex: 1, marginRight: 16 } : {},
              ]}>
              {headingText}
            </Text>
          ) : headingTextEditable !== undefined ? (
            <TouchableOpacity style={{ flex: 1 }} onPress={() => onPressHeading()}>
              <Text
                style={{
                  fontFamily: Typography.FONT_FAMILY_EXTRA_BOLD,
                  fontSize: Typography.FONT_SIZE_27,
                  color: Colors.TEXT_COLOR,
                  // flex: 1,
                }}>
                {`${headingTextEditable} `}
                <MIcon name={'edit'} size={20} />
              </Text>
            </TouchableOpacity>
          ) : (
            []
          )}
          {rightText ? (
            onPressFunction ? (
              <TouchableOpacity onPress={() => onPressFunction()}>
                <Text style={styles.rightText}>{rightText}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.rightText}>{rightText}</Text>
            )
          ) : null}
          {TitleRightComponent ? <TitleRightComponent style={{ marginRight: 0 }} /> : null}
        </View>
        <View
          style={
            TitleRightComponent
              ? {
                  // flexDirection: 'row-reverse',
                  // alignItems: 'center',
                  // justifyContent: 'space-between',
                }
              : {}
          }>
          {subHeadingText ? (
            <View style={{ marginVertical: 10 }}>
              <Text style={[styles.subHeadingText, textAlignStyle, subHeadingStyle]}>
                {subHeadingText}
              </Text>
            </View>
          ) : (
            []
          )}
          {TopRightComponent ? <TopRightComponent /> : null}
        </View>
      </View>
    </View>
  );
};
export default Header;

const styles = StyleSheet.create({
  headerText: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_20,
    color: Colors.BLACK,
    marginLeft: 32,
  },
  subHeadingText: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
    marginLeft: 50,
  },
  containerStyle: {
    // flexDirection: 'row',
    paddingBottom: 16,
    paddingTop: 16,
    backgroundColor: Colors.WHITE,
    justifyContent: 'center',
  },
  arrowContainer: {
    flexDirection: 'row',
    // justifyContent: 'space-between',
    alignItems: 'center',
    // width: '100%',
  },
  paddingVertical: {
    paddingVertical: 4,
  },
  rightText: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_16,
    paddingTop: 20,
    color: Colors.PRIMARY,
  },
});
