import React from 'react';
import { useNavigation } from '@react-navigation/native';
import MIcon from 'react-native-vector-icons/MaterialIcons';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { ArrowBack } from '../../../assets';
import { Colors, Typography } from '../../../styles';

interface IHeaderProps {
  hideBackIcon?: any;
  headingText?: string;
  onBackPress?: any;
  textAlignStyle?: any;
  style?: any;
  containerStyle?: any;
  testID?: any;
  accessibilityLabel?: any;
  TitleRightComponent?: any;
}

const HeaderV2 = ({
  hideBackIcon = false,
  headingText,
  onBackPress,
  textAlignStyle = {},
  testID,
  accessibilityLabel,
  TitleRightComponent,
  containerStyle = {},
}: IHeaderProps) => {
  const navigation = useNavigation();
  const onPressBack = onBackPress ? onBackPress : () => navigation.goBack();
  return (
    <View style={[styles.containerStyle, containerStyle]}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        <View style={styles.arrowContainer}>
          {!hideBackIcon && (
            <TouchableOpacity
              onPress={onPressBack}
              testID={testID}
              accessible={true}
              accessibilityLabel={accessibilityLabel}
              style={styles.paddingVertical}>
              <ArrowBack />
            </TouchableOpacity>
          )}
        </View>
        <View style={{}}>
          {headingText && <Text style={[styles.headerText, textAlignStyle]}>{headingText}</Text>}
        </View>
      </View>

      {TitleRightComponent && <TitleRightComponent style={{ marginRight: 0 }} />}
    </View>
  );
};
export default HeaderV2;

const styles = StyleSheet.create({
  headerText: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_20,
    color: Colors.BLACK,
    marginLeft: 32,
  },
  containerStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.WHITE,
    justifyContent: 'space-between',
  },
  arrowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paddingVertical: {
    paddingVertical: 4,
  },
});
