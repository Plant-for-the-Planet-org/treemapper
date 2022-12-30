import i18next from 'i18next';
import Snackbar from 'react-native-snackbar';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useNetInfo } from '@react-native-community/netinfo';
import React, { useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors, Typography } from '../../../styles';
import { NavigationContext } from '../../../reducers/navigation';

//Component which will be rendered on MainScreen and ManageSpecies when species are not synced or downloaded
const SpeciesSyncError = () => {
  const [asyncStorageSpecies, setAsyncStorageSpecies] = useState<any>(false);

  const { showInitialNavigationStack, setInitialNavigationScreen } = useContext(NavigationContext);

  const netInfo = useNetInfo();

  useEffect(() => {
    const setIsSpeciesUpdated = async () => {
      const species = await AsyncStorage.getItem('isLocalSpeciesUpdated');
      setAsyncStorageSpecies(species);
    };

    setIsSpeciesUpdated();
  }, []);

  const onPressRefreshIcon = () => {
    if (netInfo.isConnected && netInfo.isInternetReachable) {
      setInitialNavigationScreen('SpeciesLoading');
      showInitialNavigationStack();
    } else {
      Snackbar.show({
        text: i18next.t('label.no_internet_connection'),
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: Colors.ALERT,
      });
    }
  };

  const handleSyncBtn = () => onPressRefreshIcon();

  return (
    <View>
      {asyncStorageSpecies !== 'true' && asyncStorageSpecies !== false ? (
        <View style={styles.speciesZipWarning}>
          <View style={styles.syncErrorInfoWrap}>
            <Text style={styles.speciesHeading}>
              {i18next.t('label.species_sync_error_heading')}
            </Text>
            <Text style={styles.speciesText}>{i18next.t('label.species_sync_error_text')}</Text>
          </View>
          <TouchableOpacity onPress={handleSyncBtn} style={styles.syncIconBtn}>
            <Icon name="sync-alt" size={22} color={Colors.WHITE} />
          </TouchableOpacity>
        </View>
      ) : (
        []
      )}
    </View>
  );
};

export default SpeciesSyncError;

const styles = StyleSheet.create({
  speciesZipWarning: {
    marginTop: 26,
    borderRadius: 5,
    borderColor: '#FFC400',
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  speciesHeading: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_14,
    color: Colors.TEXT_COLOR,
    paddingBottom: 8,
  },
  speciesText: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_12,
    color: Colors.TEXT_COLOR,
  },
  syncErrorInfoWrap: {
    width: '80%',
    marginRight: 16,
    flex: 4,
  },
  syncIconBtn: {
    padding: 10,
    backgroundColor: '#FFC400',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
