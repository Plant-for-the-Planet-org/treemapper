import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Colors, Typography } from 'src/utils/constants'
import UnSyncIcon from 'assets/images/svg/UnSyncIcon.svg';
import SyncIcon from 'assets/images/svg/CloudSyncIcon.svg';
import RefreshIcon from 'assets/images/svg/RefreshIcon.svg';
import { useQuery } from '@realm/react';
import { RealmSchema } from 'src/types/enum/db.enum';
import { MonitoringPlot, PlotQuaeBody } from 'src/types/interface/slice.interface';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from 'src/types/type/navigation.type';
import { useToast } from 'react-native-toast-notifications';
import RotatingView from '../common/RotatingView';
import { useSelector } from 'react-redux';
import { RootState } from 'src/store';
import { uploadPlotData } from 'src/api/api.fetch';
import { useNetInfo } from "@react-native-community/netinfo";
import i18next from 'src/locales/index';
import useLogManagement from 'src/hooks/realm/useLogManagement';
import useMonitoringPlotManagement from 'src/hooks/realm/useMonitoringPlotManagement';
import { convertPlotBody, postPlotConvertor } from 'src/utils/helpers/plotSyncHelper';
interface Props {
    isLoggedIn: boolean
}


const PlotSyncing = ({ isLoggedIn }: Props) => {
    const [uploadData, setUploadData] = useState<PlotQuaeBody[]>([])
    const [moreUpload, setMoreUpload] = useState(false)
    const [retryCount, setRetryCount] = useState(10)
    const [showFullSync, setShowFullSync] = useState(false)
    const [syncing, setSyncing] = useState(false)

    // const { syncRequired, isSyncing } = useSelector(
    //     (state: RootState) => state.syncState,
    // )
    const toast = useToast()
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

    const {} = useMonitoringPlotManagement()
    const { addNewLog } = useLogManagement()
    const { isConnected } = useNetInfo();

    const uType = useSelector(
        (state: RootState) => state.userState.type,
    )
    const monitoringPlotData = useQuery<MonitoringPlot>(
        RealmSchema.MonitoringPlot,
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
        // if (!isSyncing) {
        //     dispatch(updateSyncDetails(true))
        //     dispatch(updateLastSyncData(Date.now()))
        // }
        if (retryCount > 1) {
            setRetryCount(prev => prev - 1)
        } else {
            setMoreUpload(false)
            toast.show("Syncing Failed, Please try again")
            return
        }
        const qData = postPlotConvertor(JSON.parse(JSON.stringify(monitoringPlotData)))
        const prioritizeData = [...qData].sort((a, b) => a.priority - b.priority);
        if (prioritizeData.length > 0) {
            setMoreUpload(true)
            setSyncing(true)
            setUploadData(() => prioritizeData)
        } else {
            setMoreUpload(false)
            setShowFullSync(true)
            setSyncing(false)
            toast.show("All data is synced")
        }
    }

    const syncUploaded = () => {
        setMoreUpload(false)
        uploadObjectsSequentially(uploadData);
    }


    const handlePlotDataUpload = async (el) => {
        try {
            const { pData, fixRequired, error, message } = convertPlotBody(el);
            if (!pData) {
                throw new Error("Not able to convert body");
            }
            console.log("SDc",pData)
            return
            const { response, success } = await uploadPlotData(pData);
            console.log("Final response", response)
            if (success && response?.hid && response?.id) {
                // await updateInterventionStatus(el.p1Id, response.hid, response.id, el.nextStatus);
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

    const uploadObjectsSequentially = async (d: PlotQuaeBody[]) => {
        setSyncing(true)
        for (const el of d) {
            if (!isConnected) {
                setMoreUpload(false)
                setSyncing(false)
                toast.show("Network call failed \nPlease check your internet connection", { textStyle: { textAlign: 'center' } })
                return;
            }
            switch (el.type) {
                case 'plot_upload':
                    await handlePlotDataUpload(el);
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
            <Text style={styles.label}>{i18next.t("label.syncing")} • {monitoringPlotData.length} left</Text>
        </TouchableOpacity>
    )

    const renderUnSyncView = () => (
        <Pressable style={styles.container} onPress={showLogin}>
            <UnSyncIcon width={20} height={20} />
            <Text style={styles.label}>{i18next.t("label.syncing")} • {monitoringPlotData.length} left</Text>
        </Pressable>
    )

    const renderFullySyncView = () => (
        <View style={styles.container}>
            <SyncIcon width={20} height={20} />
            <Text style={styles.label}>{i18next.t("label.fully_synced")}</Text>
        </View>
    )

    const renderTile = () => {
        if (monitoringPlotData.length>0 && !syncing ) return renderUnSyncView()
        if (syncing) return renderSyncView()
        if (showFullSync) return renderFullySyncView()
        return null
    }

    return <View>
        {renderTile()}
    </View>
}


export default PlotSyncing

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
