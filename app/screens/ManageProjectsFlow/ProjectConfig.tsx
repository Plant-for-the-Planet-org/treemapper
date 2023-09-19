import i18next from 'i18next';
import { TabView } from 'react-native-tab-view';
import React, { useEffect, useState } from 'react';
import { useRoute } from '@react-navigation/native';
import { View, StyleSheet, SafeAreaView, useWindowDimensions } from 'react-native';

import { Header } from '../../components/Common';
import { Colors, Typography } from '../../styles';
import { getProjectById } from '../../repositories/projects';
import CustomTabBar from '../../components/Common/CustomTabBar';
import Frequency from '../../components/ProjectConfig/Frequency';
import Intensity from '../../components/ProjectConfig/Intensity';

const ProjectConfig = ({ navigation }: { navigation: any }) => {
  const layout = useWindowDimensions();
  const ProjectRoute = useRoute();
  const [routeIndex, setRouteIndex] = React.useState(0);
  const [project, setProject] = useState({});
  const [routes] = React.useState([
    { key: 'intensity', title: 'Intensity' },
    { key: 'frequency', title: 'Frequency' },
  ]);

  useEffect(() => {
    if (ProjectRoute.params?.projectId) {
      getProjectById(ProjectRoute.params?.projectId)
        .then(data => {
          setProject(data);
        })
        .catch(err => {
          console.error(err);
        });
    }
  }, []);

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'intensity':
        return <Intensity projectId={ProjectRoute.params?.projectId} project={project} />;
      case 'frequency':
        return <Frequency projectId={ProjectRoute.params?.projectId} project={project} />;
      default:
        return null;
    }
  };
  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={styles.defaultSpacing}>
        <Header
          closeIcon
          headingText={i18next.t('label.project_config')}
          onBackPress={() => navigation.goBack()}
        />
      </View>
      <TabView
        navigationState={{ index: routeIndex, routes }}
        renderScene={renderScene}
        onIndexChange={setRouteIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={props => (
          <CustomTabBar {...props} tabRoutes={routes} setRouteIndex={setRouteIndex} />
        )}
      />
    </SafeAreaView>
  );
};
export default ProjectConfig;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  defaultSpacing: {
    paddingHorizontal: 25,
    paddingTop: 10,
  },
});
