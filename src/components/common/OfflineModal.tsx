import React, { useEffect, useState } from 'react'
import i18next from 'src/locales/index';
import AlertModal from './AlertModal';
import { useNetInfo } from '@react-native-community/netinfo';

const OfflineModal = () => {
    const [offlineModal, setOfflineModal] = useState(false);
    const netInfo = useNetInfo();
    console.log("Adcjkl", netInfo)
    useEffect(() => {
        if (!netInfo.isConnected) {
            setOfflineModal(true)
        }
    }, [netInfo])

    if (!offlineModal) {
        return null
    }

    return <AlertModal
        visible={offlineModal}
        heading={i18next.t('label.network_error')}
        message={i18next.t('label.network_error_message')}
        primaryBtnText={i18next.t('label.ok')}
        onPressPrimaryBtn={() => {
            setOfflineModal(false);
        }}
    />
}

export default OfflineModal

