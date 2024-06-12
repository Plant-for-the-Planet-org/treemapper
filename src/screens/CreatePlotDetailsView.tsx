import { Pressable, StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import Header from 'src/components/common/Header'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Typography } from 'src/utils/constants'
import CustomButton from 'src/components/common/CustomButton'
import { scaleFont, scaleSize } from 'src/utils/constants/mixins'
import InfoIcon from 'assets/images/svg/InfoIcon.svg'
import OutlinedTextInput from 'src/components/common/OutlinedTextInput'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'

const CreatePlotDetailsView = () => {
    const [plotName, setPlotName] = useState('');
    const [plotLength, setPlotLength] = useState('');
    const [plotWidth, setPlotWidth] = useState('');
    const [plotGroup, setPlotGroup] = useState('');
    console.log(plotGroup, plotLength, plotWidth, plotName)
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const handleNav = () => {
        navigation.navigate('CreatePlotMap')
    }
    const openInfo = () => {
        navigation.navigate('MonitoringInfo')
    }
    return (
        <SafeAreaView style={styles.container}>
            <Header label='Create Plot'  rightComponet={<Pressable onPress={openInfo} style={styles.infoWrapper}><InfoIcon style={styles.infoWrapper} onPress={openInfo} /></Pressable>} />
            <View style={styles.wrapper}>
                <OutlinedTextInput
                    placeholder={'Plot Name'}
                    changeHandler={setPlotName}
                    keyboardType={'default'}
                    trailingtext={''}
                    errMsg={''} />
                <OutlinedTextInput
                    placeholder={'Plot Length'}
                    changeHandler={setPlotLength}
                    keyboardType={'decimal-pad'}
                    trailingtext={'m'}
                    errMsg={''} />
                <Text style={styles.noteWrapper}>
                    25 meters or more recommended
                </Text>
                <OutlinedTextInput
                    placeholder={'Plot Width'}
                    changeHandler={setPlotWidth}
                    keyboardType={'decimal-pad'}
                    trailingtext={'m'}
                    errMsg={''} />
                <Text style={styles.noteWrapper}>
                    4 meters or more recommended
                </Text>
                <OutlinedTextInput
                    placeholder={'Plot Group (Optional)'}
                    changeHandler={setPlotGroup}
                    keyboardType={'decimal-pad'}
                    trailingtext={''}
                    errMsg={''} />
            </View>
            <CustomButton
                label="Create"
                containerStyle={styles.btnContainer}
                pressHandler={handleNav}
                hideFadein
            />
        </SafeAreaView>
    )
}

export default CreatePlotDetailsView

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.WHITE
    },
    wrapper: {
        flex: 1,
        backgroundColor: Colors.BACKDROP_COLOR,
        paddingHorizontal: 20,
        paddingTop: 20
    },
    btnContainer: {
        width: '100%',
        height: scaleSize(70),
        position: 'absolute',
        bottom: 50,
    },
    infoWrapper: {
        marginRight: '5%'
    },
    noteWrapper: {
        marginHorizontal: '5%',
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        color: Colors.TEXT_COLOR,
        letterSpacing: 0.4,
        fontSize: scaleFont(14),
        marginBottom: 15
    }
})