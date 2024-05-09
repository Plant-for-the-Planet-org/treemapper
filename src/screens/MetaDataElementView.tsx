import { StyleSheet, Text } from 'react-native'
import React, { useState } from 'react'
import { Colors, Typography } from 'src/utils/constants'
import Header from 'src/components/common/Header'
import { SafeAreaView } from 'react-native-safe-area-context'
import CustomTextInput from 'src/components/common/CustomTextInput'
import { View } from 'react-native'
import Switch from 'src/components/common/Switch'
import CustomButton from 'src/components/common/CustomButton'
import { scaleSize } from 'src/utils/constants/mixins'

const MetaDataElementView = () => {
    const [inputKey, setInputKey] = useState('')
    const [inputValue, setInputValue] = useState('')
    const [isPublic, setIsPublic] = useState(false)


    return (
        <SafeAreaView style={styles.container}>
            <Header label={''} />
            <Text style={styles.headerLabel}>Add metadata</Text>
            <CustomTextInput
                label="Field key"
                onChangeHandler={setInputKey}
                value={inputKey}
            />
            <CustomTextInput
                label="Field value"
                onChangeHandler={setInputValue}
                value={inputValue}
            />
            <View style={styles.switchContainer}>
                <Text style={styles.switchText}>Make this data public</Text>
                <Switch value={isPublic} onValueChange={() => {
                    setIsPublic(!isPublic)
                }} disabled={false} />
            </View>
            <CustomButton
                label="Add Element"
                containerStyle={styles.btnContainer}
                pressHandler={()=>{}}
            />
        </SafeAreaView>
    )
}

export default MetaDataElementView

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.WHITE
    },
    headerLabel: {
        fontSize: 28,
        fontFamily: Typography.FONT_FAMILY_EXTRA_BOLD,
        color: Colors.DARK_TEXT_COLOR,
        marginLeft: 20,
        paddingBottom: 20
    },
    switchContainer: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 20
    },
    switchText: {
        color: Colors.TEXT_COLOR,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        fontSize: Typography.FONT_SIZE_16,
        marginRight: 16,
    },
    btnContainer: {
        width: '100%',
        height: scaleSize(70),
        position: 'absolute',
        bottom: 0,
      },
})