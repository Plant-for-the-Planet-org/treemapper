import { ScrollView, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/store'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
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
import { timestampToBasicDate } from 'src/utils/helpers/appHelper/dataAndTimeHelper'
import CustomButton from 'src/components/common/CustomButton'
import WidthIcon from 'assets/images/svg/WidthIcon.svg'
import HeightIcon from 'assets/images/svg/HeightIcon.svg'
import { SafeAreaView } from 'react-native-safe-area-context'


const ReviewTreeDetails = () => {
    const FormData = useSelector((state: RootState) => state.formFlowState)
    const SampleTreeSliceData = useSelector((state: RootState) => state.sampleTree)
    const [treeDetails, setTreeDetails] = useState<SampleTree>(null)
    const totalSampleTress = SampleTreeSliceData.sample_tree_count
    const currentTreeIndex = FormData.tree_details.length
    const allSampleTreeRegisterd = currentTreeIndex !== totalSampleTress
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

    const route = useRoute<RouteProp<RootStackParamList, 'ReviewTreeDetails'>>()
    const detailsCompleted = route.params && route.params.detailsCompleted

    const dispatch = useDispatch();
    const realm = useRealm()

    useEffect(() => {
        if (detailsCompleted) {
            if (!FormData.has_sample_trees) {
                navigation.replace('InterventionPreview', { id: 'review' })
            } else {
                setTreeDetails(FormData.tree_details[currentTreeIndex - 1])
            }
        } else {
            setupTreeDetailsFlow()
        }
    }, [detailsCompleted])

    const nextTreeButton = () => {
        if (allSampleTreeRegisterd) {
            navigation.navigate('PointMarker')
        } else {
            navigation.replace('InterventionPreview', { id: 'review' })
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

    if (!treeDetails) {
        return null
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <View style={styles.container}>
                    <Header label={`Review of Tree ${currentTreeIndex} of ${totalSampleTress}`} />
                    <IterventionCoverImage image={treeDetails.image_url} />
                    <View style={styles.metaWrapper}>
                        <Text style={styles.title}>Species</Text>
                        <View style={styles.metaSectionWrapper}>
                            <Text style={styles.speciesName}>
                                {treeDetails.specie_name}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.metaWrapper}>
                        <Text style={styles.title}>Height</Text>
                        <View style={styles.metaSectionWrapper}>
                            <HeightIcon width={20} height={20} style={styles.iconwrapper} />
                            <Text style={styles.valueLable}>
                                {treeDetails.specie_height}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.metaWrapper}>
                        <Text style={styles.title}>Width</Text>
                        <View style={styles.metaSectionWrapper}>
                            <WidthIcon width={20} height={20} style={styles.iconwrapper} />
                            <Text style={styles.valueLable}>
                                {treeDetails.specie_diameter}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.metaWrapper}>
                        <Text style={styles.title}>Plantation Date</Text>
                        <View style={styles.metaSectionWrapper}>
                            <Text style={styles.valueLable}>
                                {timestampToBasicDate(treeDetails.plantation_date)}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.metaWrapper}>
                        <Text style={styles.title}>Tree Tag</Text>
                        <View style={styles.metaSectionWrapper}>
                            <Text style={styles.valueLable}>
                                {treeDetails.tag_id || 'Not Tagged'}
                            </Text>
                        </View>
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
                <View style={styles.footer} />
            </ScrollView >
            <CustomButton
                label={!allSampleTreeRegisterd ? "Continue" : "Next Tree"}
                containerStyle={styles.btnContainer}
                pressHandler={nextTreeButton}
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
        height: 80
    }
})