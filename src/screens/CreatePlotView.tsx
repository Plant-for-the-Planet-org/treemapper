import { StyleSheet, View } from 'react-native'
import React, { useState } from 'react'
import Header from 'src/components/common/Header'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from 'src/utils/constants'
import CreatePlotCard from 'src/components/monitoringPlot/CreatePlotCard'
import CustomButton from 'src/components/common/CustomButton'
import { scaleSize } from 'src/utils/constants/mixins'
import InfoIcon from 'assets/images/svg/InfoIcon.svg'

const CreatePlotView = () => {
    const [plotType, setPlotType] = useState('intervention');
    const [plotShape, setPlotShape] = useState('rectangular');
    const [plotComplexity, setPlotComplexity] = useState('standard');

    return (
        <SafeAreaView style={styles.container}>
            <Header label='Create Plot' rightComponet={<InfoIcon style={styles.infoWrapper}/>} />
            <View style={styles.wrapper}>
                <CreatePlotCard header={'Plot Complexity'} labelOne={{
                    key: 'standard',
                    value: 'Standard'
                }} labelTwo={{
                    key: 'simple',
                    value: 'Simple'
                }} disabled={true}
                    selectedValue={plotComplexity}
                    onSelect={setPlotComplexity}
                />
                <CreatePlotCard header={'Plot Shape'} labelOne={{
                    key: 'rectangular',
                    value: 'Rectangular'
                }} labelTwo={{
                    key: 'circular',
                    value: 'Circular'
                }} disabled={false}
                    selectedValue={plotShape}
                    onSelect={setPlotShape} />
                <CreatePlotCard header={'Plot type'} labelOne={{
                    key: 'intervention',
                    value: 'Intervention'
                }} labelTwo={{
                    key: 'control',
                    value: 'Control'
                }} disabled={false}
                    selectedValue={plotType}
                    onSelect={setPlotType} />
                <CustomButton
                    label="Continue"
                    containerStyle={styles.btnContainer}
                    pressHandler={() => { }}
                />
            </View>
        </SafeAreaView>
    )
}

export default CreatePlotView

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.WHITE
    },
    wrapper: {
        flex: 1,
        backgroundColor: Colors.BACKDROP_COLOR
    },
    btnContainer: {
        width: '100%',
        height: scaleSize(70),
        position: 'absolute',
        bottom: 30,
    },
    infoWrapper:{
        marginRight:'5%'
    }
})