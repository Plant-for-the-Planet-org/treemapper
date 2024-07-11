import { Pressable, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Colors, Typography } from 'src/utils/constants'
import UnSyncIcon from 'assets/images/svg/UnSyncIcon.svg';
import SyncIcon from 'assets/images/svg/CloudSyncIcon.svg';
import RefreshIcon from 'assets/images/svg/RefreshIcon.svg';
import { useQuery } from '@realm/react';
import { RealmSchema } from 'src/types/enum/db.enum';
import { InterventionData } from 'src/types/interface/slice.interface';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from 'src/types/type/navigation.type';
import { useToast } from 'react-native-toast-notifications';
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement';
import RotatingView from '../common/RotatingView';

interface Props {
    isLogedIn: boolean
}

const SyncIntervention = ({ isLogedIn }: Props) => {
    const [syncing, setSyncing] = useState(false)
    const [fullySync, setFullySync] = useState(false)
    const [currentIntervention, setCurrentIntervention] = useState<InterventionData | null>(null)

    const toast = useToast()
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const { updateInterventionStatus } = useInterventionManagement()

    const interventionData = useQuery<InterventionData>(
        RealmSchema.Intervention,
        data => data.filtered('status != "SYNCED" AND is_complete == true')
    )

    const fetchUserData = async () => {
        try {
            await new Promise(resolve => setTimeout(resolve, 3000));
            return { success: true, hid: String(Date.now()) };
        } catch (error) {
            return { success: false, hid: '' };
        }
    };

    const showLogin = () => {
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
        if (interventionData.length > 0) {
            setSyncing(true)
            setCurrentIntervention(interventionData[0])
        } else {
            setFullySync(true)
        }
    }

    useEffect(() => {
        if (currentIntervention) {
            uploadInterventionData()
        }
    }, [currentIntervention])

    useEffect(() => {
        if (syncing) {
            startSyncingData()
        }
    }, [interventionData])

    const uploadInterventionData = async () => {
        const response = await fetchUserData();
        if (response.success) {
            await updateInterventionStatus(currentIntervention.intervention_id, response.hid)
        } else {
            toast.show("Error occurred while uploading data")
            setSyncing(false)
        }
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
            <Text style={styles.label}>{interventionData.length} left</Text>
        </Pressable>
    )

    const renderFullySyncView = () => (
        <View style={styles.container}>
            <SyncIcon width={20} height={20} />
            <Text style={styles.label}>Fully synced</Text>
        </View>
    )

    const renderTile = () => {
        if (syncing && !fullySync) return renderSyncView()
        if (!syncing && interventionData.length > 0) return renderUnsyncView()
        if (syncing && fullySync) return renderFullySyncView()
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
