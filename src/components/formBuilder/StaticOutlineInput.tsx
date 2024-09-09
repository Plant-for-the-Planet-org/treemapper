import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { scaleFont, scaleSize } from 'src/utils/constants/mixins';
import { Colors, Typography } from 'src/utils/constants';

interface Props {
  placeHolder: string;
  value: string;
  callBack: () => void;
}

const StaticOutlineInput = ({ placeHolder, value, callBack }: Props) => (
  <View style={styles.containerOutline}>
    <TouchableOpacity style={styles.wrapperOutline} onPress={callBack}>
      <Text style={styles.placeHolderOutline}>{placeHolder}</Text>
      <Text style={styles.labelOutline}>{value}</Text>
    </TouchableOpacity>
  </View>
);

export default StaticOutlineInput;

const styles = StyleSheet.create({
  containerOutline: {
    width: '100%',
    height: scaleSize(55),
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  wrapperOutline: {
    width: '90%',
    height: '100%',
    borderWidth: 1,
    borderColor: Colors.GRAY_TEXT,
    backgroundColor: Colors.BACKDROP_COLOR,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeHolderOutline: {
    paddingHorizontal: 5,
    paddingVertical: 3,
    backgroundColor: Colors.BACKDROP_COLOR,
    fontSize: scaleFont(14),
    color: Colors.TEXT_COLOR,
    position: 'absolute',
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    top: -12,
    left: 10,
  },
  labelOutline: {
    paddingLeft: 15,
    fontFamily: Typography.FONT_FAMILY_BOLD,
  },
});
