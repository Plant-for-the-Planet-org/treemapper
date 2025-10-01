import { StyleSheet, TouchableOpacity, View } from 'react-native'
import React from 'react'
import BackIcon from 'assets/images/svg/BackIcon.svg'

interface Props {
    backHandler: () => void
}

const BackComponent = (props: Props) => {
    const {backHandler} = props;
    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.backWrapper} onPress={backHandler}>
                <BackIcon />
            </TouchableOpacity>
        </View>
    )
}

export default BackComponent

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 50,
        alignItems: 'center'
    },
    backWrapper: {
        width: 20,
        height: 20,
        marginLeft: 20,
    }
})