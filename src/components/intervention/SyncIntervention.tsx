import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Colors, Typography } from 'src/utils/constants'
import UnSyncIcon from 'assets/images/svg/UnSyncIcon.svg';
import SyncIcon from 'assets/images/svg/CloudSyncIcon.svg';
import RefreshIcon from 'assets/images/svg/RefreshIcon.svg';
import { useQuery } from '@realm/react';
import { RealmSchema } from 'src/types/enum/db.enum';
import { InterventionData, QuaeBody } from 'src/types/interface/slice.interface';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from 'src/types/type/navigation.type';
import { useToast } from 'react-native-toast-notifications';
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement';
import RotatingView from '../common/RotatingView';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'src/store';
import { updateSyncDetails } from 'src/store/slice/syncStateSlice';
import { getPostBody, getRemeasurementBody, postDataConvertor } from 'src/utils/helpers/syncHelper';
import { remeasurement, uploadIntervention, uploadInterventionImage } from 'src/api/api.fetch';
import { updateLastSyncData, updateNewIntervention } from 'src/store/slice/appStateSlice';
// import InfoIcon from 'assets/images/svg/BlueInfoIcon.svg'
import { useNetInfo } from "@react-native-community/netinfo";
import { v4 as uuid } from 'uuid';
import i18next from 'src/locales/index';
import { formatRelativeTimeCustom } from 'src/utils/helpers/appHelper/dataAndTimeHelper';
import useLogManagement from 'src/hooks/realm/useLogManagement';
interface Props {
    isLoggedIn: boolean
}


const SyncIntervention = ({ isLoggedIn }: Props) => {
    const [uploadData, setUploadData] = useState<QuaeBody[]>([])
    const [moreUpload, setMoreUpload] = useState(false)
    const [retryCount, setRetryCount] = useState(10)
    const [showFullSync, setShowFullSync] = useState(false)
    const { syncRequired, isSyncing } = useSelector(
        (state: RootState) => state.syncState,
    )
    const toast = useToast()
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const { updateProjectIdMissing, updateInterventionStatus, updateTreeStatus, updateTreeImageStatus, updateTreeStatusFixRequire } = useInterventionManagement()
    const dispatch = useDispatch()
    const { addNewLog } = useLogManagement()
    const { isConnected } = useNetInfo();
    const lastSyncDate = useSelector(
        (state: RootState) => state.appState.lastSyncDate,
    )
    const uType = useSelector(
        (state: RootState) => state.userState.type,
    )
    const interventionData = useQuery<InterventionData>(
        RealmSchema.Intervention,
        data => data.filtered('status != "SYNCED" AND is_complete == true')
    )
    useEffect(() => {
        if (uploadData.length > 0 && moreUpload) {
            syncUploaded()
        }
        if (process.env.EXPO_TESTING) {
            mimicUploadForTesting()
        }
    }, [uploadData])



    const showLogin = () => {
        setRetryCount(10)
        if (!isLoggedIn) {
            navigation.navigate("HomeSideDrawer")
            toast.show("Please login to start syncing data")
        } else {
            startSyncingData()
        }
    }

    const startSyncingData = () => {
        if (!isLoggedIn) {
            showLogin()
            return
        }
        if (!isSyncing) {
            dispatch(updateSyncDetails(true))
            dispatch(updateLastSyncData(Date.now()))
        }
        if (retryCount > 1) {
            setRetryCount(prev => prev - 1)
        } else {
            dispatch(updateSyncDetails(false))
            setMoreUpload(false)
            toast.show("Syncing Failed, Please try again")
            return
        }
        const qData = postDataConvertor(JSON.parse(JSON.stringify(interventionData)))
        const prioritizeData = [...qData].sort((a, b) => a.priority - b.priority);
        if (prioritizeData.length > 0) {
            setMoreUpload(true)
            setUploadData(() => prioritizeData)
            dispatch(updateNewIntervention())
        } else {
            dispatch(updateSyncDetails(false))
            setMoreUpload(false)
            setShowFullSync(true)
            toast.show("All data is synced")
        }
    }

    const syncUploaded = () => {
        setMoreUpload(false)
        uploadObjectsSequentially(uploadData);
    }

    const mimicUploadForTesting = async () => {
        // Simulate an upload with a random timeout between 1-3 seconds
        const uploadTime = Math.floor(Math.random() * 2000) + 1000;

        // Simulate an async upload with a delay
        await new Promise(resolve => setTimeout(resolve, uploadTime));

        // Randomly decide if the upload should fail (e.g., 20% chance of failure)
        const shouldFail = Math.random() < 0.2;

        if (shouldFail) {
            throw new Error("Upload failed due to a simulated error");
        }

        // If it doesn't fail, return a successful upload response
        const uploadId = uuid();
        return {
            id: uploadId,
            hid: uuid(),
            coordinates: [
                {
                    "coordinateIndex": 0,
                    "image": "66be19139d356578593650.jpg",
                    "status": "complete",
                    "id": uuid()
                }
            ]
        };
    };


    const handleIntervention = async (el) => {
        try {
            const { pData, fixRequired, error, message } = await getPostBody(el, uType);
            if (fixRequired === 'PROJECT_ID_MISSING') {
                await updateProjectIdMissing(el.p1Id)
                addNewLog({
                    logType: 'DATA_SYNC',
                    message: 'Intervention fix require ' + message,
                    logLevel: 'error',
                    statusCode: '',
                    logStack: JSON.stringify(error),
                })
            }
            if (!pData) {
                throw new Error("Not able to convert body");
            }
            const { response, success } = await uploadIntervention(pData);
            if (success && response?.hid && response?.id) {
                await updateInterventionStatus(el.p1Id, response.hid, response.id, el.nextStatus);
            } else {
                addNewLog({
                    logType: 'DATA_SYNC',
                    message: 'Intervention API response error',
                    logLevel: 'error',
                    statusCode: '',
                })
            }
        } catch (error) {
            addNewLog({
                logType: 'DATA_SYNC',
                message: 'Intervention API response error(Inside Catch)',
                logLevel: 'error',
                statusCode: '',
                logStack: JSON.stringify(error),
            })
        }
    };

    const handleSingleTree = async (el) => {
        try {
            const { pData, fixRequired, error, message } = await getPostBody(el, uType);
            if (fixRequired === 'PROJECT_ID_MISSING') {
                await updateProjectIdMissing(el.p1Id)
                addNewLog({
                    logType: 'DATA_SYNC',
                    message: 'Intervention fix require ' + message,
                    logLevel: 'error',
                    statusCode: '',
                    logStack: JSON.stringify(error),
                })
            }
            if (!pData) {
                throw new Error("Not able to convert body");
            }
            const { response, success } = await uploadIntervention(pData);
            if (success && response?.id && response?.hid) {
                const result = await updateInterventionStatus(el.p1Id, response.hid, response.id, el.nextStatus);
                if (result) {
                    await updateTreeStatus(el.p2Id, response.hid, response.id, el.nextStatus, response.id, response.coordinates);
                }
            } else {
                addNewLog({
                    logType: 'DATA_SYNC',
                    message: 'Single Tree API response error',
                    logLevel: 'error',
                    statusCode: '',
                })
            }
        } catch (error) {
            addNewLog({
                logType: 'DATA_SYNC',
                message: 'Single Tree API response error(Inside Catch)',
                logLevel: 'error',
                statusCode: '',
                logStack: JSON.stringify(error),
            })
        }
    };

    const handleRemeasurement = async (el) => {
        try {
            const { pData } = await getRemeasurementBody(el);
            if (!pData) {
                throw new Error("Not able to convert body");
            }
            const { response, success } = await remeasurement(el.p2Id, pData);
            if (success && response?.id && response?.hid) {
                const result = await updateInterventionStatus(el.p1Id, response.hid, response.id, el.nextStatus);
                if (result) {
                    await updateTreeStatus(el.p2Id, response.hid, response.id, el.nextStatus, response.id, response.coordinates);
                }
            } else {
                addNewLog({
                    logType: 'DATA_SYNC',
                    message: 'Single Tree API response error',
                    logLevel: 'error',
                    statusCode: '',
                })
            }
        } catch (error) {
            addNewLog({
                logType: 'DATA_SYNC',
                message: 'Single Tree API response error(Inside Catch)',
                logLevel: 'error',
                statusCode: '',
                logStack: JSON.stringify(error),
            })
        }
    };

    const handleSampleTree = async (el) => {
        try {
            const { pData, fixRequired, error, message } = await getPostBody(el, uType);
            if (fixRequired !== 'NO') {
                await updateTreeStatusFixRequire(el.p1Id, el.p2Id, fixRequired)
                addNewLog({
                    logType: 'DATA_SYNC',
                    message: 'Sample Tree fix require ' + message,
                    logLevel: 'error',
                    statusCode: '',
                    logStack: JSON.stringify(error),
                })
            }
            if (!pData) {
                throw new Error("Not able to convert body");
            }
            const { response, success } = await uploadIntervention(pData);
            if (success && response?.hid && response?.id && response.coordinates) {
                await updateTreeStatus(el.p2Id, response.hid, response.id, el.nextStatus, pData.parent, response.coordinates);
            } else {
                addNewLog({
                    logType: 'DATA_SYNC',
                    message: 'Sample Tree API response error',
                    logLevel: 'error',
                    statusCode: '',
                })
            }
        } catch (error) {
            addNewLog({
                logType: 'DATA_SYNC',
                message: 'Sample Tree API response error(Inside Catch)',
                logLevel: 'error',
                statusCode: '',
                logStack: JSON.stringify(error),
            })
        }
    };

    const handleTreeImage = async (el) => {
        try {
            const { pData, fixRequired, error, message } = await getPostBody(el, uType);
            if (fixRequired !== 'NO') {
                addNewLog({
                    logType: 'DATA_SYNC',
                    message: 'Intervention fix require ' + message,
                    logLevel: 'error',
                    statusCode: '',
                    logStack: JSON.stringify(error),
                })
            }
            if (!pData) {
                throw new Error("Not able to convert body");
            }
            const { response, success } = await uploadInterventionImage(pData.locationId, pData.imageId, {
                imageFile: pData.imageFile
            });
            if (success && response.status === "complete") {
                const cdnImage = response.image || ''
                await updateTreeImageStatus(el.p2Id, el.p1Id, cdnImage);
            } else {
                addNewLog({
                    logType: 'DATA_SYNC',
                    message: 'Image Upload API response error',
                    logLevel: 'error',
                    statusCode: '',
                })
            }
        } catch (error) {
            addNewLog({
                logType: 'DATA_SYNC',
                message: 'Image Upload API response error(Inside Catch)',
                logLevel: 'error',
                statusCode: '',
                logStack: JSON.stringify(error),
            })
        }
    };

    const uploadObjectsSequentially = async (d: QuaeBody[]) => {
        for (const el of d) {
            if (!isConnected) {
                dispatch(updateSyncDetails(false))
                setMoreUpload(false)
                toast.show("Network call failed \nPlease check your internet connection", { textStyle: { textAlign: 'center' } })
                return;
            }
            switch (el.type) {
                case 'intervention':
                    await handleIntervention(el);
                    break;
                case 'singleTree':
                    await handleSingleTree(el);
                    break;
                case 'sampleTree':
                    await handleSampleTree(el);
                    break;
                case 'treeImage':
                    await handleTreeImage(el);
                    break;
                case 'remeasurementData':
                    await handleRemeasurement(el);
                    break
                case 'remeasurementStatus':
                    await handleRemeasurement(el);
                    break;
                default:
                    console.log("Unknown type:", el.type);
            }
        }
        startSyncingData();
    };


    const renderSyncView = () => (
        <TouchableOpacity style={styles.container}>
            <RotatingView isClockwise={true}>
                <RefreshIcon />
            </RotatingView>
            <Text style={styles.label}>{i18next.t("label.syncing")} • {interventionData.length} left</Text>
            {/* <InfoIcon width={18} height={18} style={styles.infoIconWrapper} onPress={toggleInfo} /> */}
        </TouchableOpacity>
    )

    const renderUnSyncView = () => (
        <Pressable style={styles.container} onPress={showLogin}>
            <UnSyncIcon width={20} height={20} />
            <Text style={styles.label}>{lastSyncDate ? formatRelativeTimeCustom(lastSyncDate) : i18next.t("label.sync_data")}{interventionData.length ? ` • ${interventionData.length} left` : ""}</Text>
        </Pressable>
    )

    const renderFullySyncView = () => (
        <View style={styles.container}>
            <SyncIcon width={20} height={20} />
            <Text style={styles.label}>{i18next.t("label.fully_synced")}</Text>
        </View>
    )

    const renderTile = () => {
        if (isSyncing && !syncRequired) return renderSyncView()
        if (!isSyncing && interventionData.length > 0) return renderUnSyncView()
        if (showFullSync) return renderFullySyncView()
        return null
    }

    return <View>
        {renderTile()}
    </View>
}


export default SyncIntervention

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 10,
        height: 50,
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
        marginLeft: 8
    },
    infoIconWrapper: {
        marginRight: 5,
        marginLeft: 10
    },
})
