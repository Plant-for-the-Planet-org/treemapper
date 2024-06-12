import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Header from 'src/components/common/Header'
import GpsAccuracyTile from 'src/components/map/GpsAccuracyTile'
import { Colors, Typography } from 'src/utils/constants'
import { scaleFont, scaleSize } from 'src/utils/constants/mixins'
import CustomButton from 'src/components/common/CustomButton'
import { SafeAreaView } from 'react-native-safe-area-context'
import CreatePlotMapDetail from 'src/components/map/CreatePlotMapDetail'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'

const CreatePlotMapView = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const handleNav = () => {
        navigation.navigate('PlotDetails')
    }
    return (
        <SafeAreaView style={styles.container}>
            <Header label='Plot Center' rightComponet={<GpsAccuracyTile showModalInfo={() => null} />} />
            <View style={styles.noteWrapper}>
                <Text style={styles.noteLabel}>Go to the center of the plot and insert a painted rebar post labeled Plot Name or another permanent, labeled marking</Text>
            </View>
            <CreatePlotMapDetail />
            <CustomButton
                label="Continue"
                containerStyle={styles.btnContainer}
                pressHandler={handleNav}
            />
        </SafeAreaView>
    )
}

export default CreatePlotMapView

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.WHITE
    },
    noteWrapper: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20
    },
    noteLabel: {
        width: '90%',
        fontSize: scaleFont(12),
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        color: Colors.TEXT_COLOR,
        lineHeight: 20,
        textAlign: 'left'
    },
    btnContainer: {
        width: '100%',
        height: scaleSize(70),
        position: 'absolute',
        bottom: 50,
    },
})