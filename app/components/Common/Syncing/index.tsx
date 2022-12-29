import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import FA5Icon from 'react-native-vector-icons/FontAwesome5';
import { Typography, Colors } from '../../../styles';
import RotatingView from '../RotatingView';
import { uploadInventoryData } from '../../../utils/uploadInventory';
import { InventoryContext } from '../../../reducers/inventory';
import i18next from 'i18next';
import { UserContext } from '../../../reducers/user';
import { useNavigation } from '@react-navigation/native';
import dbLog from '../../../repositories/logs';
import { LogTypes } from '../../../utils/constants';
import { useNetInfo } from '@react-native-community/netinfo';
import AlertModal from '../AlertModal';

interface ISyncingProps {
  uploadCount: number;
  pendingCount: number;
  isUploading: boolean;
  isUserLogin?: boolean;
  setEmailAlert?: React.Dispatch<React.SetStateAction<boolean>>;
  borderLess?: boolean;
}

export default function Syncing({
  uploadCount,
  pendingCount,
  isUploading,
  isUserLogin,
  setEmailAlert,
  borderLess = false,
}: ISyncingProps) {
  const [syncText, setSyncText] = useState('');
  const [maxWidth, setMaxWidth] = useState('100%');
  const [offlineModal, setOfflineModal] = useState(false);

  const navigation = useNavigation();
  const netInfo = useNetInfo();

  const { dispatch } = useContext(InventoryContext);
  const { dispatch: userDispatch } = useContext(UserContext);

  // checks for the pending count and updates the sync message based on the same
  const checkPendingCount = () => {
    if (pendingCount !== 0) {
      setSyncText(
        i18next.t('label.upload_pending', {
          count: pendingCount,
        }),
      );
      setMaxWidth('100%');
    } else {
      setMaxWidth('50%');
      setSyncText(i18next.t('label.all_backed_up'));
    }
  };

  useEffect(() => {
    if (isUploading) {
      setSyncText(
        i18next.t('label.sync_remaining', {
          count: uploadCount,
        }),
      );
    } else {
      checkPendingCount();
    }
  }, [pendingCount, uploadCount, isUploading]);

  const onPressUploadNow = () => {
    if (netInfo.isConnected && netInfo.isInternetReachable) {
      uploadInventoryData(dispatch, userDispatch).catch(err => {
        dbLog.error({
          logType: LogTypes.INVENTORY,
          message: 'Failed to upload Inventories',
          logStack: JSON.stringify(err),
        });
        if (err?.response?.status === 303) {
          navigation.navigate('SignUp');
        } else if (err.error !== 'a0.session.user_cancelled' && setEmailAlert) {
          setEmailAlert(true);
        }
      });
    } else {
      setOfflineModal(true);
    }
  };
  const OfflineModal = () => {
    return (
      <AlertModal
        visible={offlineModal}
        heading={i18next.t('label.network_error')}
        message={i18next.t('label.network_error_message')}
        primaryBtnText={i18next.t('label.ok')}
        onPressPrimaryBtn={() => {
          setOfflineModal(false);
        }}
      />
    );
  };
  const SyncIcon = () => {
    return <FA5Icon size={16} name="sync-alt" color={Colors.PRIMARY} style={{ marginRight: 6 }} />;
  };
  const SyncContainer = () => {
    return (
      <View style={{ maxWidth }}>
        <View style={[styles.syncContainer, borderLess ? {} : { borderWidth: 1, marginRight: 10 }]}>
          {isUploading ? (
            <RotatingView isClockwise={true}>
              <SyncIcon />
            </RotatingView>
          ) : (
            <SyncIcon />
          )}
          <Text style={styles.syncText}>{syncText}</Text>
        </View>
        <OfflineModal />
      </View>
    );
  };

  if (!isUserLogin && !isUploading && pendingCount === 0) {
    return <View></View>;
  }

  if (!isUploading && pendingCount > 0) {
    return (
      <TouchableOpacity onPress={onPressUploadNow}>
        <SyncContainer />
      </TouchableOpacity>
    );
  } else {
    return <SyncContainer />;
  }
}

const styles = StyleSheet.create({
  syncContainer: {
    borderRadius: 14,
    borderColor: Colors.GRAY_LIGHT,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.WHITE,
  },
  syncText: {
    paddingLeft: 6,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    color: Colors.TEXT_COLOR,
  },
});
