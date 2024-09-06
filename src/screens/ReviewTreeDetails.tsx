import { KeyboardType, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
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
import { convertDateToTimestamp, timestampToBasicDate } from 'src/utils/helpers/appHelper/dataAndTimeHelper'
import CustomButton from 'src/components/common/CustomButton'
import UnSyncIcon from 'assets/images/svg/UnSyncIcon.svg';
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
import DeleteIcon from 'assets/images/svg/BinIcon.svg'
import DeleteModal from 'src/components/common/DeleteModal'

import RemeasurementIconScalable from 'assets/images/svg/RemeasurementIconScalable.svg'
import PlantHistory from './PlantHistoryView'
import SyncIcon from 'assets/images/svg/CloudSyncIcon.svg';
import { ctaHaptic } from 'src/utils/helpers/hapticFeedbackHelper'


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
    const { updateSampleTreeDetails, deleteSampleTreeIntervention } = useInterventionManagement()
    const detailsCompleted = route.params?.detailsCompleted;
    const editTree = route.params?.interventionID
    const deleteTree = route.params?.deleteTree
    const synced = route.params?.synced;
    const { country, type } = useSelector((state: RootState) => state.userState)
    const Country = country
    const [isError, setIsError] = useState<boolean>(false);
    const [showInputError, setShowInputError] = useState<boolean>(false);
    const [openEditModal, setOpenEditModal] = useState<{ label: EditLabels, value: string, type: KeyboardType, open: boolean }>({ label: '', value: '', type: 'default', open: false })
    const dispatch = useDispatch();
    const [inputErrorMessage, setInputErrorMessage] = useState<string>(
        i18next.t('label.tree_inventory_input_error_message'),
    );
    const [showDeleteTree, setShowDeleteTree] = useState(false)


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
        navigation.replace('PointMarker', { id: interventionId })
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
            navigation.replace('PointMarker', { id: interventionId })
        }
    }

    const openEdit = (label: EditLabels, currentValue: string, type: KeyboardType) => {
        if (label === 'species') {
            if (Intervention.has_sample_trees) {
                navigation.navigate('TotalTrees', { isSelectSpecies: false, interventionId: Intervention.intervention_id, isEditTrees: false, treeId: treeDetails.tree_id })
            } else {
                navigation.replace('ManageSpecies', { 'manageSpecies': false, 'reviewTreeSpecies': treeDetails.tree_id, id: Intervention.intervention_id })
            }
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

    const moveToHome = () => {
        navigation.popToTop()
        //@ts-expect-error Extra params
        navigation.navigate('Home', {
            screen: 'Map'
        });
    }

    const rightContainer = () => {
        if (treeDetails.status === 'SYNCED') {
            return <View style={styles.deleteContainer}>
                <TouchableOpacity style={styles.rightWrapper}>
                    <SyncIcon width={25} height={25} fill={Colors.TEXT_COLOR} />
                    <Text style={[styles.rightLabel, { color: Colors.NEW_PRIMARY }]}>Synced</Text>
                </TouchableOpacity>
            </View>
        }
        return <View style={styles.deleteContainer}>
            <TouchableOpacity style={styles.rightWrapper} onPress={moveToHome}>
                <UnSyncIcon width={25} height={25} fill={Colors.TEXT_COLOR} />
                <Text style={[styles.rightLabel, { color: Colors.TEXT_COLOR }]}>Sync</Text>
            </TouchableOpacity>
        </View>
    }


    const renderDeceasedText = () => {
        if (deleteTree) {
            return <View style={styles.deleteContainer}>
                <TouchableOpacity style={styles.deleteWrapper} onPress={() => { setShowDeleteTree(true) }}>
                    <Text style={styles.deleteLabel}>{i18next.t("label.delete")}</Text>
                    <DeleteIcon width={15} height={15} fill={Colors.TEXT_COLOR} />
                </TouchableOpacity>
            </View>
        }

        if (treeDetails.status === 'INITIALIZED') {
            return null
        }
        if (treeDetails.tree_type === 'single') {
            return null
        }

        return rightContainer()
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

    const deleteTreeData = async () => {
        await deleteSampleTreeIntervention(treeDetails.tree_id, interventionId)
        navigation.goBack()
    }

    const addNewRemeasurement = () => {
        ctaHaptic()
        navigation.replace('TreeRemeasurement', {
            interventionId: treeDetails.intervention_id,
            treeId: treeDetails.sloc_id
        }
        )
    }

    return (
        <SafeAreaView style={styles.container}>
            {type === 'tpo' && treeDetails.tree_type !== 'single' && treeDetails.status === 'SYNCED' && treeDetails.is_alive ? <TouchableOpacity style={styles.floatingIcon} onPress={addNewRemeasurement}>
                <RemeasurementIconScalable />
                <Text style={styles.measureLabel}>Measure</Text>
            </TouchableOpacity> : null}
            <DeleteModal isVisible={showDeleteTree} toggleModal={() => { setShowDeleteTree(false) }} removeFavSpecie={deleteTreeData} headerLabel={i18next.t("label.delete_intervention")} noteLabel={i18next.t("label.delete_note")} primeLabel={i18next.t("label.delete")} secondaryLabel={'Cancel'} extra={null} />
            {showDatePicker && <View style={styles.datePickerContainer}><DateTimePicker
                maximumDate={new Date()}
                minimumDate={new Date(2006, 0, 1)}
                is24Hour={true}
                value={new Date(treeDetails.plantation_date)} onChange={onDateSelect} display='spinner' /></View>}
            <Header label={headerLabel} rightComponent={renderDeceasedText()} />
            <ScrollView>
                <View style={styles.container}>
                    <InterventionCoverImage
                        image={treeDetails.image_url || treeDetails.cdn_image_url} interventionID={treeDetails.intervention_id} tag={'EDIT_SAMPLE_TREE'} treeId={treeDetails.tree_id} isCDN={treeDetails.cdn_image_url.length > 0}
                        isLegacy={Intervention.is_legacy}
                        showEdit={!synced || treeDetails.status === 'PENDING_TREE_IMAGE' || !editTree} />
                    <View style={styles.metaWrapper}>
                        <Text style={styles.title}>{i18next.t('label.species')}</Text>
                        <Pressable style={styles.metaSectionWrapper} onPress={() => {
                            if (Intervention.status!=='INITIALIZED' || Intervention.has_sample_trees) {
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
                    <View style={styles.mainMetaWrapper}>
                        <View style={styles.sectionWrapper}>
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
                        <View style={styles.sectionWrapper}>
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
                    </View>

                    <View style={styles.mainMetaWrapper}>
                        <View style={styles.sectionWrapper}>
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
                        <View style={styles.sectionWrapper}>
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
                <Text style={styles.historyLabel}>Plant Timeline</Text>
                <PlantHistory plantID={treeDetails.tree_id} />
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
    },
    measureLabel: {
        fontSize: 12,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,

    },
    floatingIcon: {
        width: 80,
        height: 80,
        position: 'absolute',
        backgroundColor: Colors.BACKDROP_COLOR,
        bottom: 50,
        zIndex: 1,
        right: 30,
        borderWidth: 0.5,
        borderRadius: 100,
        borderColor: '#f2ebdd',
        shadowColor: Colors.GRAY_TEXT,
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 2,
        justifyContent: 'center',
        alignItems: "center"
    },
    mainMetaWrapper: {
        width: '100%',
        flexDirection: 'row',
        marginBottom: 10,
        marginLeft: 20,
        paddingVertical: 5,
    },
    sectionWrapper: {
        flex: 1
    },
    metaWrapper: {
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
        fontSize: 14,
        color: Colors.TEXT_COLOR,
    },
    header: {
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        fontSize: 18,
        color: Colors.TEXT_COLOR,
        marginLeft: 20,
        marginTop: 10,
        marginBottom: 10
    },
    historyLabel: {
        width: "100%",
        fontSize: 16,
        fontFamily: Typography.FONT_FAMILY_BOLD,
        marginLeft: 20,
        color: Colors.TEXT_COLOR
    },
    valueLabel: {
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: 16,
        color: Colors.TEXT_COLOR,
    },
    speciesName: {
        fontFamily: Typography.FONT_FAMILY_ITALIC,
        fontSize: 16,
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
        height: 70,
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
        marginRight: '5%',
        paddingHorizontal: 10,
        paddingVertical: 10,
        backgroundColor: Colors.BACKDROP_COLOR,
        borderRadius: 12,
        flexDirection: 'row',
    },
    deceasedLabel: {
        color: Colors.NEW_PRIMARY,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        fontSize: 12,
        paddingLeft: 10
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
        fontSize: 16,
        fontWeight: '400',
        color: Colors.PRIMARY_DARK,
    },
    normalLabel: {
        fontSize: 14,
        fontWeight: '400',
        color: Colors.WHITE,
        textAlign: 'center',
    },
    deleteContainer: {
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: '5%'
    },
    deleteWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: Colors.GRAY_LIGHT,
        flexDirection: 'row'
    },
    deleteLabel: {
        fontFamily: Typography.FONT_FAMILY_BOLD,
        color: Colors.TEXT_COLOR,
        paddingRight: 10,
    },
    rightWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 10,
        backgroundColor: Colors.BACKDROP_COLOR,
        flexDirection: 'row'
    },
    rightLabel: {
        fontFamily: Typography.FONT_FAMILY_BOLD,
        color: Colors.TEXT_COLOR,
        paddingRight: 10,
        marginLeft: 10
    }
})