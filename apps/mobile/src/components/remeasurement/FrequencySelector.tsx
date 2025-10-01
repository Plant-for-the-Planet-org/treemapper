import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, Typography } from 'src/utils/constants'
import { scaleSize } from 'src/utils/constants/mixins';
import i18next from 'src/locales/index';
interface FrequencyData {
  type: string
  description: string
  key: string
}

export const FrequencySelector = ({
  selectedFrequency,
  setSelectedFrequency,
}: {
  selectedFrequency: string;
  setSelectedFrequency: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const allFrequencies: FrequencyData[] = [
    {
      type: 'Default',
      description: i18next.t("label.remeasurement_default"),
      key:"default"
    },
    {
      type: 'High',
      description: i18next.t("label.remeasurement_high"),
      key:"high"
    },
    {
      type: 'Low',
      description: i18next.t("label.remeasurement_low"),
      key:"low"
    },
  ];
  return (
    <View style={styles.FrequencySelectionContainer}>
      {/* if sample tree count is present and has length greater than zero then maps the array */}
      {allFrequencies &&
        allFrequencies.length > 0 &&
        allFrequencies.map((frequency: FrequencyData, i) => {
          // used to show the selected tree count selected by user
          const isSelected = frequency.key === selectedFrequency;
          return (
            <TouchableOpacity
              key={String(frequency) + String(i)}
              onPress={() => {
                setSelectedFrequency(frequency.key);
              }}
            >
              <View
                style={[
                  styles.treeCountSelection,
                  isSelected ? styles.treeCountSelectionActive : {},
                ]}>
                <Text
                  style={[
                    styles.treeCountSelectionText,
                    isSelected ? styles.treeCountSelectionActiveText : {},
                  ]}>
                  {frequency.type}
                </Text>
                <Text
                  style={[
                    styles.frequencyDescription,
                    { color: isSelected ? Colors.WHITE : Colors.TEXT_COLOR },
                  ]}>
                  {frequency.description}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
    </View>
  );
};

export default FrequencySelector;

const styles = StyleSheet.create({
  scene: {
    flex: 1,
  },

  defaultSpacing: {
    paddingHorizontal: 25,
    paddingTop: 10,
    paddingBottom: 50,
  },
  description: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_18,
    color: Colors.TEXT_COLOR,
  },
  descriptionMarginTop: {
    marginTop: 20,
  },
  FrequencySelectionContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginVertical: 40,
    alignContent: 'center',
  },
  treeCountSelection: {
    display: 'flex',
    alignItems: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.LIGHT_BORDER_COLOR,
    backgroundColor: Colors.WHITE,
    padding: 20,
    marginBottom: 15,
    minWidth: '45%',
  },
  frequencyDescription: {
    marginTop: 8,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    color: Colors.TEXT_COLOR,
    lineHeight: 14.8,
  },
  treeCountInputSelection: {
    width: '100%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.LIGHT_BORDER_COLOR,
    padding: 20,
    paddingRight: 0,
    marginBottom: 16,
    alignSelf: 'center',
    // minWidth: '80%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignContent: 'center',
  },
  treeCountSelectionActive: {
    borderWidth: 0,
    padding: 20,
    backgroundColor: Colors.NEW_PRIMARY,
  },
  treeCountSelectionText: {
    color: Colors.TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: Typography.FONT_WEIGHT_BOLD,
  },
  treeCountSelectionActiveText: {
    color: Colors.WHITE,
    fontFamily: Typography.FONT_FAMILY_BOLD,
  },
  customTreeCount: {
    flex: 1,
    borderBottomWidth: 1,
    paddingVertical: 0,
    alignSelf: 'center',
    width: 70,
    color: Colors.WHITE,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_20,
  },
  btnContainer: {
    width: '100%',
    height: scaleSize(70),
    position: 'absolute',
    bottom: 20,
  },
});
