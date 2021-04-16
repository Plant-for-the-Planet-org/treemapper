import i18next from 'i18next';
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { Colors } from '../../styles';
import { Header } from '../Common';
import ProjectList from './ProjectList';

interface ManageProjectsProps {}

export default function ManageProjects({}: ManageProjectsProps) {
  return (
    <SafeAreaView style={styles.mainContainer}>
      <Header headingText={i18next.t('label.manage_projects')} />

      <ProjectList />

      {/* <View style={[styles.bottomBtnsContainer, { justifyContent: 'space-between' }]}>
        <PrimaryButton
          onPress={onPressContinueAnyway}
          btnText={isSyncRequired ? i18next.t('label.logout_anyway') : i18next.t('label.logout')}
        />
      </View> */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.WHITE,
    paddingHorizontal: 25,
  },
});
