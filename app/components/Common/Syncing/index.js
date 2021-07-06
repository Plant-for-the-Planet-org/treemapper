import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Typography, Colors } from '_styles';
import RotatingView from '../RotatingView';
import { uploadInventoryData } from '../../../utils/uploadInventory';
import { InventoryContext } from '../../../reducers/inventory';
import i18next from 'i18next';
import { UserContext } from '../../../reducers/user';
import { useNavigation } from '@react-navigation/native';
import dbLog from '../../../repositories/logs';
import { LogTypes } from '../../../utils/constants';

export default function Syncing({
  uploadCount,
  pendingCount,
  isUploading,
  isUserLogin,
  setEmailAlert,
  borderLess = false,
}) {
  const [syncText, setSyncText] = useState('');

  const navigation = useNavigation();

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
    } else {
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
    uploadInventoryData(dispatch, userDispatch).catch((err) => {
      dbLog.error({
        logType: LogTypes.INVENTORY,
        message: `Failed to upload Inventories ${err} in onPressUploadNow`,
        logStack: JSON.stringify(err),
      });
      if (err?.response?.status === 303) {
        navigation.navigate('SignUp');
      } else if (err.error !== 'a0.session.user_cancelled') {
        setEmailAlert(true);
      }
    });
  };

  const renderSyncContainer = () => {
    return (
      <View style={[styles.syncContainer, borderLess ? {} : { borderWidth: 1, marginRight: 10 }]}>
        {isUploading ? (
          <RotatingView isClockwise={false}>
            <Icon size={24} name="sync" color={Colors.PRIMARY} />
          </RotatingView>
        ) : (
          <Icon size={24} name="sync" color={Colors.PRIMARY} />
        )}
        <Text style={styles.syncText}>{syncText}</Text>
      </View>
    );
  };

  if (!isUserLogin && !isUploading && pendingCount === 0) {
    return <></>;
  }

  if (!isUploading && pendingCount > 0) {
    return <TouchableOpacity onPress={onPressUploadNow}>{renderSyncContainer()}</TouchableOpacity>;
  } else {
    return renderSyncContainer();
  }
}

const styles = StyleSheet.create({
  syncContainer: {
    borderRadius: 6,

    height: 40,
    borderColor: '#c3c3c3',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  syncText: {
    paddingLeft: 6,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_12,
    color: Colors.TEXT_COLOR,
  },
  progressText: {
    color: Colors.TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
  },
});
