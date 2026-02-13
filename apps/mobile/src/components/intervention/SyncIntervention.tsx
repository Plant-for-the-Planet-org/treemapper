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
import { mobileInterventionImageUplaod, presingedUrl, remeasuremenMobile, remeasurement, skipRemeasurement, uploadAllIntervention, uploadInterventionImage } from 'src/api/api.fetch';
import { updateLastSyncData, updateNewIntervention } from 'src/store/slice/appStateSlice';
// import InfoIcon from 'assets/images/svg/BlueInfoIcon.svg'
import { useNetInfo } from "@react-native-community/netinfo";
import i18next from 'src/locales/index';
import { formatRelativeTimeCustom } from 'src/utils/helpers/appHelper/dataAndTimeHelper';
import useLogManagement from 'src/hooks/realm/useLogManagement';
import { generateUid } from 'src/utils/helpers/uidGenerator';
interface Props {
    isLoggedIn: boolean
    tokenValid?: boolean
}


const SyncIntervention = ({ isLoggedIn, tokenValid }: Props) => {
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
        data => data.filtered('status != "SYNCED" AND is_complete == true AND status != "PENDING_REMEASUREMENT_SYNC"')
    )
    useEffect(() => {
        if (uploadData.length > 0 && moreUpload) {
            if (!tokenValid) {
                addNewLog({
                    logType: 'DATA_SYNC',
                    message: 'Token Invalid during data sync',
                    logLevel: 'error',
                    statusCode: '',
                })
            } else {
                syncUploaded()
            }
        }
    }, [uploadData, tokenValid])



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
        console.log("startSyncingData called")
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
            const { pData, historyID, treeID } = await getRemeasurementBody(el,v3Approved);
            if (!pData) {
                throw new Error("Not able to convert body");
            }

            if (v3Approved) {
                await handleMobileRemeasurement(el)
                return
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


    const handleMobileRemeasurement = async (el) => {
        console.log("=== handleMobileRemeasurement START ===");
        try {
            const { pData, historyID, treeID } = await getRemeasurementBody(el, v3Approved);

            if (!pData) {
                throw new Error("Not able to convert body");
            }

            // Build request body based on type
            let requestBody: any = {
                type: pData.type,
                metadata: pData.metadata || {},
            };

            // Add eventDate if provided
            if (pData.eventDate) {
                requestBody.eventDate = pData.eventDate;
            }

            // Handle image upload for v3Approved users
            let imageFilename: string | undefined = undefined;
            if (v3Approved && pData.imageFile) {

                try {
                    // Get presigned URL for image upload
                    const presignedResponse = await presingedUrl({
                        fileName: String(new Date().getTime()),
                        fileType: 'image/jpg',
                        folder: 'tree'
                    });
                    console.log("Presigned URL Response:", JSON.stringify(presignedResponse, null, 2));

                    if (!presignedResponse.success || presignedResponse.response?.code !== 'success') {
                        console.warn("⚠️ Failed to get presigned URL, continuing without image");
                        console.warn("Response:", presignedResponse);
                    } else {
                        const signedUrl = presignedResponse.response.data.data.uploadUrl;
                        const fileName = presignedResponse.response.data.data.fileName;
                        console.log("Upload URL:", signedUrl);
                        console.log("File Name:", fileName);

                        // Upload image to presigned URL
                        const uploadResponse = await fetch(signedUrl, {
                            method: 'PUT',
                            body: {
                                uri: pData.imageFile,
                                type: 'image/jpg',
                                name: fileName || 'image.jpg',
                            },
                            headers: {
                                'Content-Type': 'image/jpg',
                            },
                        });

                        if (!uploadResponse.ok) {
                            console.warn(`⚠️ Image upload failed with status: ${uploadResponse.status}, continuing without image`);
                        } else {
                            imageFilename = fileName;
                            console.log("✅ Image uploaded successfully:", imageFilename);
                        }
                    }
                } catch (imageError) {
                    console.error("❌ Image upload error:", imageError);
                    console.warn("⚠️ Continuing with remeasurement without image");
                }
            }

            // Add type-specific fields
            if (pData.type === 'measurement') {
                console.log("--- Building MEASUREMENT request body ---");
                // For measurement type, include height and width
                if (pData.measurements?.height !== undefined) {
                    requestBody.height = pData.measurements.height;
                    console.log("Added height:", pData.measurements.height);
                }
                if (pData.measurements?.width !== undefined) {
                    requestBody.width = pData.measurements.width;
                    console.log("Added width:", pData.measurements.width);
                }
            } else if (pData.type === 'status') {
                console.log("--- Building STATUS request body ---");
                // For status type, include status and statusReason
                requestBody.status = pData.status;
                console.log("Added status:", pData.status);
                if (pData.statusReason) {
                    requestBody.statusReason = pData.statusReason;
                    console.log("Added statusReason:", pData.statusReason);
                }
            } else {
                console.warn("Unknown type:", pData.type);
            }

            // Add image filename if uploaded
            if (imageFilename) {
                requestBody.imageFilename = imageFilename;
                console.log("Added imageFilename:", imageFilename);
            }

            console.log("--- Final Request Body ---");
            console.log("Request Body:", JSON.stringify(requestBody, null, 2));
            console.log("Tree ID:", treeID);

            console.log("--- Making API Call ---");
            const response = await remeasuremenMobile(treeID, requestBody);
            console.log("--- API Response ---");
            console.log("Full Response:", JSON.stringify(response, null, 2));
            console.log("Success:", response?.success);
            console.log("Status Code:", response?.status);
            if (response?.response) {
                console.log("Response Body:", JSON.stringify(response.response, null, 2));
            }
            if (!response?.success) {
                console.error("❌ API Call Failed!");
                console.error("Status:", response?.status);
                console.error("Response:", response?.response);
                console.error("Extra:", response?.extra);
            }

            const { success } = response;
            if (success) {
                console.log("✅ Remeasurement successful! Updating status...");
                await updateRemeasurementStatus(el.p1Id, el.p2Id, historyID);
                console.log("✅ Status updated successfully");
                console.log("=== handleMobileRemeasurement SUCCESS ===");
            } else {
                console.error("❌ API returned success: false");
                console.error("Response:", response);
                addNewLog({
                    logType: 'DATA_SYNC',
                    message: 'Remeasurement Tree API response error',
                    logLevel: 'error',
                    statusCode: '',
                })
            }
        } catch (error) {
            console.error("=== handleMobileRemeasurement ERROR ===");
            console.error("Error message:", error?.message);
            console.error("Error stack:", error?.stack);
            console.error("Full error:", JSON.stringify(error, null, 2));
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
        if (!v3Approved) {
            await OldhandleTreeImage(el)
            return
        }
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

            console.log("Image Data", pData);

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


            const signedUrl = presignedResponse.response.data.data.uploadUrl;
            const fileName = presignedResponse.response.data.data.fileName;

            const formData = new FormData();
            formData.append('file', {
                uri: pData.imageFile, // Assuming el contains the image URI
                type: 'image/jpg',
                name: fileName || 'image.jpg',
            });
            console.log("formData", signedUrl);
            // Upload using FormDat
            const uploadResponse = await fetch(signedUrl, {
                method: 'PUT',
                body: {
                    uri: pData.imageFile,
                    type: 'image/jpg',
                    name: fileName || 'image.jpg',
                },
                headers: {
                    'Content-Type': 'image/jpg', // Set the correct content type
                },
            });


            if (!uploadResponse.ok) {
                throw new Error(`Upload failed with status: ${uploadResponse.status}`);
            }
            await mobileInterventionImageUplaod({
                treeUid: pData.treeServerId,
                filename: fileName,
                mimeType: 'image/jpg',
            });
            await updateTreeImageStatus(el.p2Id, el.p1Id, fileName);
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

    const OldhandleTreeImage = async (el) => {
        try {
            const { pData, fixRequired, error, message } = await getPostBody(el, uType, v3Approved);
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