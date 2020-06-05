import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '_styles';


const MainScreenHeader = ({ }) => {

    return (
        <View style={styles.container}>
            <View />
            <Text style={styles.loginText}>Login / Sign Up</Text>
        </View>
    )
}
export default MainScreenHeader

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row', justifyContent: 'space-between', marginVertical: 15
    },
    loginText: {
        color: Colors.PRIMARY, fontSize: Typography.FONT_SIZE_16,
    }

})