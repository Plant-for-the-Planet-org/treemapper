import React, { useEffect, useState } from 'react'
import { PermissionBlockedAlert } from '../common/LocationPermissionAlerts'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import * as Location from 'expo-location';
import { useDispatch } from 'react-redux'
import { updateUserLocation } from 'src/store/slice/gpsStateSlice'



const LocationPermissionModal = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const [showBlockModal, setShowBlockModal] = useState(false)
    const dispatch = useDispatch()
    useEffect(() => {
        checkForGpsPermission()
    }, [])

    const checkForGpsPermission = async () => {
        // Only READ the current status here (no native prompt). Requesting the
        // permission is owned by useLocationPermission; re-requesting on every
        // mount added a native round-trip that raced the other location
        // consumers and crashed Android. Show the block modal only when the
        // permission is already denied.
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === Location.PermissionStatus.DENIED) {
            setShowBlockModal(true)
        }
    }



    if (!showBlockModal) {
        return null
    }
    const handlePrimaryBtn = () => {
        return null
    }

    const handleSecondaryBtn = () => {
        setShowBlockModal(false)
        setTimeout(() => {
            navigation.goBack()
        }, 500);
        dispatch(updateUserLocation([0,0]))
        return null
    }

    return (
        <PermissionBlockedAlert
            isPermissionBlockedAlertShow={showBlockModal}
            setIsPermissionBlockedAlertShow={() => null}
            onPressPrimaryBtn={handlePrimaryBtn}
            onPressSecondaryBtn={handleSecondaryBtn}
        />
    )
}

export default LocationPermissionModal
