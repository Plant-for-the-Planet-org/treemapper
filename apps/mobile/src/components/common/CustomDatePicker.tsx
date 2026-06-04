import { Dimensions, Platform, Pressable, StyleSheet, View } from 'react-native'
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
    const onDateSelect = (event: any, date?: Date | undefined) => {
        // On Android, the event.type tells us if user pressed OK or Cancel
        // On iOS, this event is always triggered when date changes
        if (Platform.OS === 'android') {
            if (event.type === 'set' && date) {
                // User pressed OK
                cb(convertDateToTimestamp(date));
            } else if (event.type === 'dismissed') {
                // User pressed Cancel or dismissed
                cb(0);
            }
        } else {
            // iOS behavior - always update on change
            if (date) {
                cb(convertDateToTimestamp(date));
            } else {
                cb(0);
            }
        }
    };
    
    const handleBackdropPress = () => {
        // Only close on backdrop press for iOS or when using spinner display
        if (Platform.OS === 'ios') {
            cb(0);
        }
    };
    
    return (
        <View style={styles.container}>
            <Pressable style={styles.backdrop} onPress={handleBackdropPress} />
            <DateTimePicker
                maximumDate={new Date(selectedData)}
                minimumDate={new Date(2006, 0, 1)}
                value={new Date()}
                onChange={onDateSelect}
                display={Platform.OS === 'android' ? 'default' : 'spinner'}
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