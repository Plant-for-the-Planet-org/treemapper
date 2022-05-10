import { useRoute } from '@react-navigation/native';
import i18next from 'i18next';
import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SceneMap, TabView } from 'react-native-tab-view';
import { AlertModal, Header, Loader, PrimaryButton } from '../../components/Common';
import CustomTabBar from '../../components/Common/CustomTabBar';
import IconSwitcher from '../../components/Common/IconSwitcher';
import Frequency from '../../components/ProjectConfig/Frequency';
import Intensity from '../../components/ProjectConfig/Intensity';
import { getProjectById } from '../../repositories/projects';
import { Colors, Typography } from '../../styles';
import { putAuthenticatedRequest } from '../../utils/api';

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
  scene: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  defaultSpacing: {
    paddingHorizontal: 25,
    paddingTop: 10,
  },
  logStyle: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_12,
    lineHeight: Typography.LINE_HEIGHT_20,
    color: Colors.TEXT_COLOR,
    paddingVertical: 5,
  },
  description: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_18,
    color: Colors.TEXT_COLOR,
  },
  descriptionMarginTop: {
    marginTop: 20,
  },
  intensitySelectionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 40,
    alignContent: 'center',
  },
  treeCountSelection: {
    borderRadius: 8,
    borderWidth: 1,
    marginRight: '5%',
    borderColor: Colors.LIGHT_BORDER_COLOR,
    padding: 20,
    marginBottom: 15,
    minWidth: '45%',
  },
  treeCountInputSelection: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.LIGHT_BORDER_COLOR,
    padding: 20,
    marginBottom: 15,
    alignSelf: 'center',
    minWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  treeCountSelectionActive: {
    borderWidth: 0,
    padding: 22,
    backgroundColor: Colors.PRIMARY,
  },
  treeCountSelectionText: {
    color: Colors.TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_20,
    textAlign: 'center',
  },
  treeCountSelectionActiveText: {
    color: Colors.WHITE,
    fontFamily: Typography.FONT_FAMILY_BOLD,
  },
  customTreeCount: {
    borderBottomWidth: 1,
    paddingVertical: 0,
    alignSelf: 'center',
    width: 70,
    color: Colors.WHITE,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_20,
  },
});
