import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Colors, Typography } from 'src/utils/constants'
import UnSyncIcon from 'assets/images/svg/UnSyncIcon.svg';
import SyncIcon from 'assets/images/svg/CloudSyncIcon.svg';
import RefreshIcon from 'assets/images/svg/RefreshIcon.svg';
import { useQuery, useRealm } from '@realm/react';
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
import { presingedUrl, remeasurement, skipRemeasurement, uploadAllIntervention, uploadInterventionImage, uploadMobileIntervention } from 'src/api/api.fetch';
import { updateLastSyncData, updateNewIntervention } from 'src/store/slice/appStateSlice';
// import InfoIcon from 'assets/images/svg/BlueInfoIcon.svg'
import { useNetInfo } from "@react-native-community/netinfo";
import i18next from 'src/locales/index';
import { formatRelativeTimeCustom } from 'src/utils/helpers/appHelper/dataAndTimeHelper';
import useLogManagement from 'src/hooks/realm/useLogManagement';
import { generateUid } from 'src/utils/helpers/uidGenerator';
interface Props {
    isLoggedIn: boolean
}


const SyncIntervention = ({ isLoggedIn }: Props) => {
    const [uploadData, setUploadData] = useState<QuaeBody[]>([])
    const [moreUpload, setMoreUpload] = useState(false)
    const [retryCount, setRetryCount] = useState(10)
    const realm = useRealm()
    const [showFullSync, setShowFullSync] = useState(false)
    const { syncRequired, isSyncing } = useSelector(
        (state: RootState) => state.syncState,
    )
    const v3Approved = useSelector(
        (state: RootState) => state.userState.v3Approved
    )
    const toast = useToast()
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const { updateProjectIdMissing, updateInterventionStatus, updateTreeStatus, updateTreeImageStatus, updateTreeStatusFixRequire, updateRemeasurementStatus, updateInterventionsWithEmptyProjectIdWithCount } = useInterventionManagement()
    const dispatch = useDispatch()
    const { addNewLog } = useLogManagement()
    const { isConnected } = useNetInfo();
    const lastSyncDate = useSelector(
        (state: RootState) => state.appState.lastSyncDate,
    )
    const uType = useSelector(
        (state: RootState) => state.userState.type,
    )
    const projectRequire = v3Approved || uType === 'tpo'

    const interventionData = useQuery<InterventionData>(
        RealmSchema.Intervention,
        data => data.filtered('status != "SYNCED" AND is_complete == true')
    )
    useEffect(() => {
        if (uploadData.length > 0 && moreUpload) {
            syncUploaded()
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

    const checkForProjectId = async () => {
        if (uType !== 'tpo' && !v3Approved) {
            return true
        }
        const invWithoutProjectId = realm.objects(RealmSchema.Intervention).filtered('status == "PENDING_DATA_UPLOAD" AND project_id == ""');
        if (invWithoutProjectId && invWithoutProjectId.length > 0) {
            toast.show(`${invWithoutProjectId.length} of the intervention don't have project assigned. Please assign them project from intervention tab.`)
            await updateInterventionsWithEmptyProjectIdWithCount()
            return false;
        }
        return true;

    }

    const startSyncingData = async () => {
        if (!isLoggedIn) {
            showLogin()
            return
        }
        const canContinue = await checkForProjectId()
        console.log("canContinue", canContinue)
        if (!canContinue) {
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
        } else {
            dispatch(updateSyncDetails(false))
            setMoreUpload(false)
            setShowFullSync(true)
            dispatch(updateNewIntervention())
            toast.show("All data is synced")
        }
    }

    const syncUploaded = () => {
        setMoreUpload(false)
        uploadObjectsSequentially(uploadData);
    }


    const handleIntervention = async (el) => {
        try {
            const { pData, fixRequired, error, message } = await getPostBody(el, uType, projectRequire);
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
            const { responseData, responseError } = await uploadAllIntervention(pData, v3Approved);
            console.log("responseData handleIntervention", responseData)
            if (!responseError && responseData.parentHid && responseData.parentId) {
                await updateInterventionStatus(el.p1Id, responseData.parentHid, responseData.parentId, el.nextStatus);
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
            const { pData, fixRequired, error, message } = await getPostBody(el, uType, projectRequire);
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
            const { responseData, responseError } = await uploadAllIntervention(pData, v3Approved);
            if (!responseError && responseData.treeId && responseData.parentId) {
                const result = await updateInterventionStatus(el.p1Id, responseData.parentHid, responseData.parentId, el.nextStatus);
                if (result) {
                    await updateTreeStatus(el.p2Id, responseData.treeHid, responseData.treeId, el.nextStatus, responseData.parentId, responseData.coordinates);
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
            const { pData, historyID, treeID } = await getRemeasurementBody(el);
            if (!pData) {
                throw new Error("Not able to convert body");
            }
            const { success } = await remeasurement(treeID, pData);
            if (success) {
                await updateRemeasurementStatus(el.p1Id, el.p2Id, historyID)
            } else {
                addNewLog({
                    logType: 'DATA_SYNC',
                    message: 'Remeasurement Tree API response error',
                    logLevel: 'error',
                    statusCode: '',
                })
            }
        } catch (error) {
            addNewLog({
                logType: 'DATA_SYNC',
                message: 'Remeasurement error(Inside Catch)',
                logLevel: 'error',
                statusCode: '',
                logStack: JSON.stringify(error),
            })
        }
    };

    const handleSkipRemeasurement = async (el) => {
        try {
            const dData = await getRemeasurementBody(el);
            if (!dData) {
                throw new Error("Not able to convert body");
            }
            const { success } = await skipRemeasurement(dData.treeID, {
                "type": "skip-measurement"
            });
            if (success) {
                await updateRemeasurementStatus(el.p1Id, el.p2Id, '', true);
            } else {
                addNewLog({
                    logType: 'DATA_SYNC',
                    message: 'Remeasurement SKIP API response error',
                    logLevel: 'error',
                    statusCode: '',
                })
            }
        } catch (error) {
            addNewLog({
                logType: 'DATA_SYNC',
                message: 'Remeasurement SKIP error',
                logLevel: 'error',
                statusCode: '',
                logStack: JSON.stringify(error),
            })
        }
    };


    const handleSampleTree = async (el) => {
        try {
            const { pData, fixRequired, error, message } = await getPostBody(el, uType, projectRequire);
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
            const { responseData, responseError } = await uploadAllIntervention(pData, v3Approved);
            console.log("responseData handleSampleTree", responseData)

            if (!responseError && responseData.parentHid && responseData.parentId) {
                await updateTreeStatus(el.p2Id, responseData.parentHid, responseData.parentId, el.nextStatus, pData.parent, responseData.coordinates);
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
            console.log("handleTreeImage");
            const { pData, fixRequired, error, message } = await getPostBody(el, uType, projectRequire);

            if (fixRequired !== 'NO') {
                addNewLog({
                    logType: 'DATA_SYNC',
                    message: 'Intervention fix require ' + message,
                    logLevel: 'error',
                    statusCode: '',
                    logStack: JSON.stringify(error),
                });
            }

            if (!pData) {
                throw new Error("Not able to convert body");
            }

            // Get presigned URL
            const presignedResponse = await presingedUrl({
                fileName: String(new Date().getMilliseconds()),
                fileType: 'image/jpg',
                folder: 'tree'
            });
            console.log("presignedResponse", presignedResponse)

            // Fixed: Check for success condition (was checking for failure)
            if (presignedResponse.response.code !== 'success') {
                throw new Error('Failed to get upload URL');
            }

            // Fixed: Swapped variable assignments (they were reversed)
            const signedUrl = presignedResponse.response.data.data.uploadUrl;
            const fileName = presignedResponse.response.data.data.fileName;

            // Method 1: Using FormData (recommended for React Native)
            const formData = new FormData();
            formData.append('file', {
                uri: el.imageUri, // Assuming el contains the image URI
                type: 'image/jpg',
                name: fileName || 'image.jpg',
            });

            // Upload using FormData
            const uploadResponse = await fetch(signedUrl, {
                method: 'PUT',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            /* Alternative Method 2: Using raw buffer (if you have the file object)
            
            // Fixed: Properly handle the file buffer
            let buffer;
            if (el.file) {
                // If you have a File object
                buffer = await el.file.arrayBuffer();
            } else if (el.imageUri) {
                // If you have a URI, convert it to buffer
                const response = await fetch(el.imageUri);
                buffer = await response.arrayBuffer();
            } else {
                throw new Error("No image file or URI provided");
            }
    
            const uploadResponse = await fetch(signedUrl, {
                method: 'PUT',
                body: buffer,
                headers: {
                    'Content-Type': 'image/jpg',
                }
            });
            */

            if (!uploadResponse.ok) {
                throw new Error(`Upload failed with status: ${uploadResponse.status}`);
            }

            console.log("Image uploaded successfully");

            // Uncommented and fixed the success handling
            if (uploadResponse.ok) {
                await updateTreeImageStatus(el.p2Id, el.p1Id, fileName);
            } else {
                addNewLog({
                    logType: 'DATA_SYNC',
                    message: 'Image Upload API response error',
                    logLevel: 'error',
                    statusCode: '',
                });
            }

        } catch (error) {
            console.log("handleTreeImage error", error);
            addNewLog({
                logType: 'DATA_SYNC',
                message: 'Image Upload API response error (Inside Catch)',
                logLevel: 'error',
                statusCode: '',
                logStack: JSON.stringify(error),
            });
            return false; // Return false to indicate failure
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
                case 'skipRemeasurement':
                    await handleSkipRemeasurement(el);
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
        fontSize: 14,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.TEXT_COLOR,
        marginLeft: 8
    },
    infoIconWrapper: {
        marginRight: 5,
        marginLeft: 10
    },
})