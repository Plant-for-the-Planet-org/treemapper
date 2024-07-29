import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { scaleFont, scaleSize } from 'src/utils/constants/mixins';
import { Colors, Typography } from 'src/utils/constants';

interface Props {
  placeHolder: string;
  value: string;
  callBack: () => void;
}

const StaticOutlineInput: React.FC<Props> = ({ placeHolder, value, callBack }) => (
  <View style={styles.container}>
    <TouchableOpacity style={styles.wrapper} onPress={callBack}>
      <Text style={styles.placeHolder}>{placeHolder}</Text>
      <Text style={styles.label}>{value}</Text>
    </TouchableOpacity>
  </View>
);

export default StaticOutlineInput;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: scaleSize(55),
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  wrapper: {
    width: '90%',
    height: '100%',
    borderWidth: 1,
    borderColor: Colors.GRAY_TEXT,
    backgroundColor: Colors.BACKDROP_COLOR,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeHolder: {
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
  label: {
    paddingLeft: 15,
    fontFamily: Typography.FONT_FAMILY_BOLD,
  },
});
