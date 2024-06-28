import { StyleSheet, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from 'src/utils/constants'
import PlotPlantRemeasureHeader from 'src/components/monitoringPlot/PlotPlantRemeasureHeader'
import { SampleTree } from 'src/types/interface/slice.interface'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import OutlinedTextInput from 'src/components/common/OutlinedTextInput'
import PlaceHolderSwitch from 'src/components/common/PlaceHolderSwitch'
import { BACKDROP_COLOR } from 'src/utils/constants/colors'
import CustomButton from 'src/components/common/CustomButton'
import { TREE_RE_STATUS } from 'src/types/type/app.type'
import CustomDropDownPicker from 'src/components/common/CustomDropDown'
import { DropdownData } from 'src/types/interface/app.interface'

const PredefineReasons: Array<{
    label: string
    value: TREE_RE_STATUS
    index: number
}> = [
        {
            label: 'Drought',
            value: 'DROUGHT',
            index: 0,
        },
        {
            label: 'Fire',
            value: 'FIRE',
            index: 1,
        },
        {
            label: "Flood",
            value: 'FLOOD',
            index: 2,
        },
        {
            label: 'Other',
            value: 'OTHER',
            index: 3,
        }
    ]



const TreeRemeasurementView = () => {
    const [treeDetails, setTreeDetails] = useState<SampleTree | null>(null)
    const [height, setHeight] = useState('')
    const [width, setWidth] = useState('')
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const route = useRoute<RouteProp<RootStackParamList, 'TreeRemeasurement'>>()
    const [isAlive, setIsAlive] = useState(true)
    const interventionId = route.params && route.params.interventionId ? route.params.interventionId : ''
    const treeId = route.params && route.params.treeId ? route.params.treeId : ''
    const [type, setType] = useState<DropdownData>(PredefineReasons[0])
    const realm = useRealm()

    useEffect(() => {
        if (treeId) {
            const treeData = realm.objectForPrimaryKey<SampleTree>(RealmSchema.SampleTree, treeId);
            if (treeData) {
                setTreeDetails(treeData)
            }
        }
    }, [treeId])

    const submitHadler = () => {
        console.log("ALCJd", interventionId)
        navigation.goBack()
    }

    if (!treeDetails) {
        return null
    }

    return (
        <SafeAreaView style={styles.container}>
            <PlotPlantRemeasureHeader tree label={treeDetails.hid} type={'RECRUIT'} species={treeDetails.specie_name} allias={treeDetails.local_name} showRemeasure={true} />
            <View style={styles.wrapper}>
                <PlaceHolderSwitch
                    description={'This tree is still alive'}
                    selectHandler={setIsAlive}
                    value={isAlive}
                />
                {isAlive ? <>
                    <View style={styles.inputWrapper}>
                        <OutlinedTextInput
                            placeholder={'Height'}
                            changeHandler={setHeight}
                            defaultValue={height}
                            keyboardType={'decimal-pad'}
                            trailingtext={'m'} errMsg={''} />
                    </View>
                    <View style={styles.inputWrapper}>
                        <OutlinedTextInput
                            placeholder={'Diameter'}
                            changeHandler={setWidth}
                            keyboardType={'decimal-pad'}
                            defaultValue={width}
                            trailingtext={'cm'} errMsg={''} />
                    </View></> :
                    <>
                        <CustomDropDownPicker
                            label={'Reason'}
                            data={PredefineReasons}
                            onSelect={setType}
                            selectedValue={type}
                        />
                        <View style={styles.inputWrapper}>
                            <OutlinedTextInput
                                placeholder={'Comments(Optional)'}
                                changeHandler={setWidth}
                                keyboardType={'decimal-pad'}
                                defaultValue={width}
                                trailingtext={''} errMsg={''} />
                        </View></>
                }
            </View>
            <CustomButton
                label="Save"
                containerStyle={styles.btnContainer}
                pressHandler={submitHadler}
                hideFadein
            />
        </SafeAreaView>
    )
}

export default TreeRemeasurementView

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.WHITE
    },
    inputWrapper: {
        width: '95%'
    },
    wrapper: {
        backgroundColor: BACKDROP_COLOR,
        flex: 1,
        alignItems: 'center',
        paddingTop: 20
    },
    btnContainer: {
        width: '100%',
        height: 70,
        position: 'absolute',
        bottom: 50,
    },
    btnContainedr: {
        width: '100%',
        height: 70,
        flexDirection: 'row',
        alignItems: 'center',
        position: 'absolute',
        bottom: 30,
        justifyContent: 'center'
    },
    btnWrapper: {
        width: '48%',
    },
})