import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Typography, Colors } from '_styles';

export default function index({ progress, uploadCount, pendingCount, isUploading }) {
  const [averageProgress, setAverageProgress] = useState(null);
  const [syncText, setSyncText] = useState('');
  const average = () => {
    if (progress.length > 1) {
      const averageProgress = progress.reduce((a, b) => a + b) / progress.length;
      setAverageProgress(averageProgress);
      setSyncText(`Syncing - ${averageProgress} remaining`);
    } else {
      setAverageProgress(progress);
      setSyncText(`Syncing - ${progress} remaining`);
    }
  };

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
  }, [uploadCount, isUploading]);

  useEffect(() => {
    if (isUploading) {
      setSyncText(`Syncing - ${uploadCount} remaining`);
    } else {
      checkPendingCount();
    }
  }, [pendingCount, isUploading]);

  return (
    <View style={styles.syncContainer}>
      <Icon size={20} name="sync" color={Colors.PRIMARY} />
      <Text style={styles.syncText}>{syncText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  syncContainer: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#c3c3c3',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  syncText: {
    paddingLeft: 10,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_12,
    color: Colors.TEXT_COLOR,
  },
  progressText: {
    color: Colors.TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
  },
});
