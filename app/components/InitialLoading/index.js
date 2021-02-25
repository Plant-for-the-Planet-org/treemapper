import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Colors, Typography } from '_styles';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SvgXml } from 'react-native-svg';
import { mobile_download, cloud_sync } from '../../assets';
import i18next from 'i18next';
import { migrateRealm } from '../../repositories/default';
import updateAndSyncLocalSpecies from '../../utils/updateAndSyncLocalSpecies';
import AsyncStorage from '@react-native-community/async-storage';
import { NavigationContext } from '../../reducers/navigation';
import { showMainNavigationStack } from '../../actions/navigation';
import dbLog from '../../repositories/logs';
import { LogTypes } from '../../utils/constants';

export default function InitialLoading() {
  const route = useRoute();
  const navigation = useNavigation();

  const { dispatch } = React.useContext(NavigationContext);

  const textMessage =
    route.name === 'SpeciesLoading'
      ? i18next.t('label.updating_species')
      : i18next.t('label.running_migration');

  const descriptionText =
    route.name === 'SpeciesLoading'
      ? i18next.t('label.migration_description')
      : i18next.t('label.migration_description');

  React.useEffect(() => {
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

          if (isSpeciesLoaded === 'true') {
            showMainNavigationStack()(dispatch);
          } else {
            navigation.navigate('SpeciesLoading');
          }
        })
        .catch((err) => {
          console.error('Error while setting up realm connection - App', err);
        });
    } else {
      // calls this function to update the species in the realm DB
      updateAndSyncLocalSpecies()
        .then(() => showMainNavigationStack()(dispatch))
        .catch(() => showMainNavigationStack()(dispatch));
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.imageContainer}>
        <SvgXml xml={route.name === 'SpeciesLoading' ? mobile_download : cloud_sync} />
      </View>
      <View>
        <Text style={styles.textStyle}>{textMessage}</Text>
        <Text style={styles.descriptionText}>{descriptionText}</Text>
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
});
