import React from 'react';
import { SvgXml } from 'react-native-svg';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';

import dbLog from '../../repositories/logs';
import i18next from '../../languages/languages';
import { LogTypes } from '../../utils/constants';
import { Colors, Typography } from '../../styles';
import { migrateRealm } from '../../repositories/default';
import { mobile_download, cloud_sync } from '../../assets';
import { NavigationContext } from '../../reducers/navigation';
import updateAndSyncLocalSpecies from '../../utils/updateAndSyncLocalSpecies';
import shouldUpdateSpeciesSync from '../../utils/ScientificSpecies/shouldUpdateSpeciesSync';

const SpeciesContainer = ({ updatingSpeciesState }: { updatingSpeciesState: string }) => {
  switch (updatingSpeciesState) {
    case 'INITIAL':
      return <Text style={styles.descriptionText}>{i18next.t('label.species_data_status')}</Text>;
    case 'DOWNLOADING':
      return <Text style={styles.descriptionText}>{i18next.t('label.downloading_archive')}</Text>;
    case 'UNZIPPING_FILE':
      return <Text style={styles.descriptionText}>{i18next.t('label.unzipping_archive')}</Text>;
    case 'READING_FILE':
      return (
        <Text style={styles.descriptionText}>
          {i18next.t('label.fetch_and_add_species_to_database')}
        </Text>
      );
    default:
      return <Text>{i18next.t('label.species_data_loaded')}</Text>;
  }
};

export default function InitialLoading() {
  const route = useRoute();
  const navigation = useNavigation();
  const isSpeciesLoadingScreen = route.name === 'SpeciesLoading';

  const {
    showMainNavigationStack,
    setInitialNavigationScreen,
    updateSpeciesSync,
    setUpdateSpeciesSync,
  } = React.useContext(NavigationContext);

  const [updatingSpeciesState, setUpdatingSpeciesState] = React.useState('INITIAL');

  const textMessage = isSpeciesLoadingScreen
    ? i18next.t('label.updating_species')
    : i18next.t('label.running_migration');

  const descriptionText = !isSpeciesLoadingScreen ? i18next.t('label.migration_description') : '';

  React.useEffect(() => {
    let syncSpecies = updateSpeciesSync;
    if (route.name !== 'SpeciesLoading') {
      // calls the migration function to migrate the realm
      migrateRealm()
        .then(async () => {
          // logs success in DB
          dbLog.info({
            logType: LogTypes.OTHER,
            message: 'DB migration successfully done',
          });

          // calls the function and stores whether species data was already loaded or not
          const isSpeciesLoaded = await AsyncStorage.getItem('isLocalSpeciesUpdated');

          if (!syncSpecies) {
            syncSpecies = await shouldUpdateSpeciesSync();
          }

          if (isSpeciesLoaded === 'true' && !syncSpecies) {
            setInitialNavigationScreen('');
            showMainNavigationStack();
          } else {
            navigation.navigate('SpeciesLoading');
          }
        })
        .catch(err => {
          dbLog.error({
            logType: LogTypes.OTHER,
            message: 'Failed to migrate the Realm Database',
            logStack: JSON.stringify(err),
          });
          console.error('Error while setting up realm connection - App', err);
        });
    } else {
      // calls this function to update the species in the realm DB
      updateAndSyncLocalSpecies(setUpdatingSpeciesState, syncSpecies)
        .then(() => {
          setUpdateSpeciesSync(false);
          setInitialNavigationScreen('');
          showMainNavigationStack();
        })
        .catch(err => {
          dbLog.error({
            logType: LogTypes.OTHER,
            message: 'Failed to update and sync local species',
            logStack: JSON.stringify(err),
          });
          setUpdateSpeciesSync(false);
          setInitialNavigationScreen('');
          showMainNavigationStack();
        });
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.imageContainer}>
        <SvgXml xml={isSpeciesLoadingScreen ? mobile_download : cloud_sync} />
      </View>
      <View>
        <Text style={styles.textStyle}>{textMessage}</Text>
        {isSpeciesLoadingScreen ? (
          <SpeciesContainer updatingSpeciesState={updatingSpeciesState} />
        ) : (
          <Text style={styles.descriptionText}>{descriptionText}</Text>
        )}
        <ActivityIndicator size="large" color={Colors.PRIMARY} style={styles.activityIndicator} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
    backgroundColor: Colors.WHITE,
  },
  imageContainer: {
    width: '90%',
    height: '50%',
  },
  textStyle: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_30,
    color: Colors.TEXT_COLOR,
    textAlign: 'center',
  },
  descriptionText: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_16,
    color: Colors.TEXT_COLOR,
    textAlign: 'center',
    marginTop: 20,
  },
  activityIndicator: {
    paddingVertical: 20,
  },
});
