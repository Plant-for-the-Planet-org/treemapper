import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from 'src/utils/constants'
import PlotPlantRemeasureHeader from 'src/components/monitoringPlot/PlotPlantRemeasureHeader'
import { History, SampleTree } from 'src/types/interface/slice.interface'
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
import PenIcon from 'assets/images/svg/PenIcon.svg'
import { DropdownData } from 'src/types/interface/app.interface'
import { v4 as uuid } from 'uuid'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import { useToast } from 'react-native-toast-notifications'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
import { SCALE_26, SCALE_36 } from 'src/utils/constants/spacing'
import { AvoidSoftInput, AvoidSoftInputView } from 'react-native-avoid-softinput'

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
    const { addPlantHistory, checkAndUpdatePlantHistory } = useInterventionManagement()
    const route = useRoute<RouteProp<RootStackParamList, 'TreeRemeasurement'>>()
    const [isAlive, setIsAlive] = useState(true)
    const [comment, setComment] = useState('')
    const imageDetails = useSelector((state: RootState) => state.cameraState)
    const [imageId, setImageId] = useState('')
    const toast = useToast()
    const interventionId = route.params?.interventionId ?? "";
    const treeId = route.params?.treeId ?? '';
    const [type, setType] = useState<DropdownData>(PredefineReasons[0])
    const realm = useRealm()
    const [imageUri, setImageUri] = useState('')

    useEffect(() => {
        if (treeId) {
            const treeData = realm.objectForPrimaryKey<SampleTree>(RealmSchema.TreeDetail, treeId);
            if (treeData) {
                setTreeDetails(treeData)
            }
        }
    }, [treeId])

    useEffect(() => {
        if (imageId === imageDetails.id && imageId !== '') {
            setImageUri(imageDetails.url)
        }
    }, [imageDetails])

    useEffect(() => {
        AvoidSoftInput.setShouldMimicIOSBehavior(true);
        return () => {
            AvoidSoftInput.setShouldMimicIOSBehavior(false);
        };
    })

    const takePicture = () => {
        const newID = String(new Date().getTime())
        setImageId(newID)
        navigation.navigate('TakePicture', {
            id: newID,
            screen: 'REMEASUREMENT_IMAGE',
        })
    }

    const submitHadler = async () => {
        if (isAlive && imageUri.length == 0) {
            takePicture()
            return
        }
        const param: History = {
            history_id: uuid(),
            eventName: isAlive ? 'measurement' : 'status',
            eventDate: Date.now(),
            imageUrl: imageUri,
            cdnImageUrl: '',
            diameter: Number(width),
            height: Number(height),
            additionalDetails: undefined,
            appMetadata: '',
            status: isAlive ? '' : type.value,
            statusReason: comment,
            dataStatus: '',
            parentId: '',
            samplePlantLocationIndex: 0,
            lastScreen: ''
        }
        const result = await addPlantHistory(treeId, param)
        if (result) {
            await checkAndUpdatePlantHistory(interventionId)
            navigation.replace('InterventionPreview', { id: 'preview', intervention: interventionId, sampleTree: treeId, interventionId: interventionId })
        } else {
            toast.show("Error occurred")
        }
    }

    if (!treeDetails) {
        return null
    }

    const imageURL = () => imageUri.length == 0 ? "Continue" : "Save"

    return (
        <SafeAreaView style={styles.container}>
            <AvoidSoftInputView
                avoidOffset={20}
                style={styles.container}>
                <PlotPlantRemeasureHeader tree label={treeDetails.hid} type={'RECRUIT'} species={treeDetails.specie_name} showRemeasure={true} />
                <ScrollView>

                    <View style={styles.wrapper}>
                        <PlaceHolderSwitch
                            description={'This tree is still alive'}
                            selectHandler={setIsAlive}
                            value={isAlive}
                        />
                        {isAlive ? <>

                            {imageUri && <View style={styles.imageWrapper}><View style={styles.imageContainer}>
                                <Image
                                    source={{
                                        uri: imageUri,
                                    }}
                                    style={styles.imageView}
                                    resizeMode="cover"
                                />
                                <View style={styles.imageControls}>
                                    <TouchableOpacity onPress={takePicture}>
                                        <View style={[styles.iconContainer]}>
                                            <PenIcon width={SCALE_26} height={SCALE_26} />
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </View></View>}
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
                                        changeHandler={setComment}
                                        keyboardType={'decimal-pad'}
                                        defaultValue={width}
                                        trailingtext={''} errMsg={''} />
                                </View></>
                        }

                    </View>
                </ScrollView>

                <CustomButton
                    label={!isAlive ? "Save" : imageURL()}
                    containerStyle={styles.btnContainer}
                    pressHandler={submitHadler}
                    hideFadein
                />
            </AvoidSoftInputView>
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
        bottom: 0,
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
    imageWrapper: {
        width: '100%',
        justifyContent: "center",
        alignItems: 'center',
    },
    imageContainer: {
        width: '90%',
        borderRadius: 50,
        aspectRatio: 1
    },
    imageView: {
        borderRadius: 12,
        resizeMode: 'cover',
        width: '100%',
        height: '100%',
        backgroundColor: Colors.TEXT_COLOR,
        aspectRatio: 1
    },
    imageControls: {
        position: 'absolute',
        top: 10,
        right: 10,

    },
    iconContainer: {
        backgroundColor: Colors.WHITE,
        borderRadius: 8,
        width: SCALE_36,
        height: SCALE_36,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 8
    },
})