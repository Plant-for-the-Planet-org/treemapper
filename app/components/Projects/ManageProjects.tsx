import i18next from 'i18next';
import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { Colors } from '../../styles';
import { Header } from '../Common';
import ProjectList from './ProjectList';

interface ManageProjectsProps {}

export default function ManageProjects({}: ManageProjectsProps) {
  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={styles.container}>
        <Header headingText={i18next.t('label.manage_projects')} />

        <ProjectList />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  container: {
    flex: 1,
    paddingHorizontal: 25,
  },
});
