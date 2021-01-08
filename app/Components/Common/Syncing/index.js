import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Typography, Colors } from '_styles';
import RotatingView from '../RotatingView';
import { store } from '../../../Actions/store';
import { uploadInventoryData } from '../../../Utils/uploadInventory';

export default function Syncing({ uploadCount, pendingCount, isUploading, isUserLogin }) {
  const [syncText, setSyncText] = useState('');
  const { dispatch } = useContext(store);

  // checks for the pending count and updates the sync message based on the same
  const checkPendingCount = () => {
    if (pendingCount !== 0) {
      setSyncText(`${pendingCount} pending`);
    } else {
      setSyncText('All changes are backed up');
    }
  };

  useEffect(() => {
    if (isUploading) {
      setSyncText(`Syncing - ${uploadCount} remaining`);
    } else {
      checkPendingCount();
    }
  }, [pendingCount, uploadCount, isUploading]);

  const onPressUploadNow = () => {
    uploadInventoryData(dispatch)
      .then(() => {
        console.log('uploaded successfully');
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const renderSyncContainer = () => {
    return (
      <View style={styles.syncContainer}>
        {isUploading ? (
          <RotatingView>
            <Icon size={24} name="sync" color={Colors.PRIMARY} />
          </RotatingView>
        ) : (
          <Icon size={24} name="sync" color={Colors.PRIMARY} />
        )}
        <Text style={styles.syncText}>{syncText}</Text>
      </View>
    );
  };
  console.log('isUserLogin =>', isUserLogin);

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
    borderWidth: 1,
    borderColor: '#c3c3c3',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    flex: 1.5,
    marginRight: 10,
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
