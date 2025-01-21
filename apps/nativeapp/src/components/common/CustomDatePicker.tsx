import { Dimensions, Pressable, StyleSheet, View } from 'react-native'
import React from 'react'
import { Colors } from 'src/utils/constants'
import DateTimePicker from '@react-native-community/datetimepicker';
import { convertDateToTimestamp } from 'src/utils/helpers/appHelper/dataAndTimeHelper';


interface Props {
    cb: (d: number) => void
    selectedData: number
}

const CustomDatePicker = (props: Props) => {
    const { cb, selectedData } = props
    const onDateSelect = (_event?: any, date?: Date | undefined) => {
        if (date) {
            cb(convertDateToTimestamp(date));
        } else { cb(0) }
    };
    return (
        <View style={styles.container}>
            <Pressable style={styles.backdrop} onPress={onDateSelect} />
            <DateTimePicker
                maximumDate={new Date(selectedData)}
                minimumDate={new Date(2006, 0, 1)}
                value={new Date()}
                onChange={onDateSelect}
                display="spinner"
                style={styles.dateStyle}
            />
        </View>
    )
}

export default CustomDatePicker

const styles = StyleSheet.create({
    container: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
        zIndex: 10,
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center'
    },
    backdrop: {
        zIndex: -1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        height: '100%',
        width: '100%'
    },
    dateStyle: {
        width: '98%',
        borderRadius: 12,
        paddingVertical: 10,
        height: '40%',
        backgroundColor: Colors.WHITE,
        position: 'absolute',
        bottom: 0
    }
})