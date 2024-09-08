import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Colors, Typography } from 'src/utils/constants';
import { timestampToBasicDate } from 'src/utils/helpers/appHelper/dataAndTimeHelper';

interface Props {
  placeHolder: string;
  value: number;
  showPicker: () => void;
}

const InterventionDatePicker: React.FC<Props> = ({ placeHolder, value, showPicker }) => {

  const openPicker = () => showPicker();


  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.wrapper} onPress={openPicker}>
        <Text style={styles.placeHolder}>{placeHolder}</Text>
        <Text style={styles.label}>{timestampToBasicDate(value)}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default InterventionDatePicker;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 60,
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
    fontSize: 14,
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
  dateStyle: {
    position: 'absolute',
    zIndex: 1,
    backgroundColor: Colors.WHITE,
    height: 300,
    borderRadius: 12,
    width: '95%',
    borderWidth: 0.5,
    borderColor: Colors.GRAY_LIGHT,
  },
});
