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
import useMonitoringPlotMangement from 'src/hooks/realm/useMonitoringPlotMangement'
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

const AddPlantDetailsPlotView = () => {
    const route = useRoute<RouteProp<RootStackParamList, 'AddPlantDetailsPlot'>>()
    const plotID = route.params && route.params.id ? route.params.id : ''
    const plantId = route.params && route.params.plantId ? route.params.plantId : ''
    const isEdit = route.params && route.params.isEdit ? route.params.isEdit : false
    const [isPlanted, setIsPlanted] = useState(true)
    const [mesaurmentDate, setIsMeasurmentDate] = useState(Date.now())
    const [species, setSpecies] = useState<IScientificSpecies | null>(null)
    const [height, setHeight] = useState('')
    const [width, setWidth] = useState('')
    const [isTreeAlive, setIsTreeAlive] = useState(true)
    const [plantingDate, setPlantingDate] = useState(Date.now())
    const [tag, setTag] = useState('')
    const [speciesModal, setShowSpeciesModal] = useState(false)
    const { addPlantDetailsPlot, updatePlotPlatDetails, deltePlantDetails } = useMonitoringPlotMangement()
    const toogleSpeciesModal = () => {
        setShowSpeciesModal(!speciesModal)
    }
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const toast = useToast()

    const getSpeciesNames = () => {
        return species ? `${species.aliases.length > 0 ? species.aliases : ''}  ${species.scientificName}` : 'Select Species'
    }
    const realm = useRealm()

    useEffect(() => {
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
        const result = await deltePlantDetails(plotID, plantId)
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
            }
            setSpecies(speciesData)
            setTag(plantData.tag)
            setIsPlanted(plantData.type === 'PLANTED')
        }
    }


    const submitHandler = async () => {
        const validWidth = validateNumber(width, 'width', 'width')
        const validHeight = validateNumber(height, 'height', 'height')
        if (validHeight.hasError) {
            toast.show(validHeight.errorMessage)
            return
        }
        if (validWidth.hasError) {
            toast.show(validWidth.errorMessage)
            return
        }
        if (!species) {
            toast.show("Please select a species")
            return
        }
        // if (tag.trim().length === 0) {
        //     toast.show("Please add valid Tag")
        //     return
        // }
        const plantTimeline: PlantTimeLine = {
            status: !isTreeAlive ? 'DESCEASED' : isPlanted ? 'PLANTED' : 'RECRUIT',
            length: Number(height),
            width: Number(width),
            date: mesaurmentDate,
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


    return (
        <SafeAreaView style={styles.container}>
            <Header label='Add Plant' />
            <AvoidSoftInputView
                avoidOffset={20}
                style={styles.container}>
                <ScrollView>
                    <PlantPlotListModal isVisible={speciesModal} toogleModal={toogleSpeciesModal} setSpecies={setSpecies} />
                    <View style={styles.wrapper}>
                        <PlaceHolderSwitch
                            description={i18next.t('label.tree_planted')}
                            selectHandler={setIsPlanted}
                            value={isPlanted}
                            infoText={i18next.t('label.tree_planted_note')}
                            showInfoIcon={true}
                        />
                        {!isEdit && <InterventionDatePicker
                            placeHolder={i18next.t('label.measurment_date')}
                            value={mesaurmentDate}
                            callBack={setIsMeasurmentDate}
                        />}
                        <StaticOutlineInput placeHolder={i18next.t('label.species')} value={getSpeciesNames()} callBack={toogleSpeciesModal} />
                        {!isEdit && <>
                            <View style={styles.inputWrapper}>
                                <OutlinedTextInput
                                    placeholder={i18next.t('label.height')}
                                    changeHandler={setHeight}
                                    keyboardType={'decimal-pad'}
                                    trailingtext={'m'} errMsg={''} />
                            </View>
                            <View style={styles.inputWrapper}>
                                <OutlinedTextInput
                                    placeholder={i18next.t('label.diameter')}
                                    changeHandler={setWidth}
                                    keyboardType={'decimal-pad'}
                                    trailingtext={'cm'} errMsg={''} />
                            </View>
                            <PlaceHolderSwitch
                                description={i18next.t('label.tree_alive')}
                                selectHandler={setIsTreeAlive}
                                value={isTreeAlive}
                            />
                            <InterventionDatePicker
                                placeHolder={i18next.t('label.planting_date')}
                                value={plantingDate}
                                callBack={setPlantingDate}
                            />
                        </>}

                        <View style={styles.inputWrapper}>
                            <OutlinedTextInput
                                placeholder={i18next.t('label.tag')}
                                changeHandler={setTag}
                                keyboardType={'default'}
                                defaultValue={tag}
                                trailingtext={''} errMsg={''} />
                        </View>
                    </View>
                </ScrollView>
            </AvoidSoftInputView>
            {isEdit ?
                <View style={styles.btnContainedr}>
                    <CustomButton
                        label={'Delete'}
                        containerStyle={styles.btnWrapper}
                        pressHandler={deleteHandler}
                        wrapperStyle={styles.borderWrapper}
                        labelStyle={styles.highlightLabel}
                        hideFadein
                    />
                    <CustomButton
                        label={'Save'}
                        containerStyle={styles.btnWrapper}
                        pressHandler={updateDetails}
                        wrapperStyle={styles.noBorderWrapper}
                        hideFadein
                    />
                </View> :
                <CustomButton
                    label="Save and Continue"
                    containerStyle={styles.btnContainer}
                    pressHandler={submitHandler}
                    hideFadein
                />}
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
        bottom: 20,
    },
    dropDownWrappper: {
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
    btnContainedr: {
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
        widht: '100%',
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
    normalLable: {
        fontSize: scaleFont(14),
        fontWeight: '400',
        color: Colors.WHITE,
        textAlign: 'center',
    },
})