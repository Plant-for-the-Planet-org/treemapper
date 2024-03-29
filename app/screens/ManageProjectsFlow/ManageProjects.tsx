import React from 'react';
import i18next from 'i18next';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, StyleSheet, View } from 'react-native';

import { Colors } from '../../styles';
import { Header } from '../../components/Common';
import ProjectList from '../../components/Projects/ProjectList';

interface ManageProjectsProps {}

const ManageProjects = ({}: ManageProjectsProps) => {
  const navigation = useNavigation();

  // const onProjectPress = (id: string) => {
  //   // navigation.navigate('ProjectConfig', { projectId: id });
  // };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={styles.container}>
        <Header headingText={i18next.t('label.manage_projects')} />

        <ProjectList isSelectable={false} />
      </View>
    </SafeAreaView>
  );
};

export default ManageProjects;

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
