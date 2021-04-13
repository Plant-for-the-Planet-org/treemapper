import { useNavigation, useRoute } from '@react-navigation/native';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { auth0Logout } from '../../actions/user';
import { shouldSpeciesUpdate } from '../../repositories/species';
import { Colors, Typography } from '../../styles';
import { checkAndAddUserSpecies } from '../../utils/addUserSpecies';
import { Header, PrimaryButton } from '../Common';

interface ManageProjectsProps {}

export default function ManageProjects({}: ManageProjectsProps) {
  const [isSyncRequired, setIsSyncRequired] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [shouldSelectProject, setShouldSelectProject] = useState<boolean>(false);

  const navigation = useNavigation();
  const route: any = useRoute();

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

  useEffect(() => {
    setShouldSelectProject(route.params?.shouldSelectProject);
  }, [route.params]);

  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={styles.container}>
        <Header
          headingText={
            shouldSelectProject
              ? i18next.t('label.select_project')
              : i18next.t('label.manage_projects')
          }
        />
      </View>

      <View style={[styles.bottomBtnsContainer, { justifyContent: 'space-between' }]}>
        <PrimaryButton
          onPress={onPressContinueAnyway}
          btnText={isSyncRequired ? i18next.t('label.logout_anyway') : i18next.t('label.logout')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
  },
  bottomBtnsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 25,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.WHITE,
    justifyContent: 'space-between',
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
  },
});
