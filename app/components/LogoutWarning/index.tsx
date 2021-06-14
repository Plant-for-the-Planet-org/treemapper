import { useNavigation } from '@react-navigation/native';
import i18next from 'i18next';
import React, { useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View, Image } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { auth0Logout } from '../../actions/user';
import { sync_to_cloud } from '../../assets';
import { shouldSpeciesUpdate } from '../../repositories/species';
import { Typography, Colors } from '../../styles';
import { checkAndAddUserSpecies } from '../../utils/addUserSpecies';
import { Header, PrimaryButton } from '../Common';

interface LogoutWarningProps {}

export default function LogoutWarning(props: LogoutWarningProps) {
  const [isSyncRequired, setIsSyncRequired] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const navigation = useNavigation();

  const onPressContinueAnyway = () => {
    auth0Logout().then(() => navigation.goBack());
  };

  const onPressSync = () => {
    setIsSyncing(true);
    checkAndAddUserSpecies().then(() => {
      shouldSpeciesUpdate()
        .then((isRequired) => {
          setIsSyncRequired(isRequired);
          setIsSyncing(false);
        })
        .catch((err) => {
          setIsSyncing(false);
        });
    });
  };
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.mainContainer}>
        <View style={styles.container}>
          <Header />
        </View>
        <View style={styles.bannerContainer}>
          <SvgXml xml={sync_to_cloud} />
        </View>

        <View style={styles.messageContainer}>
          <Text style={[styles.syncMessage, isSyncing ? { marginBottom: 20 } : {}]}>
            {isSyncing
              ? i18next.t('label.species_sync_might_take_time')
              : isSyncRequired
              ? i18next.t('label.sync_required_message')
              : i18next.t('label.all_species_synced')}
          </Text>
          {isSyncing ? (
            <ActivityIndicator
              size="large"
              color={Colors.PRIMARY}
              style={{ paddingVertical: 20 }}
            />
          ) : (
            []
          )}
        </View>
        <View style={[styles.bottomBtnsContainer, { justifyContent: 'space-between' }]}>
          {isSyncRequired && (
            <PrimaryButton
              disabled={isSyncing}
              onPress={onPressSync}
              btnText={i18next.t('label.sync')}
              theme={'white'}
              halfWidth={true}
            />
          )}
          <PrimaryButton
            disabled={isSyncing}
            onPress={onPressContinueAnyway}
            btnText={isSyncRequired ? i18next.t('label.logout_anyway') : i18next.t('label.logout')}
            halfWidth={isSyncRequired}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // paddingHorizontal: 25,
  },
  bottomBtnsContainer: {
    flexDirection: 'row',
    // paddingHorizontal: 25,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.WHITE,
    justifyContent: 'space-between',
    paddingHorizontal: 25,
  },
  syncMessage: {
    color: Colors.TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_18,
    textAlign: 'center',
  },
  messageContainer: {
    flex: 1,
    marginVertical: 20,
  },
  bannerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
  },
});
