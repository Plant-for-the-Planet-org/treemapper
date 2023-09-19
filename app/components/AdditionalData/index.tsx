import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import i18next from 'i18next';
import { TabView } from 'react-native-tab-view';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import React, { useContext, useEffect, useState } from 'react';

import Form from './Form';
import Metadata from './Metadata';
import Header from '../Common/Header';
import {
  MULTI,
  SAMPLE,
  SINGLE,
  ON_SITE,
  OFF_SITE,
  REMEASUREMENT,
} from '../../utils/inventoryConstants';
import { Colors, Typography } from '../../styles';
import CustomTabBar from '../Common/CustomTabBar';
import { AdditionalDataContext } from '../../reducers/additionalData';

interface IRenderSceneProps {
  route: {
    key: string;
    title: string;
  };
}

export default function AdditionalData() {
  const initialTreeTypeOptions = [
    { key: 'all', disabled: false, value: i18next.t('label.all') },
    { key: SINGLE, disabled: false, value: i18next.t('label.single') },
    { key: MULTI, disabled: false, value: i18next.t('label.multiple') },
    { key: SAMPLE, disabled: false, value: i18next.t('label.sample') },
  ];

  const initialRegistrationTypeOptions = [
    { key: 'all', disabled: false, value: i18next.t('label.all') },
    { key: ON_SITE, disabled: false, value: i18next.t('label.on_site') },
    { key: OFF_SITE, disabled: false, value: i18next.t('label.off_site') },
    { type: REMEASUREMENT, disabled: false, value: i18next.t('label.remeasurement') },
  ];

  const [routeIndex, setRouteIndex] = useState(0);
  const [treeTypeOptions, setTreeTypeOptions] = useState<any>(initialTreeTypeOptions);
  const [registrationTypeOptions] = useState<any>(initialRegistrationTypeOptions);

  const [selectedTreeOption, setSelectedTreeOption] = useState<any>();

  const {
    forms,
    addFormsToState,
    addMetadataInState,
    updateStateFormData,
    treeType,
    setTreeType,
    registrationType,
    setRegistrationType,
    isInitialLoading,
    setIsInitialLoading,
    setFormLoading,
  } = useContext(AdditionalDataContext);

  const [tabRoutes] = useState([
    { key: 'form', title: i18next.t('label.additional_data_form') },
    { key: 'metadata', title: i18next.t('label.additional_data_metadata') },
  ]);
  const layout = useWindowDimensions();
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (isInitialLoading) {
        addFormsToState();
        addMetadataInState();
        setIsInitialLoading(false);
      }
    });
    return () => {
      unsubscribe();
      setTreeType('all');
      setRegistrationType('all');
    };
  }, [navigation]);

  useEffect(() => {
    setFormLoading(true);
    if (registrationType === OFF_SITE) {
      let treeOptions = initialTreeTypeOptions;
      const lastIndex = treeOptions.length - 1;
      treeOptions[lastIndex] = { ...treeOptions[lastIndex], disabled: true };
      setTreeTypeOptions(treeOptions);
      if (treeType === SAMPLE) {
        setSelectedTreeOption(treeOptions[0]);
        setTreeType('all');
      }
    } else {
      setTreeTypeOptions(initialTreeTypeOptions);
    }
    updateStateFormData(JSON.parse(JSON.stringify(forms)));
    setFormLoading(false);
  }, [treeType, registrationType]);

  const renderScene = ({ route }: IRenderSceneProps) => {
    switch (route.key) {
      case 'form':
        return (
          <Form
            treeTypeOptions={treeTypeOptions}
            selectedTreeOption={selectedTreeOption}
            registrationTypeOptions={registrationTypeOptions}
          />
        );
      case 'metadata':
        return <Metadata />;
      default:
        return <></>;
    }
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={{ flex: 1 }}>
        <View style={styles.defaultSpacing}>
          <Header
            closeIcon
            headingText={i18next.t('label.additional_data')}
            onBackPress={() => navigation.goBack()}
            TitleRightComponent={() => (
              <TouchableOpacity
                onPress={() => navigation.navigate('AdditionalDataSettings')}
                style={{ padding: 6 }}>
                <Icon name={'import-export'} size={30} color={Colors.TEXT_COLOR} />
              </TouchableOpacity>
            )}
          />
        </View>
        <TabView
          lazy
          navigationState={{ index: routeIndex, routes: tabRoutes }}
          renderScene={renderScene}
          onIndexChange={setRouteIndex}
          initialLayout={{ width: layout.width }}
          renderTabBar={props => (
            <CustomTabBar {...props} tabRoutes={tabRoutes} setRouteIndex={setRouteIndex} />
          )}
          swipeEnabled={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
});
