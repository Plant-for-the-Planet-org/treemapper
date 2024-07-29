import React, { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { scaleFont, scaleSize } from 'src/utils/constants/mixins';
import { Colors, Typography } from 'src/utils/constants';
import { convertDateToTimestamp, timestampToBasicDate } from 'src/utils/helpers/appHelper/dataAndTimeHelper';

interface Props {
  placeHolder: string;
  value: number;
  callBack: (d: number) => void;
}

const InterventionDatePicker: React.FC<Props> = ({ placeHolder, value, callBack }) => {
  const [showPicker, setShowPicker] = useState(false);

  const openPicker = () => setShowPicker(true);

  const onDateSelect = (_event: any, date: Date | undefined) => {
    setShowPicker(false);
    if (date) {
      callBack(convertDateToTimestamp(date));
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.wrapper} onPress={openPicker}>
        <Text style={styles.placeHolder}>{placeHolder}</Text>
        <Text style={styles.label}>{timestampToBasicDate(value)}</Text>
      </TouchableOpacity>
      {showPicker && (
        <View style={styles.dateStyle}>
          <DateTimePicker
            value={new Date(value)}
            onChange={onDateSelect}
            display="spinner"
          />
        </View>
      )}
    </View>
  );
};

export default InterventionDatePicker;

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
