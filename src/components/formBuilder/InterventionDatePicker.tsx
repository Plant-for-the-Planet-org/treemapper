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
    <View style={styles.containerPicker}>
      <TouchableOpacity style={styles.wrapperPicker} onPress={openPicker}>
        <Text style={styles.placeHolderPicker}>{placeHolder}</Text>
        <Text style={styles.labelPicker}>{timestampToBasicDate(value)}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default InterventionDatePicker;

const styles = StyleSheet.create({
  containerPicker: {
    width: '100%',
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  wrapperPicker: {
    width: '90%',
    height: '100%',
    borderWidth: 1,
    borderColor: Colors.GRAY_TEXT,
    backgroundColor: Colors.BACKDROP_COLOR,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeHolderPicker: {
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
  labelPicker: {
    paddingLeft: 15,
    fontFamily: Typography.FONT_FAMILY_BOLD,
  },
  dateStylePicker: {
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
