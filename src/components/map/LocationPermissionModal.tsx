import React from 'react'
import { PermissionBlockedAlert } from '../common/LocationPermissionAlerts'
import { useDispatch, useSelector } from 'react-redux'
import { updateBlockerModal } from 'src/store/slice/gpsStateSlice'
import { RootState } from 'src/store'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'


interface Props {
    required?: boolean
}

const LocationPermissionModal = (props: Props) => {
    const { required } = props
    const showAlertModal = useSelector((state: RootState) => state.gpsState.showBlockerModal)
    const dispatch = useDispatch()
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

    if (!showAlertModal) {
        return null
    }
    const handlePrimaryBtn = () => {
        return null
    }
    const handleSecondaryBtn = () => {
        if (required) {
            dispatch(updateBlockerModal(false))
            setTimeout(() => {
                navigation.goBack()
            }, 300);
        } else {
            dispatch(updateBlockerModal(false))
        }
        return null
    }

    return (
        <PermissionBlockedAlert
            isPermissionBlockedAlertShow={showAlertModal}
            setIsPermissionBlockedAlertShow={() => null}
            onPressPrimaryBtn={handlePrimaryBtn}
            onPressSecondaryBtn={handleSecondaryBtn}
        />
    )
}

export default LocationPermissionModal
