import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Typography } from 'src/utils/constants'
import PlotPlantRemeasureHeader from 'src/components/monitoringPlot/PlotPlantRemeasureHeader'
import { History, SampleTree } from 'src/types/interface/slice.interface'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import OutlinedTextInput from 'src/components/common/OutlinedTextInput'
import PlaceHolderSwitch from 'src/components/common/PlaceHolderSwitch'
import { BACKDROP_COLOR, WHITE } from 'src/utils/constants/colors'
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
import { DBHInMeter, meterToFoot, nonISUCountries } from 'src/utils/constants/appConstant'
import { getConvertedDiameter, getConvertedHeight } from 'src/utils/constants/measurements'
import i18next from 'i18next'
import { measurementValidation } from 'src/utils/constants/measurementValidation'
import AlertModal from 'src/components/common/AlertModal'
import DeleteModal from 'src/components/common/DeleteModal'
import getUserLocation from 'src/utils/helpers/getUserLocation'
import { point } from '@turf/helpers';
import distance from '@turf/distance';


const PredefineReasons: Array<{
    label: string
    value: TREE_RE_STATUS
    index: number
}> = [
        {
            label: 'Drought',
            value: 'drought',
            index: 0,
        },
        {
            label: 'Fire',
            value: 'fire',
            index: 1,
        },
        {
            label: "Flood",
            value: 'flood',
            index: 2,
        },
        {
            label: 'Other',
            value: 'other',
            index: 3,
        }
    ]



const TreeRemeasurementView = () => {
    const [treeDetails, setTreeDetails] = useState<SampleTree | null>(null)
    const [height, setHeight] = useState('')
    const [width, setWidth] = useState('')
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const { addPlantHistory, checkAndUpdatePlantHistory, EditHistory } = useInterventionManagement()
    const route = useRoute<RouteProp<RootStackParamList, 'TreeRemeasurement'>>()
    const [isAlive, setIsAlive] = useState(true)
    const [comment, setComment] = useState('')
    const imageDetails = useSelector((state: RootState) => state.cameraState)
    const [imageId, setImageId] = useState('')
    const [loading, setLoading] = useState(false)
    const toast = useToast()
    const interventionId = route.params?.interventionId ?? "";
    const treeId = route.params?.treeId ?? '';
    const isEdit = route.params?.isEdit ?? false;
    const historyID = route.params?.historyId ?? '';
    const [type, setType] = useState<DropdownData>(PredefineReasons[0])
    const realm = useRealm()
    const [imageUri, setImageUri] = useState('')
    const [heightErrorMessage, setHeightErrorMessage] = useState('')
    const [showOptimalAlert, setShowOptimalAlert] = useState(false)
    const [widthErrorMessage, setWidthErrorMessage] = useState('')
    const [diameterLabel, setDiameterLabel] = useState<string>(
        i18next.t('label.measurement_basal_diameter'),
    );
    const Country = useSelector((state: RootState) => state.userState.country)
    const isNonISUCountry = nonISUCountries.includes(Country)
    const [showSkipModal, setShowSkipModal] = useState(false)
    const [showAccuracyModal, setShowAccuracyModal] = useState(false)
    useEffect(() => {
        if (treeId) {
            const treeData = realm.objectForPrimaryKey<SampleTree>(RealmSchema.TreeDetail, treeId);
            if (treeData) {
                setTreeDetails(treeData)
                setIsAlive(treeData.is_alive)
                if (isEdit) {
                    setImageUri(treeData.image_url)
                }
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

    function isWithinRange(currentLat, currentLng, targetLat, targetLng, range = 20) {
        // Create point features for the current location and the target location
        const currentLocation = point([currentLng, currentLat]);
        const targetLocation = point([targetLng, targetLat]);

        // Calculate the distance between the two points in meters
        const distanceInMeters = distance(currentLocation, targetLocation, { units: 'meters' });

        // Check if the distance is within the specified range
        return distanceInMeters <= range;
    }

    const handleSkip = async () => {
        setShowSkipModal(false)
        const { lat, long } = getUserLocation()
        const isWithin20m = isWithinRange(lat, long, treeDetails.latitude, treeDetails.longitude)
        const param: History = {
            history_id: uuid(),
            eventName: 'skip',
            eventDate: Date.now(),
            imageUrl: imageUri,
            cdnImageUrl: '',
            diameter: isAlive ? getConvertedDiameter(
                width,
                isNonISUCountry,
            ) : treeDetails.specie_diameter,
            height: isAlive ? getConvertedHeight(
                height,
                isNonISUCountry,
            ) : treeDetails.specie_height,
            appMetadata: '',
            status: isAlive ? '' : 'dead',
            statusReason: type.value,
            dataStatus: 'SKIP_REMEASUREMENT',
            parentId: treeId,
            samplePlantLocationIndex: 0,
            lastScreen: '',
            additionalDetails: [
                {
                    key: 'comment',
                    value: comment,
                    accessType: 'public',
                },
                {
                    key: 'deviceLocation',
                    value: JSON.stringify({
                        "coordinates": [long, lat],
                        "type": "Point"
                    }),
                    accessType: 'app',
                },
                {
                    key: 'withinRange',
                    value: String(isWithin20m),
                    accessType: 'private',
                }
            ]
        }
        const result = await addPlantHistory(treeId, param, true)
        if (result) {
            await checkAndUpdatePlantHistory(interventionId)
            setTimeout(() => {
                navigation.replace('InterventionPreview', { id: 'preview', intervention: interventionId, sampleTree: treeId, interventionId: interventionId })
            }, 300);
        } else {
            toast.show("Error occurred")
        }
    }


    const handleHeightChange = (text: string) => {
        setHeightErrorMessage('');
        const regex = /^(?!0*(\.0+)?$)(\d+(\.\d+)?|\.\d+)$/;
        const isValid = regex.test(text)
        // Ensure there is at most one decimal point
        if (isValid) {
            setHeight(text);
            const convertedHeight = height ? getConvertedHeight(text, isNonISUCountry) : 0;
            if (convertedHeight < DBHInMeter) {
                setDiameterLabel(i18next.t('label.measurement_basal_diameter'));
            } else {
                setDiameterLabel(i18next.t('label.measurement_DBH'));
            }
        } else {
            setHeightErrorMessage('Please provide the correct height.')
        }
    };

    const handleDiameterChange = (text: string) => {
        setWidthErrorMessage('');
        const regex = /^(?!0*(\.0+)?$)(\d+(\.\d+)?|\.\d+)$/;
        const isValid = regex.test(text)
        if (isValid) {
            setWidth(text);
        } else {
            setWidthErrorMessage('Please provide the correct diameter.')
        }
        // Ensure there is at most one decimal point

    };

    const takePicture = () => {
        const newID = uuid()
        setImageId(newID)
        setLoading(false)
        navigation.navigate('TakePicture', {
            id: newID,
            screen: 'REMEASUREMENT_IMAGE',
        })
    }


    const getConvertedMeasurementText = (measurement: any): string => {
        const isNonISUCountry: boolean = nonISUCountries.includes(Country);
        if (measurement && isNonISUCountry) {
            return `${Math.round(Number(measurement) * 1000) / 1000}`;
        }
        return String(measurement);
    };

    const validateData = () => {
        setLoading(true)
        if (!isAlive) {
            submitHandler()
            return;
        }
        if (isAlive && imageUri.length == 0) {
            takePicture()
            return
        }

        const finalHeight = height || treeDetails.specie_height
        const finalWidth = height || treeDetails.specie_diameter

        const validationObject = measurementValidation(finalHeight, finalWidth, isNonISUCountry);
        const { diameterErrorMessage, heightErrorMessage, isRatioCorrect } = validationObject;
        setHeightErrorMessage(heightErrorMessage)
        setWidthErrorMessage(diameterErrorMessage)
        if (!diameterErrorMessage && !heightErrorMessage) {
            if (isRatioCorrect) {
                submitHandler()
            } else {
                setShowOptimalAlert(true);
            }
        }
    }

    const finalResult = async (param: History) => {
        if (isEdit) {
            return await EditHistory(historyID, treeId, param)
        } else {
            return await addPlantHistory(treeId, param)
        }
    }

    const statusCapture = () => {
        return isAlive ? "REMEASUREMENT_DATA_UPLOAD" : "REMEASUREMENT_EVENT_UPDATE"
    }

    const submitHandler = async (gpsValidated?: boolean) => {
        const finalHeight = height || treeDetails.specie_height
        const finalWidth = height || treeDetails.specie_diameter
        const { lat, long } = getUserLocation()
        const isWithin20m = isWithinRange(lat, long, treeDetails.latitude, treeDetails.longitude)

        if (!gpsValidated && !isWithin20m) {
            setShowAccuracyModal(true)
            return
        }

        const param: History = {
            history_id: uuid(),
            eventName: isAlive ? 'measurement' : 'status',
            eventDate: Date.now(),
            imageUrl: imageUri,
            cdnImageUrl: '',
            diameter: isAlive ? getConvertedDiameter(
                finalWidth,
                isNonISUCountry,
            ) : treeDetails.specie_diameter,
            height: isAlive ? getConvertedHeight(
                finalHeight,
                isNonISUCountry,
            ) : treeDetails.specie_height,
            appMetadata: '',
            status: isAlive ? '' : 'dead',
            statusReason: type.value,
            dataStatus: statusCapture(),
            parentId: treeId,
            samplePlantLocationIndex: 0,
            lastScreen: '',
            additionalDetails: [
                {
                    key: 'comment',
                    value: comment,
                    accessType: 'public',
                },
                {
                    key: 'deviceLocation',
                    value: JSON.stringify({
                        "coordinates": [long, lat],
                        "type": "Point"
                    }),
                    accessType: 'app',
                },
                {
                    key: 'withinRange',
                    value: String(isWithin20m),
                    accessType: 'private',
                }
            ]
        }
        const result = await finalResult(param)
        if (result) {
            setTimeout(async () => {
                await checkAndUpdatePlantHistory(interventionId)
            }, 300);
            setTimeout(() => {
                navigation.replace('InterventionPreview', { id: 'preview', intervention: interventionId, sampleTree: treeId, interventionId: interventionId })
            }, 1000);
        } else {
            setLoading(false)
            toast.show("Error occurred")
        }
    }

    const handleOptimalAlert = (p: boolean) => {
        if (p) {
            setShowOptimalAlert(false)
            setLoading(false)
        } else {
            setShowOptimalAlert(false)
            setTimeout(() => {
                submitHandler()
            }, 1000)
        }
    }

    if (!treeDetails) {
        return null
    }

    const imageURL = () => imageUri.length == 0 ? "Continue" : "Save"


    const handleAccuracyAlert = (b: boolean) => {
        if (b) {
            setShowAccuracyModal(false)
            setLoading(false)
        } else {
            setShowAccuracyModal(false)
            setTimeout(() => {
                submitHandler(true)
            }, (300));
        }
    }



    return (
        <SafeAreaView style={styles.container}>
            <PlotPlantRemeasureHeader tree label={treeDetails.hid} type={'RECRUIT'} species={treeDetails.specie_name} showRemeasure={true} />
            <DeleteModal isVisible={showSkipModal} toggleModal={() => { setShowSkipModal(false) }} removeFavSpecie={handleSkip} headerLabel={"Skip Remeasurement"} noteLabel={"Do you wish to skip remeasurement of the sample tree."} primeLabel={'Skip'} secondaryLabel={'Cancel'} extra={null} />
            <ScrollView>
                <AvoidSoftInputView
                    avoidOffset={20}
                    showAnimationDuration={200}
                    style={styles.container}>
                    <View style={styles.wrapper}>
                        <PlaceHolderSwitch
                            description={'This tree is still alive'}
                            selectHandler={setIsAlive}
                            value={isAlive}
                        />
                        {isAlive ? <>
                            {!!imageUri && <View style={styles.imageWrapper}><View style={styles.imageContainer}>
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
                                    placeholder={i18next.t('label.select_species_height')}
                                    changeHandler={handleHeightChange}
                                    autoFocus
                                    keyboardType={'decimal-pad'}
                                    defaultValue={getConvertedMeasurementText(treeDetails.specie_height)}
                                    trailingText={isNonISUCountry ? i18next.t('label.select_species_feet') : 'm'}
                                    errMsg={heightErrorMessage} />
                            </View>
                            <View style={styles.inputWrapper}>
                                <OutlinedTextInput
                                    placeholder={diameterLabel}
                                    changeHandler={handleDiameterChange}
                                    keyboardType={'decimal-pad'}
                                    defaultValue={getConvertedMeasurementText(treeDetails.specie_diameter)}
                                    trailingText={isNonISUCountry ? i18next.t('label.select_species_inches') : 'cm'}
                                    errMsg={widthErrorMessage}
                                    info={i18next.t('label.measurement_diameter_info', {
                                        height: isNonISUCountry
                                            ? Math.round(DBHInMeter * meterToFoot * 1000) / 1000
                                            : DBHInMeter,
                                        unit: isNonISUCountry ? i18next.t('label.select_species_inches') : 'm',
                                    })}
                                />
                                <OutlinedTextInput
                                    placeholder={'Comments(Optional)'}
                                    changeHandler={setComment}
                                    keyboardType={'default'}
                                    defaultValue={comment}
                                    trailingText={''} errMsg={''} />
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
                                        keyboardType={'default'}
                                        defaultValue={width}
                                        trailingText={''} errMsg={''} />
                                </View></>
                        }
                        <View style={styles.footer} />
                    </View>
                    <AlertModal
                        showSecondaryButton
                        visible={showOptimalAlert}
                        onPressPrimaryBtn={handleOptimalAlert}
                        onPressSecondaryBtn={handleOptimalAlert}
                        heading={i18next.t('label.not_optimal_ratio')}
                        secondaryBtnText={i18next.t('label.continue')}
                        primaryBtnText={i18next.t('label.check_again')}
                        message={i18next.t('label.not_optimal_ratio_message')}
                    />
                </AvoidSoftInputView>
            </ScrollView>
            <View style={styles.mainWrapper}>
                {treeDetails.remeasurement_requires && <CustomButton
                    label={'Skip'}
                    containerStyle={styles.btnContainer}
                    wrapperStyle={styles.skipButtonContainer}
                    labelStyle={styles.skipText}
                    pressHandler={() => { setShowSkipModal(true) }}
                />}
                <CustomButton
                    label={!isAlive ? "Save" : imageURL()}
                    containerStyle={styles.btnContainer}
                    pressHandler={validateData}
                    loading={loading}
                    disable={loading}
                />
            </View>
            <AlertModal
                visible={showAccuracyModal}
                heading={"Location Warning"}
                message={"Your device is more than 20 meters away from the tree you are remeasuring. Do you still want to submit the data?"}
                primaryBtnText={'cancel'}
                secondaryBtnText={'Continue'}
                onPressPrimaryBtn={handleAccuracyAlert}
                onPressSecondaryBtn={handleAccuracyAlert}
                showSecondaryButton={true}
            />
        </SafeAreaView>
    )
}

export default TreeRemeasurementView

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: WHITE,
    },
    mainCOntainer: {
        flex: 1,
        backgroundColor: 'red'
    },
    inputWrapper: {
        width: '95%',
    },
    footer: {
        width: "100%",
        height: 100,
    },
    wrapper: {
        backgroundColor: BACKDROP_COLOR,
        flex: 1,
        alignItems: 'center',
        paddingTop: 20,
    },
    mainWrapper: {
        width: '100%',
        flexDirection: 'row',
        position: 'absolute',
        bottom: 30,
        height: 80,
    },
    skipButtonContainer: {
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Colors.NEW_PRIMARY
    },
    skipText: {
        color: Colors.NEW_PRIMARY,
        fontSize: 18,
        fontFamily: Typography.FONT_FAMILY_REGULAR
    },
    btnContainer: {
        flex: 1,
        height: 70,
    },
    btnMinorContainer: {
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