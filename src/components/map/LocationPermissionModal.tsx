import React, { useEffect } from 'react'
import useLocationPermission from 'src/hooks/useLocationPermission'
import { PermissionBlockedAlert } from '../common/LocationPermissionAlerts'
import { useDispatch, useSelector } from 'react-redux'
import { updaeBlockerModal } from 'src/store/slice/gpsStateSlice'
import { RootState } from 'src/store'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'


interface Props {
    required?: boolean
}

const LocationPermissionModal = (props: Props) => {
    const { required } = props
    const { permissionStatus } = useLocationPermission()
    const showAlerModal = useSelector((state: RootState) => state.gpsState.showBlockerModal)
    const dispatch = useDispatch()
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    useEffect(() => {
        if (permissionStatus === 'denied') {
            dispatch(updaeBlockerModal(true))
        }
    }, [permissionStatus])
    if (!showAlerModal) {
        return null
    }
    const handlePrimaryBtn = () => {
        return null
    }
    const handleSecondaryBtn = () => {
        if (required) {
            dispatch(updaeBlockerModal(false))
            setTimeout(() => {
                navigation.goBack()
            }, 300);
        } else {
            dispatch(updaeBlockerModal(false))
        }
        return null
    }

    return (
        <PermissionBlockedAlert
            isPermissionBlockedAlertShow={showAlerModal}
            setIsPermissionBlockedAlertShow={() => null}
            onPressPrimaryBtn={handlePrimaryBtn}
            onPressSecondaryBtn={handleSecondaryBtn}
        />
    )
}

export default LocationPermissionModal
