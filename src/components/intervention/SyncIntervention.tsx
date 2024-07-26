import { Pressable, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Colors, Typography } from 'src/utils/constants'
import UnSyncIcon from 'assets/images/svg/UnSyncIcon.svg';
import SyncIcon from 'assets/images/svg/CloudSyncIcon.svg';
import RefreshIcon from 'assets/images/svg/RefreshIcon.svg';
import { useQuery } from '@realm/react';
import { RealmSchema } from 'src/types/enum/db.enum';
import { InterventionData, QueeBody } from 'src/types/interface/slice.interface';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from 'src/types/type/navigation.type';
import { useToast } from 'react-native-toast-notifications';
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement';
import RotatingView from '../common/RotatingView';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'src/store';
import { updateSyncDetails } from 'src/store/slice/syncStateSlice';
import { getPostBody, postDataConvertor } from 'src/utils/helpers/syncHelper';
import { uploadIntervention, uploadInterventionImage } from 'src/api/api.fetch';
import { updateNewIntervention } from 'src/store/slice/appStateSlice';

interface Props {
    isLogedIn: boolean
}


const SyncIntervention = ({ isLogedIn }: Props) => {
    const [uploadData, setUploadData] = useState<QueeBody[]>([])
    const [moreUpload, setMoreUplaod] = useState(false)
    const { syncRequired, isSyncing } = useSelector(
        (state: RootState) => state.syncState,
    )
    const [retryCount, setRetry] = useState(10)
    const toast = useToast()
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const { updateInterventionStatus, updateTreeStatus, updateTreeImageStatus } = useInterventionManagement()
    const dispatch = useDispatch()
    const [showFullSync, setFullSync] = useState(false)
    const interventionData = useQuery<InterventionData>(
        RealmSchema.Intervention,
        data => data.filtered('status != "SYNCED" AND is_complete == true')
    )

    useEffect(() => {
        if (uploadData && uploadData.length > 0 && moreUpload) {
            syncUploaded()
        }
    }, [uploadData])



    const showLogin = () => {
        setRetry(10)
        if (!isLogedIn) {
            navigation.navigate("HomeSideDrawer")
            toast.show("Please login to start syncing data")
        } else {
            startSyncingData()
        }
    }

    const startSyncingData = () => {
        if (!isLogedIn) {
            showLogin()
            return
        }
        if (!isSyncing) {
            dispatch(updateSyncDetails(true))
        }
        if (retryCount > 1) {
            setRetry(prev => prev-1)
        } else {
            dispatch(updateSyncDetails(false))
            setMoreUplaod(false)
            toast.show("Syncing Failed, Please try again")
            return
        }
        const queeData = postDataConvertor(JSON.parse(JSON.stringify(interventionData)))
        const prioritizeData = queeData.sort((a, b) => a.priotiry - b.priotiry);
        if (prioritizeData.length > 0) {
            setMoreUplaod(true)
            setTimeout(() => {
                setUploadData(prioritizeData)
            }, 2000);
            dispatch(updateNewIntervention())
        } else {
            dispatch(updateSyncDetails(false))
            setMoreUplaod(false)
            setFullSync(true)
            toast.show("All data is synced")
        }
    }

    const syncUploaded = () => {
        setMoreUplaod(false)
        uploadObjectsSequentially(uploadData);
    }

    const uploadObjectsSequentially = async (d: QueeBody[]) => {
        for (const el of d) {
            if (el.type === 'intervention') {
                try {
                    const body = await getPostBody(el)
                    if (!body) {
                        throw "Not able to convert body"
                    }
                    const response = await uploadIntervention(body)
                    if (response) {
                        const result = await updateInterventionStatus(el.p1Id, response.hid, response.id, el.nextStatus)
                        if (!result) {
                            console.log("Error updating  intervention")
                        }
                    }
                } catch (error) {
                    console.log("error occured indvidual upload", +error)
                }
            }

            if (el.type === 'singleTree') {
                try {
                    const body = await getPostBody(el)
                    if (!body) {
                        throw "Not able to convert body"
                    }
                    const response = await uploadIntervention(body)
                    if (response) {
                        const result = await updateInterventionStatus(el.p1Id, response.hid, response.id, el.nextStatus)
                        if (result) {
                            await updateTreeStatus(el.p2Id, response.hid, response.id, el.nextStatus, response.id, response.coordinates)
                        } else {
                            //failed to write to db
                        }
                    }
                } catch (error) {
                    console.log("error occured indvidual upload", +error)
                }

            }

            if (el.type === 'sampleTree') {
                try {
                    const body = await getPostBody(el)
                    if (!body) {
                        throw "Not able to convert body"
                    }
                    const response = await uploadIntervention(body)
                    if (response) {
                        await updateTreeStatus(el.p2Id, response.hid, response.id, el.nextStatus, body.parent, response.coordinates)
                    } else {
                        //failed to write to db
                    }
                } catch (error) {
                    console.log("error occured indvidual upload", error)
                }
            }

            if (el.type === 'treeImage') {
                try {
                    const body = await getPostBody(el)
                    if (!body) {
                        throw "Not able to convert body"
                    }
                    await uploadInterventionImage(body.locationId, body.imageId, {
                        imageFile: body.imageFile
                    })
                    await updateTreeImageStatus(el.p2Id, el.p1Id)
                } catch (error) {
                    console.log("error occured indivua" + error)
                }
            }
        }
        startSyncingData()
    }

    const renderSyncView = () => (
        <View style={styles.container}>
            <RotatingView isClockwise={true}>
                <RefreshIcon />
            </RotatingView>
            <Text style={styles.label}>Syncing</Text>
        </View>
    )

    const renderUnsyncView = () => (
        <Pressable style={styles.container} onPress={showLogin}>
            <UnSyncIcon width={20} height={20} />
            <Text style={styles.label}>Sync Data</Text>
            {/* <InfoIcon width={15} height={15} style={{marginLeft:5}}/> */}
        </Pressable>
    )

    const renderFullySyncView = () => (
        <View style={styles.container}>
            <SyncIcon width={20} height={20} />
            <Text style={styles.label}>Fully synced</Text>
        </View>
    )

    const renderTile = () => {
        if (isSyncing && !syncRequired) return renderSyncView()
        if (!isSyncing && interventionData.length > 0) return renderUnsyncView()
        if (showFullSync) return renderFullySyncView()
        return null
    }

    return renderTile()
}


export default SyncIntervention

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 10,
        height: 45,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        backgroundColor: Colors.WHITE,
        borderRadius: 10
    },
    label: {
        fontSize: 16,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.TEXT_COLOR,
        marginLeft: 5
    }
})




