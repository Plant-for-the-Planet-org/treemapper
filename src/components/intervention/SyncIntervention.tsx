import { Pressable, StyleSheet, Text, View } from 'react-native'
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
import { getPostBody, postDataConvertor } from 'src/utils/helpers/syncHelper';
import { uploadIntervention, uploadInterventionImage } from 'src/api/api.fetch';
import { updateNewIntervention } from 'src/store/slice/appStateSlice';
import i18next from 'src/locales/index';
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
    const { updateInterventionStatus, updateTreeStatus, updateTreeImageStatus } = useInterventionManagement()
    const dispatch = useDispatch()

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

    const startSyncingData = () => {
        if (!isLoggedIn) {
            showLogin()
            return
        }
        if (!isSyncing) {
            dispatch(updateSyncDetails(true))
        }
        if (retryCount > 1) {
            setRetryCount(prev => prev - 1)
        } else {
            dispatch(updateSyncDetails(false))
            setMoreUpload(false)
            toast.show("Syncing Failed, Please try again")
            return
        }
        const quaeData = postDataConvertor(JSON.parse(JSON.stringify(interventionData)))
        const prioritizeData = [...quaeData].sort((a, b) => a.priority - b.priority);
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

    const handleIntervention = async (el) => {
        try {
            const body = await getPostBody(el);
            if (!body) {
                throw new Error("Not able to convert body");
            }
            const response = await uploadIntervention(body);
            if (response) {
                const result = await updateInterventionStatus(el.p1Id, response.hid, response.id, el.nextStatus);
                if (!result) {
                    console.log("Error updating intervention");
                }
            }
        } catch (error) {
            console.log("Error occurred during individual upload:", error);
        }
    };

    const handleSingleTree = async (el) => {
        try {
            const body = await getPostBody(el);
            if (!body) {
                throw new Error("Not able to convert body");
            }
            const response = await uploadIntervention(body);
            if (response) {
                const result = await updateInterventionStatus(el.p1Id, response.hid, response.id, el.nextStatus);
                if (result) {
                    await updateTreeStatus(el.p2Id, response.hid, response.id, el.nextStatus, response.id, response.coordinates);
                } else {
                    console.log("Failed to write to db");
                }
            }
        } catch (error) {
            console.log("Error occurred during individual upload:", error);
        }
    };

    const handleSampleTree = async (el) => {
        try {
            const body = await getPostBody(el);
            if (!body) {
                throw new Error("Not able to convert body");
            }
            const response = await uploadIntervention(body);
            if (response) {
                await updateTreeStatus(el.p2Id, response.hid, response.id, el.nextStatus, body.parent, response.coordinates);
            } else {
                console.log("Failed to write to db");
            }
        } catch (error) {
            console.log("Error occurred during individual upload:", error);
        }
    };

    const handleTreeImage = async (el) => {
        try {
            const body = await getPostBody(el);
            if (!body) {
                throw new Error("Not able to convert body");
            }
            await uploadInterventionImage(body.locationId, body.imageId, {
                imageFile: body.imageFile
            });
            await updateTreeImageStatus(el.p2Id, el.p1Id);
        } catch (error) {
            console.log("Error occurred during individual upload:", error);
        }
    };

    const uploadObjectsSequentially = async (d: QuaeBody[]) => {
        for (const el of d) {
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
                default:
                    console.log("Unknown type:", el.type);
            }
        }
        startSyncingData();
    };

    const renderSyncView = () => (
        <View style={styles.container}>
            <RotatingView isClockwise={true}>
                <RefreshIcon />
            </RotatingView>
            <Text style={styles.label}>{i18next.t("label.syncing")}</Text>
        </View>
    )

    const renderUnSyncView = () => (
        <Pressable style={styles.container} onPress={showLogin}>
            <UnSyncIcon width={20} height={20} />
            <Text style={styles.label}>{i18next.t("label.sync_data")}</Text>
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
