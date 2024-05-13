import { KeyboardType, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/store'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import DateTimePicker from '@react-native-community/datetimepicker'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { updateBoundry, updateSingleTreeDetails } from 'src/store/slice/sampleTreeSlice'
import { SampleTree, SampleTreeSlice } from 'src/types/interface/slice.interface'
import { useRealm } from '@realm/react'
import { IScientificSpecies } from 'src/types/interface/app.interface'
import { RealmSchema } from 'src/types/enum/db.enum'
import { makeInterventionGeoJson } from 'src/utils/helpers/interventionFormHelper'
import bbox from '@turf/bbox'
import { updateMapBounds } from 'src/store/slice/mapBoundSlice'
import Header from 'src/components/common/Header'
import IterventionCoverImage from 'src/components/previewIntervention/IterventionCoverImage'
import { Typography, Colors } from 'src/utils/constants'
import { scaleSize } from 'src/utils/constants/mixins'
import { convertDateToTimestamp, timestampToBasicDate } from 'src/utils/helpers/appHelper/dataAndTimeHelper'
import CustomButton from 'src/components/common/CustomButton'
import WidthIcon from 'assets/images/svg/WidthIcon.svg'
import HeightIcon from 'assets/images/svg/HeightIcon.svg'
import { SafeAreaView } from 'react-native-safe-area-context'
import ExportGeoJSONButton from 'src/components/intervention/ExportGeoJSON'
import EditInputModal from 'src/components/intervention/EditInputModal'
import PenIcon from 'assets/images/svg/PenIcon.svg'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import { updateLastUpdatedAt } from 'src/store/slice/interventionSlice'
import { updateSampleTreeReviewTree } from 'src/store/slice/registerFormSlice'


type EditLabels = 'height' | 'diameter' | 'treetag' | '' | 'sepcies' | 'date'


const ReviewTreeDetails = () => {
    const FormData = useSelector((state: RootState) => state.formFlowState)
    const SampleTreeSliceData = useSelector((state: RootState) => state.sampleTree)
    const [treeDetails, setTreeDetails] = useState<SampleTree>(null)
    const totalSampleTress = SampleTreeSliceData.sample_tree_count
    const currentTreeIndex = FormData.tree_details.length
    const allSampleTreeRegisterd = currentTreeIndex !== totalSampleTress
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const [showDatePicker, setDatePicker] = useState(false)
    const { updateSampleTreeDetails } = useInterventionManagement()
    const InterventionData = useSelector(
        (state: RootState) => state.interventionState,
    )
    const route = useRoute<RouteProp<RootStackParamList, 'ReviewTreeDetails'>>()
    const detailsCompleted = route.params && route.params.detailsCompleted
    const editTree = route.params && route.params.interventionID
    const synced = route.params && route.params.synced

    const [openEditModal, setEditModal] = useState<{ label: EditLabels, value: string, type: KeyboardType, open: boolean }>({ label: '', value: '', type: 'default', open: false })
    const dispatch = useDispatch();
    const realm = useRealm()

    useEffect(() => {
        if (!editTree) {
            if (detailsCompleted) {
                if (!FormData.has_sample_trees && FormData.form_details.length === 0) {
                    navigation.replace('InterventionPreview', { id: 'review', intervention: '' })
                } else if (FormData.form_details.length > 0) {
                    navigation.replace('LocalForm')
                } else {
                    setTreeDetails(FormData.tree_details[currentTreeIndex - 1])
                }
            } else {
                setupTreeDetailsFlow()
            }
        }
    }, [detailsCompleted])






    useEffect(() => {
        if (editTree) {
            const filterdData = InterventionData.sample_trees.filter(el => el.tree_id === route.params.interventionID)
            setTreeDetails(filterdData[0])
        }
    }, [InterventionData])




    const nextTreeButton = () => {
        if (allSampleTreeRegisterd) {
            navigation.navigate('PointMarker')
        } else {
            navigation.replace('InterventionPreview', { id: 'review', intervention: '' })
        }
    }


    const setupTreeDetailsFlow = () => {
        if (!FormData.has_sample_trees) {
            const speciesDetails = realm.objectForPrimaryKey<IScientificSpecies>(
                RealmSchema.ScientificSpecies,
                FormData.species[0],
            )
            const treeDetailsFlow: SampleTreeSlice = {
                form_id: FormData.form_id,
                species: [{
                    info: { ...JSON.parse(JSON.stringify(speciesDetails)) },
                    count: 1
                }],
                sample_tree_count: 1,
                move_next_primary: '',
                move_next_secondary: '',
                boundry: [FormData.coordinates[0]],
                coordinates: [FormData.coordinates[0]],
                image_url: '',
                current_species: FormData.species[0],
            }
            dispatch(updateSingleTreeDetails(treeDetailsFlow))
            const newID = String(new Date().getTime())
            navigation.replace('TakePicture', { id: newID, screen: 'SAMPLE_TREE' })
        } else {
            const { geoJSON } = makeInterventionGeoJson("Polygon", FormData.coordinates, FormData.form_id)
            const bounds = bbox(geoJSON)
            dispatch(updateBoundry({ coord: FormData.coordinates, id: FormData.form_id }))
            dispatch(updateMapBounds({ bodunds: bounds, key: 'POINT_MAP' }))
            navigation.navigate('PointMarker')
        }
    }

    const openEdit = (label: EditLabels, currentValue: string, type: KeyboardType) => {
        if (label === 'sepcies') {
            navigation.navigate('ManageSpecies', { 'manageSpecies': false, 'reviewTreeSpecies': treeDetails.tree_id })
            return;
        }
        if (label === 'date') {
            setDatePicker(true)
            return;
        }
        setEditModal({ label, value: currentValue, type, open: true });
    }


    const closeModal = async () => {
        const finalDetails = { ...treeDetails }
        if (openEditModal.label === 'height') {
            finalDetails.specie_height = Number(openEditModal.value)
        }
        if (openEditModal.label === 'diameter') {
            finalDetails.specie_diameter = Number(openEditModal.value)
        }
        if (openEditModal.label === 'treetag') {
            finalDetails.tag_id = openEditModal.value
        }
        if (editTree) {
            await updateSampleTreeDetails(finalDetails)
            dispatch(updateLastUpdatedAt())
        } else {
            dispatch(updateSampleTreeReviewTree(treeDetails))
        }
        setTreeDetails({ ...finalDetails })

        setEditModal({ label: '', value: '', type: 'default', open: false });
    }


    const setCurrentValue = (d: any) => {
        setEditModal({ ...openEditModal, value: d })
    }

    const onDateSelect = async (_event, date: Date) => {
        console.log("ASck",date)
        const finalDetails = { ...treeDetails }
        setDatePicker(false)
        finalDetails.plantation_date = convertDateToTimestamp(date)
        if (editTree) {
            await updateSampleTreeDetails(finalDetails)
            dispatch(updateLastUpdatedAt())
        } else {
            dispatch(updateSampleTreeReviewTree(treeDetails))
        }

        setTreeDetails({ ...finalDetails })
    }


    if (!treeDetails) {
        return null
    }
    const headerLabel = editTree ? "Tree Details" : `Review of Tree ${currentTreeIndex} of ${totalSampleTress}`
    const showEdit = editTree || treeDetails.tree_id
    return (
        <SafeAreaView style={styles.container}>
            {showDatePicker && <View style={styles.datePickerContainer}><DateTimePicker value={new Date(treeDetails.plantation_date)} onChange={onDateSelect} display='spinner'/></View>}
            <ScrollView>
                <View style={styles.container}>
                    <Header label={headerLabel} />
                    <IterventionCoverImage image={treeDetails.image_url || treeDetails.cdn_image_url} interventionID={treeDetails.intervention_id} tag={'EDIT_SAMPLE_TREE'} isRegistered={false} treeId={treeDetails.tree_id} isCDN={treeDetails.cdn_image_url.length ? true : false}  />
                    <View style={styles.metaWrapper}>
                        <Text style={styles.title}>Species</Text>
                        <Pressable style={styles.metaSectionWrapper} onPress={() => {
                            openEdit('sepcies', String(treeDetails.specie_height), 'number-pad')
                        }}>
                            <Text style={styles.speciesName}>
                                {treeDetails.specie_name}
                            </Text>
                            {editTree && !synced? <PenIcon style={styles.editIconWrapper} /> : null}
                        </Pressable>
                    </View>
                    <View style={styles.metaWrapper}>
                        <Text style={styles.title}>Height</Text>
                        <Pressable style={styles.metaSectionWrapper} onPress={() => {
                            openEdit('height', String(treeDetails.specie_height), 'number-pad')
                        }}>
                            <HeightIcon width={20} height={20} style={styles.iconwrapper} />
                            <Text style={styles.valueLable}>
                                {treeDetails.specie_height}
                            </Text>
                            {showEdit && !synced? <PenIcon style={styles.editIconWrapper} /> : null}
                        </Pressable>
                    </View>
                    <View style={styles.metaWrapper}>
                        <Text style={styles.title}>Width</Text>
                        <Pressable style={styles.metaSectionWrapper} onPress={() => {
                            openEdit('diameter', String(treeDetails.specie_diameter), 'number-pad')
                        }}>
                            <WidthIcon width={20} height={20} style={styles.iconwrapper} />
                            <Text style={styles.valueLable}>
                                {treeDetails.specie_diameter}
                            </Text>
                            {showEdit && !synced? <PenIcon style={styles.editIconWrapper} /> : null}
                        </Pressable>
                    </View>
                    <View style={styles.metaWrapper}>
                        <Text style={styles.title}>Plantation Date</Text>
                        <Pressable style={styles.metaSectionWrapper} onPress={() => {
                            openEdit('date', String(treeDetails.specie_height), 'number-pad')
                        }}>
                            <Text style={styles.valueLable}>
                                {timestampToBasicDate(treeDetails.plantation_date)}
                            </Text>
                            {showEdit && !synced? <PenIcon style={styles.editIconWrapper} /> : null}
                        </Pressable>
                    </View>
                    <View style={styles.metaWrapper}>
                        <Text style={styles.title}>Tree Tag</Text>
                        <Pressable style={styles.metaSectionWrapper} onPress={() => {
                            openEdit('treetag', String(treeDetails.tag_id), 'default')
                        }}>
                            <Text style={styles.valueLable}>
                                {treeDetails.tag_id || 'Not Tagged'}
                            </Text>
                            {showEdit && !synced? <PenIcon style={styles.editIconWrapper} /> : null}
                        </Pressable>
                    </View>
                    <View style={styles.metaWrapper}>
                        <Text style={styles.title}>Location</Text>
                        <View style={styles.metaSectionWrapper}>
                            <Text style={styles.valueLable}>
                                {treeDetails.longitude.toFixed(5)} , {treeDetails.latitude.toFixed(5)}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.header}>Additional Data</Text>
                    <View style={styles.metaWrapper}>
                        <Text style={styles.title}>Device Location</Text>
                        <View style={styles.metaSectionWrapper}>
                            <Text style={styles.valueLable}>
                                {treeDetails.device_longitude} , {treeDetails.device_latitude}
                            </Text>
                        </View>
                    </View>
                </View>
                <ExportGeoJSONButton details={treeDetails} type='treedetails' />
                <View style={styles.footer} />

            </ScrollView >
            {!editTree && <CustomButton
                label={!allSampleTreeRegisterd ? "Continue" : "Next Tree"}
                containerStyle={styles.btnContainer}
                pressHandler={nextTreeButton}
            />}
            <EditInputModal value={openEditModal.value} setValue={setCurrentValue} onSubmitInputField={closeModal} isOpenModal={openEditModal.open} setIsOpenModal={closeModal} inputType={openEditModal.type} />
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
    datePickerContainer:{
        position:"absolute",
        zIndex:1,
        backgroundColor:'#fff',
        width:"100%",
        bottom:0
    },
    metaSectionWrapper: {
        width: '100%',
        height: 40,
        flexDirection: 'row',
        alignItems: 'center'
    },
    title: {
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: scaleSize(14),
        color: Colors.TEXT_LIGHT,
    },
    header: {
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        fontSize: scaleSize(18),
        color: Colors.TEXT_COLOR,
        marginLeft: 20,
        marginTop: 10
    },
    valueLable: {
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: scaleSize(16),
        color: Colors.TEXT_COLOR,
        marginLeft: 10,
    },
    speciesName: {
        fontFamily: Typography.FONT_FAMILY_ITALIC,
        fontSize: scaleSize(16),
        color: Colors.TEXT_COLOR,
        marginLeft: 10,
    },
    btnContainer: {
        width: '100%',
        height: scaleSize(70),
        position: 'absolute',
        bottom: 20,
    },
    iconwrapper: {
        marginLeft: 10
    },
    footer: {
        width: '100%',
        height: 100
    },
    editIconWrapper: {
        marginLeft: 10,
        marginTop: 10
    }
})