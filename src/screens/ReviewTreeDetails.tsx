import { KeyboardType, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import DateTimePicker from '@react-native-community/datetimepicker'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { updateBoundary, updateSingleTreeDetails } from 'src/store/slice/sampleTreeSlice'
import { InterventionData, SampleTree, SampleTreeSlice } from 'src/types/interface/slice.interface'
import { makeInterventionGeoJson } from 'src/utils/helpers/interventionFormHelper'
import bbox from '@turf/bbox'
import { updateMapBounds } from 'src/store/slice/mapBoundSlice'
import Header from 'src/components/common/Header'
import InterventionCoverImage from 'src/components/previewIntervention/InterventionCoverImage'
import { Typography, Colors } from 'src/utils/constants'
import { scaleFont, scaleSize } from 'src/utils/constants/mixins'
import { convertDateToTimestamp, timestampToBasicDate } from 'src/utils/helpers/appHelper/dataAndTimeHelper'
import CustomButton from 'src/components/common/CustomButton'
import WidthIcon from 'assets/images/svg/WidthIcon.svg'
import HeightIcon from 'assets/images/svg/HeightIcon.svg'
import { SafeAreaView } from 'react-native-safe-area-context'
import ExportGeoJSONButton from 'src/components/intervention/ExportGeoJSON'
import EditInputModal from 'src/components/intervention/EditInputModal'
import PenIcon from 'assets/images/svg/PenIcon.svg'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import { RealmSchema } from 'src/types/enum/db.enum'
import { useObject } from '@realm/react'
import { setUpIntervention } from 'src/utils/helpers/formHelper/selectIntervention'
import { v4 as uuid } from 'uuid'
import i18next from 'src/locales/index'
import { nonISUCountries } from 'src/utils/constants/appConstant'
import { RootState } from 'src/store'
import { measurementValidation } from 'src/utils/constants/measurementValidation'
import AlertModal from 'src/components/common/AlertModal'


type EditLabels = 'height' | 'diameter' | 'treetag' | '' | 'species' | 'date'


const ReviewTreeDetails = () => {
    const route = useRoute<RouteProp<RootStackParamList, 'ReviewTreeDetails'>>()
    const interventionId = route.params?.id ?? '';
    const Intervention = useObject<InterventionData>(
        RealmSchema.Intervention, interventionId
    )
    const [showIncorrectRatioAlert, setShowIncorrectRatioAlert] = useState<boolean>(false);
    const FormData = setUpIntervention(Intervention.intervention_key)
    const [treeDetails, setTreeDetails] = useState<SampleTree>(null)
    const currentTreeIndex = Intervention.sample_trees.length
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const [showDatePicker, setShowDatePicker] = useState(false)
    const { updateSampleTreeDetails } = useInterventionManagement()
    const detailsCompleted = route.params?.detailsCompleted;
    const editTree = route.params?.interventionID
    const synced = route.params?.synced;
    const Country = useSelector((state: RootState) => state.userState.country)
    const [isError, setIsError] = useState<boolean>(false);
    const [showInputError, setShowInputError] = useState<boolean>(false);
    const [openEditModal, setOpenEditModal] = useState<{ label: EditLabels, value: string, type: KeyboardType, open: boolean }>({ label: '', value: '', type: 'default', open: false })
    const dispatch = useDispatch();
    const [inputErrorMessage, setInputErrorMessage] = useState<string>(
        i18next.t('label.tree_inventory_input_error_message'),
    );




    useEffect(() => {
        if (!editTree) {
            if (detailsCompleted) {
                if (!FormData.has_sample_trees && FormData.form_details.length === 0) {
                    navigation.replace('LocalForm', { id: interventionId })
                } else if (FormData.form_details.length > 0) {
                    navigation.replace('LocalForm', { id: interventionId })
                } else {
                    setTreeDetails(Intervention.sample_trees[currentTreeIndex - 1])
                }
            } else {
                setupTreeDetailsFlow()
            }
        }
    }, [detailsCompleted])


    useEffect(() => {
        if (editTree) {
            const filterData = Intervention.sample_trees.filter(el => el.tree_id === route.params.interventionID)
            setTreeDetails(filterData[0])
        }
    }, [interventionId])




    const nextTreeButton = () => {
        navigation.replace('LocalForm', { id: interventionId })
    }


    const addAnotherTree = () => {
        const { geoJSON } = makeInterventionGeoJson("Polygon", JSON.parse(Intervention.location.coordinates), Intervention.form_id)
        const bounds = bbox(geoJSON)
        dispatch(updateBoundary({ coord: JSON.parse(Intervention.location.coordinates), id: uuid(), form_ID: Intervention.form_id, }))
        dispatch(updateMapBounds({ bounds: bounds, key: 'POINT_MAP' }))
        navigation.navigate('PointMarker', { id: interventionId })
    }

    const setupTreeDetailsFlow = () => {
        if (!FormData.has_sample_trees) {
            const speciesDetails = JSON.parse(JSON.stringify(Intervention.planted_species[0]))
            const treeDetailsFlow: SampleTreeSlice = {
                form_id: Intervention.form_id,
                tree_id: uuid(),
                sample_tree_count: 1,
                boundary: JSON.parse(Intervention.location.coordinates),
                coordinates: JSON.parse(Intervention.location.coordinates),
                image_url: '',
                current_species: speciesDetails,
            }
            dispatch(updateSingleTreeDetails(treeDetailsFlow))
            const newID = String(new Date().getTime())
            navigation.replace('TakePicture', { id: newID, screen: 'SAMPLE_TREE' })
        } else {
            const { geoJSON } = makeInterventionGeoJson("Polygon", JSON.parse(Intervention.location.coordinates), Intervention.form_id)
            const bounds = bbox(geoJSON)
            dispatch(updateBoundary({ coord: JSON.parse(Intervention.location.coordinates), id: uuid(), form_ID: Intervention.form_id, }))
            dispatch(updateMapBounds({ bounds: bounds, key: 'POINT_MAP' }))
            navigation.navigate('PointMarker', { id: interventionId })
        }
    }

    const openEdit = (label: EditLabels, currentValue: string, type: KeyboardType) => {
        if (label === 'species') {
            navigation.navigate('ManageSpecies', { 'manageSpecies': false, 'reviewTreeSpecies': treeDetails.tree_id, id: Intervention.intervention_id })
            return;
        }
        if (label === 'date') {
            setShowDatePicker(true)
            return;
        }
        setOpenEditModal({ label, value: currentValue, type, open: true });
    }

    const handleValidation = async (validate?: boolean) => {
        const finalDetails = { ...treeDetails }
        const isNonISUCountry = nonISUCountries.includes(Country);
        let hasError = false;

        const handleHeightValidation = () => {
            const regex = /^(?!0*(\.0+)?$)(\d+(\.\d+)?|\.\d+)$/;
            const isValid = regex.test(openEditModal.value)
            if (isValid) {
                const validationObject = measurementValidation(
                    openEditModal.value,
                    treeDetails.specie_diameter,
                    isNonISUCountry,
                );
                setInputErrorMessage(validationObject.heightErrorMessage);
                setShowInputError(!!validationObject.heightErrorMessage);
                hasError = validationObject.heightErrorMessage.length > 0
                if (!hasError) {
                    if (validate && !validationObject.isRatioCorrect) {
                        setShowIncorrectRatioAlert(true);
                        hasError = true
                    } else {
                        finalDetails.specie_height = Number(openEditModal.value)
                    }
                }
            } else {
                setInputErrorMessage("Please input correct height");
                setShowInputError(true);
                hasError = true
            }
        };

        const handleDiameterValidation = () => {
            const regex = /^(?!0*(\.0+)?$)(\d+(\.\d+)?|\.\d+)$/;
            const isValid = regex.test(openEditModal.value)
            if (isValid) {
                const validationObject = measurementValidation(
                    treeDetails.specie_height,
                    openEditModal.value,
                    isNonISUCountry,
                );
                setInputErrorMessage(validationObject.diameterErrorMessage);
                setShowInputError(!!validationObject.diameterErrorMessage);
                hasError = validationObject.diameterErrorMessage.length > 0
                if (!hasError) {
                    if (!validationObject.isRatioCorrect && validate) {
                        setShowIncorrectRatioAlert(true);
                        hasError = true
                    } else {
                        finalDetails.specie_diameter = Number(openEditModal.value)
                    }
                }
            } else {
                setInputErrorMessage("Please input correct diameter");
                setShowInputError(true);
                hasError = true
            }
            return false;
        };

        const handleTagValidation = () => {
            const regex = /[^a-zA-Z0-9]/g;
            const isValidId = regex.test(openEditModal.value)
            if (isValidId) {
                setInputErrorMessage("Please input a valid TagId");
                setShowInputError(true);
                return false
            }
            finalDetails.tag_id = openEditModal.value;
            return true
        };

        switch (openEditModal.label) {
            case 'height':
                if (!validate) {
                    finalDetails.specie_height = Number(openEditModal.value)
                } else {
                    handleHeightValidation()
                }
                break;
            case 'diameter':
                if (!validate) {
                    finalDetails.specie_diameter = Number(openEditModal.value)
                } else {
                    handleDiameterValidation()
                }
                break;
            case 'treetag':
                handleTagValidation();
                break;
            default:
                break;
        }
        if (!hasError) {
            await updateSampleTreeDetails(finalDetails)
            setTreeDetails({ ...finalDetails })
        }
        setOpenEditModal((prev) => ({ ...prev, open: false }));
    };



    const setCurrentValue = (d: any) => {
        setOpenEditModal({ ...openEditModal, value: d })
    }

    const onDateSelect = async (_event, date: Date) => {
        const finalDetails = { ...treeDetails }
        setShowDatePicker(false)
        finalDetails.plantation_date = convertDateToTimestamp(date)
        await updateSampleTreeDetails(finalDetails)
        setTreeDetails({ ...finalDetails })
    }

    const renderDeceasedText = () => {
        if (treeDetails.is_alive) {
            return null
        }
        return <View style={styles.rightContainer}>
            <Text style={styles.deceasedLabel}>{i18next.t('label.marked_deceased')}</Text>
        </View>
    }

    if (!treeDetails) {
        return null
    }
    const headerLabel = editTree ? i18next.t("label.tree_details") : i18next.t("label.review_tree_details")
    const showEdit = editTree || treeDetails.tree_id

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

    const handleRatioPrimary = () => {
        setShowIncorrectRatioAlert(false);
        setOpenEditModal({ label: '', value: '', type: 'default', open: false });
    }

    const handleRatioSecondary = () => {
        setShowIncorrectRatioAlert(false);
        handleValidation(false)
    }

    const handleErrorPrimary = () => {
        setIsError(false);
        setShowInputError(false);
    }

    return (
        <SafeAreaView style={styles.container}>
            {showDatePicker && <View style={styles.datePickerContainer}><DateTimePicker
                maximumDate={new Date()}
                minimumDate={new Date(2006, 0, 1)}
                is24Hour={true}
                value={new Date(treeDetails.plantation_date)} onChange={onDateSelect} display='spinner' /></View>}
            <Header label={headerLabel} rightComponent={renderDeceasedText()} />
            <ScrollView>
                <View style={styles.container}>
                    <InterventionCoverImage image={treeDetails.image_url || treeDetails.cdn_image_url} interventionID={treeDetails.intervention_id} tag={'EDIT_SAMPLE_TREE'} treeId={treeDetails.tree_id} isCDN={treeDetails.cdn_image_url.length > 0} />
                    <View style={styles.metaWrapper}>
                        <Text style={styles.title}>{i18next.t('label.species')}</Text>
                        <Pressable style={styles.metaSectionWrapper} onPress={() => {
                            if (!!editTree && synced && !Intervention.has_sample_trees) {
                                return
                            }
                            openEdit('species', String(treeDetails.specie_height), 'number-pad')
                        }}>
                            <Text style={styles.speciesName}>
                                {treeDetails.specie_name}
                            </Text>
                            {!!editTree && !synced && !Intervention.has_sample_trees ? <PenIcon style={styles.editIconWrapper} /> : null}
                        </Pressable>
                    </View>
                    <View style={styles.metaWrapper}>
                        <Text style={styles.title}>{i18next.t('label.height')}</Text>
                        <Pressable style={styles.metaSectionWrapper} onPress={() => {
                            if (showEdit && synced) {
                                return
                            }
                            openEdit('height', String(treeDetails.specie_height), 'decimal-pad')
                        }}>
                            <HeightIcon width={14} height={20} style={styles.iconWrapper} />
                            <Text style={styles.valueLabel}>
                                {getConvertedMeasurementText(treeDetails.specie_height, 'm')}
                            </Text>
                            {showEdit && !synced ? <PenIcon style={styles.editIconWrapper} /> : null}
                        </Pressable>
                    </View>
                    <View style={styles.metaWrapper}>
                        <Text style={styles.title}>{i18next.t('label.width')}</Text>
                        <Pressable style={styles.metaSectionWrapper} onPress={() => {
                            if (showEdit && synced) {
                                return
                            }
                            openEdit('diameter', String(treeDetails.specie_diameter), 'decimal-pad')
                        }}>
                            <WidthIcon width={18} height={8} style={styles.iconWrapper} />
                            <Text style={styles.valueLabel}>
                                {getConvertedMeasurementText(treeDetails.specie_diameter)}
                            </Text>
                            {showEdit && !synced ? <PenIcon style={styles.editIconWrapper} /> : null}
                        </Pressable>
                    </View>
                    <View style={styles.metaWrapper}>
                        <Text style={styles.title}>{i18next.t("label.plantation_date")}</Text>
                        <Pressable style={styles.metaSectionWrapper} onPress={() => {
                            if (showEdit && synced) {
                                return
                            }
                            openEdit('date', String(treeDetails.specie_height), 'number-pad')
                        }}>
                            <Text style={styles.valueLabel}>
                                {timestampToBasicDate(treeDetails.plantation_date)}
                            </Text>
                            {showEdit && !synced ? <PenIcon style={styles.editIconWrapper} /> : null}
                        </Pressable>
                    </View>
                    <View style={styles.metaWrapper}>
                        <Text style={styles.title}>{i18next.t('label.tree_tag')}</Text>
                        <Pressable style={styles.metaSectionWrapper} onPress={() => {
                            if (showEdit && synced) {
                                return
                            }
                            openEdit('treetag', String(treeDetails.tag_id), 'default')
                        }}>
                            <Text style={styles.valueLabel}>
                                {treeDetails.tag_id || 'Not Tagged'}
                            </Text>
                            {showEdit && !synced ? <PenIcon style={styles.editIconWrapper} /> : null}
                        </Pressable>
                    </View>
                    <View style={styles.metaWrapper}>
                        <Text style={styles.title}>{i18next.t('label.location')}</Text>
                        <View style={styles.metaSectionWrapper}>
                            <Text style={styles.valueLabel}>
                                {treeDetails.longitude.toFixed(5)} , {treeDetails.latitude.toFixed(5)}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.header}>{i18next.t('label.additional_data')}</Text>
                    <View style={styles.metaWrapper}>
                        <Text style={styles.title}>{i18next.t('label.device_location')}</Text>
                        <View style={styles.metaSectionWrapper}>
                            <Text style={styles.valueLabel}>
                                {treeDetails.device_longitude} , {treeDetails.device_latitude}
                            </Text>
                        </View>
                    </View>
                </View>
                <ExportGeoJSONButton details={treeDetails} type='treedetails' />
                <View style={styles.footer} />
            </ScrollView >
            {!editTree && <View style={styles.btnContainer}>
                <CustomButton
                    label={i18next.t("label.add_sample_tree")}
                    containerStyle={styles.btnWrapper}
                    pressHandler={addAnotherTree}
                    wrapperStyle={styles.borderWrapper}
                    labelStyle={styles.highlightLabel}
                />
                <CustomButton
                    label={i18next.t("label.continue")}
                    containerStyle={styles.btnWrapper}
                    pressHandler={nextTreeButton}
                    wrapperStyle={styles.noBorderWrapper}
                />
            </View>}
            <EditInputModal value={openEditModal.value} setValue={setCurrentValue} onSubmitInputField={handleValidation} isOpenModal={openEditModal.open} inputType={openEditModal.type} />
            <AlertModal
                visible={showInputError || isError}
                heading={
                    isError
                        ? i18next.t('label.something_went_wrong')
                        : i18next.t('label.tree_inventory_input_error')
                }
                message={isError ? i18next.t('label.error_saving_inventory') : inputErrorMessage}
                primaryBtnText={i18next.t('label.ok')}
                onPressPrimaryBtn={handleErrorPrimary}
            />
            <AlertModal
                visible={showIncorrectRatioAlert}
                heading={i18next.t('label.not_optimal_ratio')}
                message={i18next.t('label.not_optimal_ratio_message')}
                primaryBtnText={i18next.t('label.check_again')}
                onPressPrimaryBtn={handleRatioPrimary}
                showSecondaryButton
                secondaryBtnText={i18next.t('label.continue')}
                onPressSecondaryBtn={handleRatioSecondary}
            />
        </SafeAreaView >
    )
}

export default ReviewTreeDetails

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.WHITE
    }, metaWrapper: {
        width: '100%',
        paddingVertical: 5,
        marginBottom: 10,
        marginLeft: 20,
    },
    datePickerContainer: {
        position: "absolute",
        zIndex: 1,
        backgroundColor: '#fff',
        width: "100%",
        bottom: 0
    },
    metaSectionWrapper: {
        width: '100%',
        height: 40,
        flexDirection: 'row',
        alignItems: 'center'
    },
    title: {
        fontFamily: Typography.FONT_FAMILY_BOLD,
        fontSize: scaleSize(14),
        color: Colors.TEXT_COLOR,
    },
    header: {
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        fontSize: scaleSize(18),
        color: Colors.TEXT_COLOR,
        marginLeft: 20,
        marginTop: 10,
        marginBottom: 10
    },
    valueLabel: {
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: scaleSize(16),
        color: Colors.TEXT_COLOR,
    },
    speciesName: {
        fontFamily: Typography.FONT_FAMILY_ITALIC,
        fontSize: scaleSize(16),
        color: Colors.TEXT_COLOR,
    },
    iconWrapper: {
        marginRight: 10
    },
    footer: {
        width: '100%',
        height: 100
    },
    editIconWrapper: {
        marginLeft: 10,
        marginTop: 10
    },
    btnContainer: {
        width: '96%',
        height: scaleSize(70),
        flexDirection: 'row',
        alignItems: 'center',
        position: 'absolute',
        bottom: 30,
        marginHorizontal: '2%',
        justifyContent: 'center'
    },
    btnWrapper: {
        flex: 1,
        width: '90%',
    },
    rightContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        paddingHorizontal: 10,
        paddingVertical: 10,
        backgroundColor: Colors.GRAY_BACKDROP,
        borderRadius: 12
    },
    deceasedLabel: {
        color: Colors.WHITE,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        fontSize: 12,
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
        borderColor: Colors.PRIMARY_DARK,
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
        color: Colors.PRIMARY_DARK,
    },
    normalLabel: {
        fontSize: scaleFont(14),
        fontWeight: '400',
        color: Colors.WHITE,
        textAlign: 'center',
    },
})