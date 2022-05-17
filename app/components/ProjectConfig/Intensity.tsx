import i18next from 'i18next';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Colors, Typography } from '../../styles';
import { putAuthenticatedRequest } from '../../utils/api';
import { PrimaryButton } from '../Common';

export const IntensitySelector = ({
  selectedIntensity,
  setSelectedIntensity,
}: {
  selectedIntensity: number;
  setSelectedIntensity: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const [isCustomSelected, setIsCustomSelected] = useState(false);
  const customInputRef = useRef(null);
  const allIntensities = [100, 75, 50, 25];
  return (
    <View style={styles.intensitySelectionContainer}>
      {/* if sample tree count is present and has length greater than zero then maps the array */}
      {allIntensities &&
        allIntensities.length > 0 &&
        allIntensities.map((intensity: number, index: number) => {
          // used to show the selected tree count selected by user
          const isSelected = intensity === selectedIntensity;
          return (
            <TouchableOpacity
              onPress={() => {
                setIsCustomSelected(false);
                setSelectedIntensity(intensity);
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
                  {intensity}
                  {'%'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      <TouchableOpacity
        onPress={() => {
          setIsCustomSelected(true);
          setSelectedIntensity();
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
    </View>
  );
};
const Intensity = ({ projectId, project }: { projectId: string; project: object }) => {
  const [selectedIntensity, setSelectedIntensity] = useState();

  useEffect(() => {
    if (project?.intensity) {
      setSelectedIntensity(project.intensity);
    }
  }, [project]);

  return (
    <View
      style={[
        styles.scene,
        styles.defaultSpacing,
        // { justifyContent: 'space-between', backgroundColor: Colors.WHITE },
      ]}>
      <ScrollView style={{ paddingHorizontal: 25 }}>
        <Text style={[styles.description, styles.descriptionMarginTop]}>
          {i18next.t('label.select_intensity_for_remeasurement')}
        </Text>
        <IntensitySelector
          selectedIntensity={selectedIntensity}
          setSelectedIntensity={setSelectedIntensity}
        />
      </ScrollView>
      <View style={{ flexDirection: 'column', alignItems: 'center', marginHorizontal: 25 }}>
        <Text>{i18next.t('label.cant_change_intensity')}</Text>
        <PrimaryButton
          onPress={() => {
            putAuthenticatedRequest(`/app/projects/${projectId}`, { intensity: 50 }).then();
          }}
          disabled={true}
          btnText={i18next.t('label.save')}
        />
      </View>
    </View>
  );
};

export default Intensity;

const styles = StyleSheet.create({
  scene: {
    flex: 1,
  },

  defaultSpacing: {
    // paddingHorizontal: 25,
    paddingTop: 10,
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
