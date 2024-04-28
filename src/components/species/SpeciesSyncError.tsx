import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNetInfo } from '@react-native-community/netinfo';
import i18next from 'src/locales/index';
import React, {useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Snackbar from 'react-native-snackbar';
import Icon from '@expo/vector-icons/FontAwesome5';
import { Colors, Typography } from 'src/utils/constants';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from 'src/types/type/navigation.type';

//Component which will be rendered on MainScreen and ManageSpecies when species are not synced or downloaded
const SpeciesSyncError = () => {
  const [asyncStorageSpecies, setAsyncStorageSpecies] = useState<any>(false);

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

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
        navigation.navigate('SyncSpecies', { inApp: true })
    } else {
      Snackbar.show({
        text: i18next.t('label.no_internet_connection'),
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: '#e74c3c',
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
      {asyncStorageSpecies !== 'true' && asyncStorageSpecies !== false ? (
        <View style={styles.speciesZipWarning}>
          <View style={{ width: '80%', marginRight: 16, flex: 4 }}>
            <Text style={styles.speciesHeading}>
              {i18next.t('label.species_sync_error_heading')}
            </Text>
            <Text style={styles.speciesText}>{i18next.t('label.species_sync_error_text')}</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              onPressRefreshIcon();
            }}
            style={{
              padding: 10,
              backgroundColor: '#FFC400',
              borderRadius: 40,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Icon name="sync-alt" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      ) : (
        []
      )}
      </View>
    </View>
  );
};

export default SpeciesSyncError;

const styles = StyleSheet.create({
  container:{
    width:'100%',
    justifyContent:'center',
    alignItems:'center',
    marginTop: 10,
  },  
  wrapper:{
    width:'90%'
  },
  speciesZipWarning: {
    borderRadius: 12,
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
