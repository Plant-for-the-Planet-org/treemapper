import { ScrollView, StyleSheet, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Header from 'src/components/common/Header'
import { Colors } from 'src/utils/constants'
import CustomButton from 'src/components/common/CustomButton'
import OutlinedTextInput from 'src/components/common/OutlinedTextInput'
import PlaceHolderSwitch from 'src/components/common/PlaceHolderSwitch'
import InterventionDatePicker from 'src/components/formBuilder/InterventionDatePicker'
import { IScientificSpecies } from 'src/types/interface/app.interface'
import StaticOutlineInput from 'src/components/formBuilder/StaticOutlineInput'
import PlantPlotListModal from 'src/components/monitoringPlot/PlotSpeciesList'
import { MonitoringPlot, PlantTimeLine, PlantedPlotSpecies } from 'src/types/interface/slice.interface'
import useMonitoringPlotManagement from 'src/hooks/realm/useMonitoringPlotManagement'
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { generateUniquePlotId } from 'src/utils/helpers/monitoringPlotHelper/monitoringRealmHelper'
import { StackNavigationProp } from '@react-navigation/stack'
import { useToast } from 'react-native-toast-notifications'
import { validateNumber } from 'src/utils/helpers/formHelper/validationHelper'
import { AvoidSoftInput, AvoidSoftInputView } from 'react-native-avoid-softinput'
import { RealmSchema } from 'src/types/enum/db.enum'
import { useRealm } from '@realm/react'
import { scaleSize, scaleFont } from 'src/utils/constants/mixins'
import i18next from 'src/locales/index'
import CustomDatePicker from 'src/components/common/CustomDatePicker'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
import { DBHInMeter, meterToFoot, nonISUCountries } from 'src/utils/constants/appConstant'
import { getConvertedHeight } from 'src/utils/constants/measurements'
import { measurementValidation } from 'src/utils/constants/measurementValidation'
import AlertModal from 'src/components/common/AlertModal'

const AddPlantDetailsPlotView = () => {
    const route = useRoute<RouteProp<RootStackParamList, 'AddPlantDetailsPlot'>>()
    const plotID = route.params?.id ?? '';
    const plantId = route.params?.plantId ?? '';
    const isEdit = route.params?.isEdit ?? false;
    const [isPlanted, setIsPlanted] = useState(true)
    const [measurementDate, setMeasurementDate] = useState(Date.now())
    const [species, setSpecies] = useState<IScientificSpecies | null>(null)
    const [height, setHeight] = useState('')
    const [width, setWidth] = useState('')
    const [isTreeAlive, setIsTreeAlive] = useState(true)
    const [plantingDate, setPlantingDate] = useState(Date.now())
    const [tag, setTag] = useState('')
    const [pickerSelected, setPickerSelected] = useState('none')
    const [speciesModal, setSpeciesModal] = useState(false)
    const { addPlantDetailsPlot, updatePlotPlatDetails, deletePlantDetails } = useMonitoringPlotManagement()
    const Country = useSelector((state: RootState) => state.userState.country)
    const [isNonISUCountry, setIsNonISUCountry] = useState(false);
    const [showOptimalAlert, setShowOptimalAlert] = useState(false)


    const [diameterLabel, setDiameterLabel] = useState<string>(
        i18next.t('label.measurement_basal_diameter'),
    );
    const [heightErrorMessage, setHeightErrorMessage] = useState('')
    const [widthErrorMessage, setWidthErrorMessage] = useState('')


    const acceptOptimalAlert = () => {
        setShowOptimalAlert(false)
    }

    const rejectOptimalAlert = () => {
        setShowOptimalAlert(false)
        setTimeout(() => {
            submitHandler(true)
        }, 1000);
    }

    const toggleSpeciesModal = () => {
        setSpeciesModal(!speciesModal)
    }
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const toast = useToast()

    const getSpeciesNames = () => {
        if (!species) {
            return 'Select Species';
        }

        const aliases = species.aliases.length > 0 ? species.aliases : ''; // Convert array to comma-separated string
        const scientificName = species.scientificName;

        return `${aliases} (${scientificName})`.trim(); // Use trim() to remove any leading/trailing spaces
    };
    const realm = useRealm()

    useEffect(() => {
        setCountry();
        // This should be run when screen gains focus - enable the module where it's needed
        AvoidSoftInput.setShouldMimicIOSBehavior(true);
        return () => {
            // This should be run when screen loses focus - disable the module where it's not needed, to make a cleanup
            AvoidSoftInput.setShouldMimicIOSBehavior(false);
        };
    }, [])

    useEffect(() => {
        if (isEdit) {
            getPlantDetails()
        }
    }, [isEdit])

    const setCountry = () => {
        setIsNonISUCountry(nonISUCountries.includes(Country));
    };


    const togglePicker = (type: string) => {
        setPickerSelected(type)
    }

    const updateDetails = async () => {
        if (!species) {
            toast.show("Please select a species")
            return
        }
        const params = {
            type: isPlanted ? 'PLANTED' : 'RECRUIT',
            tag: tag,
            species: {
                guid: species.guid,
                scientificName: species.scientificName,
                aliases: species.aliases,
            },
        }
        const result = await updatePlotPlatDetails(plotID, plantId, params)
        if (result) {
            toast.show("Details updated successfully")
            navigation.goBack()
        } else {
            toast.show("Error occurred")
        }
    }
    const deleteHandler = async () => {
        const result = await deletePlantDetails(plotID, plantId)
        if (result) {
            toast.show("Plant deleted")
            navigation.pop(2);
        } else {
            toast.show("Error occurred")
        }
    }

    const getPlantDetails = () => {
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, plotID);
        const plantData = plotData.plot_plants.find(el => el.plot_plant_id === plantId)
        if (plantData) {
            const speciesData: IScientificSpecies = {
                guid: plantData.guid,
                scientificName: plantData.scientificName,
                isUserSpecies: false,
                aliases: plantData.aliases,
                specieId: ''
            }
            setSpecies(speciesData)
            setTag(plantData.tag)
            setIsPlanted(plantData.type === 'PLANTED')
        }
    }



    const handleHeightChange = (text: string) => {
        setHeightErrorMessage('');
        const regex = /^(?!0*(\.0+)?$)(\d+(\.\d+)?|\.\d+)$/;
        const finalText = text.replace(/,/g, '.');
        const isValid = regex.test(finalText)
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
        const finalText = text.replace(/,/g, '.');
        const isValid = regex.test(finalText)
        if (isValid) {
            setWidth(text);
        } else {
            setWidthErrorMessage('Please provide the correct diameter.')
        }
        // Ensure there is at most one decimal point
    };




    const submitHandler = async (ignoreValidation?: boolean) => {
        const updatedWidth = width.replace(/,/g, '.');
        const updatedHeight = height.replace(/,/g, '.');
        if (isTreeAlive) {
            const validWidth = validateNumber(updatedWidth, 'width', 'width')
            const validHeight = validateNumber(updatedHeight, 'height', 'height')
            if (validHeight.hasError) {
                toast.show(validHeight.errorMessage)
                return null
            }
            if (validWidth.hasError) {
                toast.show(validWidth.errorMessage)
                return null
            }
            if (!species) {
                toast.show("Please select a species")
                return null
            }
        }
        const checkIsPlanted = () => {
            return isPlanted ? 'PLANTED' : 'RECRUIT'
        }

        if (!ignoreValidation) {
            const validationObject = measurementValidation(updatedHeight, updatedWidth, isNonISUCountry);
            const { diameterErrorMessage, heightErrorMessage, isRatioCorrect } = validationObject;
            setHeightErrorMessage(heightErrorMessage)
            setWidthErrorMessage(diameterErrorMessage)
            if (heightErrorMessage.length > 0 || diameterErrorMessage.length > 0) {
                return null
            }
            if (isRatioCorrect) {
                setShowOptimalAlert(true);
                return null
            }
        }

        const plantTimeline: PlantTimeLine = {
            status: !isTreeAlive ? 'DECEASED' : checkIsPlanted(),
            length: Number(updatedHeight),
            width: Number(updatedWidth),
            date: measurementDate,
            length_unit: 'm',
            width_unit: 'cm',
            image: '',
            timeline_id: generateUniquePlotId()
        }
        const plantDetails: PlantedPlotSpecies = {
            plot_plant_id: generateUniquePlotId(),
            tag: tag,
            guid: species.guid,
            scientificName: species.scientificName,
            aliases: species.aliases,
            count: 1,
            image: species.image,
            timeline: [plantTimeline],
            planting_date: plantingDate,
            is_alive: isTreeAlive,
            type: isPlanted ? 'PLANTED' : 'RECRUIT',
            details_updated_at: Date.now(),
            latitude: 0,
            longitude: 0,
        }
        await addPlantDetailsPlot(plotID, plantDetails)
        navigation.replace('CreatePlotMap', { id: plotID, plantId: plantDetails.plot_plant_id, markLocation: true })
    }

    const handleDateSelection = (d: number) => {
        if (pickerSelected === 'plantingDate') {
            setPlantingDate(d)
        }

        if (pickerSelected === 'measurementDate') {
            setMeasurementDate(d)
        }
        setPickerSelected('none')
    }

    return (
        <SafeAreaView style={styles.container}>
            <Header label='Add Plant' />
            {pickerSelected !== 'none' && <CustomDatePicker cb={handleDateSelection}
                selectedData={pickerSelected === 'plantingDate' ? plantingDate : measurementDate}
            />}
            <ScrollView>
                <AvoidSoftInputView
                    avoidOffset={20}
                    showAnimationDuration={200}
                    style={styles.container}>
                    <PlantPlotListModal isVisible={speciesModal} toggleModal={toggleSpeciesModal} setSpecies={setSpecies} />
                    <View style={styles.wrapper}>
                        <PlaceHolderSwitch
                            description={i18next.t('label.tree_planted')}
                            selectHandler={setIsPlanted}
                            value={isPlanted}
                            infoText={i18next.t('label.tree_planted_note')}
                            showInfoIcon={true}
                        />
                        {!isEdit && <InterventionDatePicker
                            placeHolder={i18next.t('label.measurement_date')}
                            value={measurementDate}
                            showPicker={() => { togglePicker('measurementDate') }}
                        />}
                        <StaticOutlineInput placeHolder={i18next.t('label.species')} value={getSpeciesNames()} callBack={toggleSpeciesModal} />
                        {!isEdit && <>
                            <View style={styles.inputWrapper}>
                                <OutlinedTextInput
                                    placeholder={i18next.t('label.select_species_height')}
                                    changeHandler={handleHeightChange}
                                    autoFocus
                                    keyboardType={'decimal-pad'}
                                    trailingText={isNonISUCountry ? i18next.t('label.select_species_feet') : 'm'}
                                    errMsg={heightErrorMessage} />
                            </View>
                            <View style={styles.inputWrapper}>
                                <OutlinedTextInput
                                    placeholder={diameterLabel}
                                    changeHandler={handleDiameterChange}
                                    keyboardType={'decimal-pad'}
                                    trailingText={isNonISUCountry ? i18next.t('label.select_species_inches') : 'cm'}
                                    errMsg={widthErrorMessage}
                                    info={i18next.t('label.measurement_diameter_info', {
                                        height: isNonISUCountry
                                            ? Math.round(DBHInMeter * meterToFoot * 1000) / 1000
                                            : DBHInMeter,
                                        unit: isNonISUCountry ? i18next.t('label.select_species_inches') : 'm',
                                    })}
                                />
                            </View>
                            <PlaceHolderSwitch
                                description={i18next.t('label.tree_alive')}
                                selectHandler={setIsTreeAlive}
                                value={isTreeAlive}
                            />
                            <InterventionDatePicker
                                placeHolder={i18next.t('label.planting_date')}
                                value={plantingDate}
                                showPicker={() => { togglePicker('plantingDate') }}
                            />
                        </>}

                        <View style={styles.inputWrapper}>
                            <OutlinedTextInput
                                placeholder={i18next.t('label.tag')}
                                changeHandler={setTag}
                                keyboardType={'default'}
                                defaultValue={tag}
                                trailingText={''} errMsg={''} />
                        </View>
                    </View>
                </AvoidSoftInputView>
            </ScrollView>
            {isEdit ?
                <View style={styles.btnMinorContainer}>
                    <CustomButton
                        label={'Delete'}
                        containerStyle={styles.btnWrapper}
                        pressHandler={deleteHandler}
                        wrapperStyle={styles.borderWrapper}
                        labelStyle={styles.highlightLabel}
                        hideFadeIn
                    />
                    <CustomButton
                        label={'Save'}
                        containerStyle={styles.btnWrapper}
                        pressHandler={updateDetails}
                        wrapperStyle={styles.noBorderWrapper}
                        hideFadeIn
                    />
                </View> :
                <CustomButton
                    label="Save and Continue"
                    containerStyle={styles.btnContainer}
                    pressHandler={() => { submitHandler(false) }}
                    hideFadeIn
                />}
            <AlertModal
                showSecondaryButton
                visible={showOptimalAlert}
                onPressPrimaryBtn={acceptOptimalAlert}
                onPressSecondaryBtn={rejectOptimalAlert}
                heading={i18next.t('label.not_optimal_ratio')}
                secondaryBtnText={i18next.t('label.continue')}
                primaryBtnText={i18next.t('label.check_again')}
                message={i18next.t('label.not_optimal_ratio_message')}
            />
        </SafeAreaView>
    )
}

export default AddPlantDetailsPlotView

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: '100%',
        backgroundColor: Colors.WHITE
    },
    scrollWrapper: {
        backgroundColor: Colors.BACKDROP_COLOR,
    },
    wrapper: {
        flex: 1,
        backgroundColor: Colors.BACKDROP_COLOR,
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 140
    },
    inputWrapper: {
        width: '95%'
    },
    btnContainer: {
        width: '100%',
        height: 70,
        position: 'absolute',
        bottom: 30,
    },
    dropDownWrapper: {
        width: '98%',
        justifyContent: "center",
        alignItems: 'center'
    },
    staticInputContainer: {
        width: '92%',
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 8,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        backgroundColor: Colors.WHITE
    },
    btnMinorContainer: {
        width: '100%',
        height: scaleSize(70),
        flexDirection: 'row',
        alignItems: 'center',
        position: 'absolute',
        bottom: 30,
        justifyContent: 'center'
    },
    btnWrapper: {
        width: '48%',
    },
    imageContainer: {
        width: '100%',
        height: '100%',
    },
    borderWrapper: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 5,
        width: '90%',
        height: '80%',
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'tomato'
    },
    noBorderWrapper: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 5,
        width: '90%',
        height: '80%',
        backgroundColor: Colors.PRIMARY_DARK,
        borderRadius: 12,
    },
    opaqueWrapper: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 5,
        width: '90%',
        height: '70%',
        backgroundColor: Colors.PRIMARY_DARK,
        borderRadius: 10,
    },
    highlightLabel: {
        fontSize: scaleFont(16),
        fontWeight: '400',
        color: 'tomato'
    },
    normalLabel: {
        fontSize: scaleFont(14),
        fontWeight: '400',
        color: Colors.WHITE,
        textAlign: 'center',
    },
})