import i18next from 'i18next';
import React, { useRef, useState } from 'react';
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
import { Colors, Typography } from '../../styles';

const IntensitySelctor = ({
  selectedIntensity,
  setSelectedIntensity,
}: {
  selectedIntensity: string;
  setSelectedIntensity: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const [isCustomSelected, setIsCustomSelected] = useState(false);
  const customInputRef = useRef(null);
  const allIntensities = ['100', '75', '50', '25'];
  return (
    <View style={styles.intensitySelectionContainer}>
      {/* if sample tree count is present and has length greater than zero then maps the array */}
      {allIntensities &&
        allIntensities.length > 0 &&
        allIntensities.map((treeCount: string, index: number) => {
          // used to show the selected tree count selected by user
          const isSelected = treeCount === selectedIntensity;
          return (
            <TouchableOpacity
              onPress={() => {
                setIsCustomSelected(false);
                setSelectedIntensity(treeCount);
              }}
              key={`tree-number-selection-${index}`}>
              <View
                style={[
                  styles.treeCountSelection,
                  isSelected ? styles.treeCountSelectionActive : {},
                  { marginRight: index % 2 == 0 ? '10%' : 0 },
                ]}>
                <Text
                  style={[
                    styles.treeCountSelectionText,
                    isSelected ? styles.treeCountSelectionActiveText : {},
                  ]}>
                  {treeCount}
                  {'%'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      <TouchableOpacity
        onPress={() => {
          setIsCustomSelected(true);
          setSelectedIntensity('');
          if (customInputRef?.current) {
            customInputRef.current.focus();
          }
        }}>
        <View
          style={[
            styles.treeCountInputSelection,
            isCustomSelected ? styles.treeCountSelectionActive : {},
          ]}>
          <TextInput
            value={selectedIntensity}
            style={[
              styles.customTreeCount,
              { borderBottomColor: isCustomSelected ? 'white' : Colors.TEXT_COLOR },
            ]}
            selectionColor={'white'}
            keyboardType={'numeric'}
            onFocus={() => {
              setIsCustomSelected(true);
              setSelectedIntensity('');
            }}
            textAlign={'center'}
            ref={customInputRef}
            onChangeText={text => {
              setSelectedIntensity(text.replace(/,./g, '').replace(/[^0-9]/g, ''));
            }}
          />
          <Text
            style={[
              styles.treeCountSelectionText,
              isCustomSelected ? styles.treeCountSelectionActiveText : {},
            ]}>
            {'%'}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <PrimaryButton
          onPress={() => {
            console.log('Save');
          }}
          btnText={i18next.t('label.save')}
        />
      </View>
      {/* <PrimaryButton
        btnText={i18next.t('label.save')}
        onPress={() => {
          console.log('Save');
        }}
        style={{ justifySelf: 'flex-end' }}
      /> */}
    </View>
  );
};
const FirstRoute = () => {
  const [selectedIntensity, setSelectedIntensity] = useState('');

  return (
    <View style={[styles.scene, styles.defaultSpacing]}>
      <Text style={[styles.description, styles.descriptionMarginTop]}>
        {i18next.t('label.select_intensity_for_remeasurement')}
      </Text>
      <IntensitySelctor
        selectedIntensity={selectedIntensity}
        setSelectedIntensity={setSelectedIntensity}
      />
    </View>
  );
};

const SecondRoute = () => <View style={[styles.scene, styles.defaultSpacing]}></View>;

const renderScene = SceneMap({
  intensity: FirstRoute,
  frequency: SecondRoute,
});

const ProjectConfig = ({ navigation }: { navigation: any }) => {
  const layout = useWindowDimensions();

  const [routeIndex, setRouteIndex] = React.useState(0);
  const [routes] = React.useState([
    { key: 'intensity', title: 'Intensity' },
    { key: 'frequency', title: 'Frequency' },
  ]);

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
