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
import { DBHInMeter, meterToFoot, nonISUCountries } from 'src/utils/constants/appConstant'
import { getConvertedDiameter, getConvertedHeight } from 'src/utils/constants/measurements'
import i18next from 'i18next'
import { measurementValidation } from 'src/utils/constants/measurementValidation'
import AlertModal from 'src/components/common/AlertModal'

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
    const [heightErrorMessage, setHeightErrorMessage] = useState('')
    const [showOptimalAlert, setShowOptimalAlert] = useState(false)
    const [widthErrorMessage, setWidthErrorMessage] = useState('')
    const [diameterLabel, setDiameterLabel] = useState<string>(
        i18next.t('label.measurement_basal_diameter'),
    );
    const Country = useSelector((state: RootState) => state.userState.country)
    const isNonISUCountry = nonISUCountries.includes(Country)

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




    const handleHeightChange = (text: string) => {
        setHeightErrorMessage('');
        // Replace commas with dots for consistency
        const sanitizedText = text.replace(/,/g, '.');

        // Allow only digits and a single decimal point
        const validHeight = sanitizedText.replace(/[^0-9.]/g, '');

        // Ensure there is at most one decimal point
        const decimalCount = validHeight.split('.').length - 1;
        if (decimalCount <= 1) {
            setHeight(validHeight);
            const convertedHeight = height ? getConvertedHeight(validHeight, isNonISUCountry) : 0;
            if (convertedHeight < DBHInMeter) {
                setDiameterLabel(i18next.t('label.measurement_basal_diameter'));
            } else {
                setDiameterLabel(i18next.t('label.measurement_DBH'));
            }
        }
    };

    const handleDiameterChange = (text: string) => {
        setWidthErrorMessage('');
        // Replace commas with dots for consistency
        const sanitizedText = text.replace(/,/g, '.');

        // Allow only digits and a single decimal point
        const validDiameter = sanitizedText.replace(/[^0-9.]/g, '');

        // Ensure there is at most one decimal point
        const decimalCount = validDiameter.split('.').length - 1;
        if (decimalCount <= 1) {
            setWidth(validDiameter);
        }
    };



    const takePicture = () => {
        const newID = String(new Date().getTime())
        setImageId(newID)
        navigation.navigate('TakePicture', {
            id: newID,
            screen: 'REMEASUREMENT_IMAGE',
        })
    }


    const getConvertedMeasurementText = (measurement: any, unit: 'cm' | 'm' = 'cm'): string => {
        let text = i18next.t('label.tree_review_unable');
        const isNonISUCountry: boolean = nonISUCountries.includes(Country);

        if (measurement && isNonISUCountry) {
            text = ` ${Math.round(Number(measurement) * 1000) / 1000} ${i18next.t(
                unit === 'cm' ? 'label.select_species_inches' : 'label.select_species_feet',
            )} `;
        } else if (measurement) {
            text = ` ${Math.round(Number(measurement) * 1000) / 1000} ${unit} `;
        }
        return text;
    };

    const validateData = () => {
        if (isAlive && imageUri.length == 0) {
            takePicture()
            return
        }
        if (height === '') {
            toast.show("Please update plant height")
            return
        }
        if (width === '') {
            toast.show("Please update plant diameter")
            return
        }
        const validationObject = measurementValidation(height, width, isNonISUCountry);
        const { diameterErrorMessage, heightErrorMessage, isRatioCorrect } = validationObject;
        setHeightErrorMessage(heightErrorMessage)
        setWidthErrorMessage(diameterErrorMessage)
        if (!diameterErrorMessage && !heightErrorMessage) {
            if (isRatioCorrect) {
                submitHandler();
            } else {
                setShowOptimalAlert(true);
            }
        }
    }


    const submitHandler = async () => {
        const param: History = {
            history_id: uuid(),
            eventName: isAlive ? 'measurement' : 'status',
            eventDate: Date.now(),
            imageUrl: imageUri,
            cdnImageUrl: '',
            diameter: getConvertedDiameter(
                width,
                isNonISUCountry,
            ),
            height: getConvertedHeight(
                height,
                isNonISUCountry,
            ),
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

    const handleOptimalAlert = (p: boolean) => {
        if (p) {
            setShowOptimalAlert(false)
        } else {
            setShowOptimalAlert(false)
            submitHandler();
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
                                    defaultValue={getConvertedMeasurementText(treeDetails.specie_height, 'm')}
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
                                        trailingText={''} errMsg={''} />
                                </View></>
                        }
                    </View>
                </ScrollView>
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
                <CustomButton
                    label={!isAlive ? "Save" : imageURL()}
                    containerStyle={styles.btnContainer}
                    pressHandler={validateData}
                    hideFadeIn
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