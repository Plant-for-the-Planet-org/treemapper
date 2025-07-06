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
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
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
