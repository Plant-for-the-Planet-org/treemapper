import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import updateAndSyncLocalSpecies from '../../../utils/updateAndSyncLocalSpecies';
import RotatingView from '../RotatingView';
import Icon from 'react-native-vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-community/async-storage';
import Snackbar from 'react-native-snackbar';
import { Colors, Typography } from '_styles';

//Component which will be rendered on Mainscreen and Managespecies when species are not synced or downloaded
const SpeciesSyncError = () => {
  const [refreshAnimation, setRefreshAnimation] = useState(false);
  const [updatingSpeciesState, setUpdatingSpeciesState] = useState('');
  const [asyncStorageSpecies, setAsyncStorageSpecies] = useState(false);
  useEffect(() => {
    const unsubscribe = async () => {
      const species = await AsyncStorage.getItem('isLocalSpeciesUpdated');
      console.log(species, 'species useEffect');
      setAsyncStorageSpecies(species);
    };

    return () => {
      unsubscribe();
    };
  });

  //Syncs species if not downloaded already due to network error
  const speciesCheck = () => {
    updateAndSyncLocalSpecies(setUpdatingSpeciesState)
      .then(async () => {
        setRefreshAnimation(false);
        console.log('zip added', asyncStorageSpecies, updatingSpeciesState);
        const species = await AsyncStorage.getItem('isLocalSpeciesUpdated');
        setAsyncStorageSpecies(species);
        console.log(species, 'species');
      })
      .catch(() => {
        setRefreshAnimation(false);
        Snackbar.show({
          text: 'No Internet Connection!',
          duration: Snackbar.LENGTH_SHORT,
          backgroundColor: '#e74c3c',
        });
        console.log('zip downloading failed');
      });
  };
  return (
    <View>
      {asyncStorageSpecies !== 'true' && updatingSpeciesState !== 'COMPLETED' ? (
        <View style={styles.speciesZipWarning}>
          <View style={{ width: '80%', marginRight: 16, flex: 4 }}>
            <Text style={styles.speciesHeading}>Species sync is incomplete!</Text>
            <Text style={styles.speciesText}>
              Species syncing is required to add species in inventory. Sync when internet connection
              is available.
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              speciesCheck();
              setRefreshAnimation(true);
            }}
            style={{
              padding: 10,
              backgroundColor: '#FFC400',
              borderRadius: 40,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            {refreshAnimation ? (
              <RotatingView isClockwise={true}>
                <Icon name="sync-alt" size={22} color="#FFF" />
              </RotatingView>
            ) : (
              <Icon name="sync-alt" size={22} color="#FFF" />
            )}
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
});
