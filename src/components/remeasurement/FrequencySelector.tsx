import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, Typography } from 'src/utils/constants'
import { scaleSize } from 'src/utils/constants/mixins';

interface FrequencyData {
    type: string
    description: string
}

export const FrequencySelector = ({
  selectedFrequency,
  setSelectedFrequency,
}: {
  selectedFrequency: string;
  setSelectedFrequency: React.Dispatch<React.SetStateAction<string>>;
}) => {
  // const [isCustomSelected, setIsCustomSelected] = useState(false);
  // const [showIntervalOptions, setShowIntervalOptions] = useState(false);
  // const [selectedIntervalOption, setSelectedIntervalOption] = useState(false);
  // const customInputRef = useRef(null);

  
  const allFrequencies: FrequencyData[] = [
    {
      type: 'Default',
      description:
        'Re-measurement will happen after 1 year, 2 years, 5 years, 10 years, and then once in every 10 years.',
    },
    {
      type: 'High',
      description:
        'Re-measurement will happen after 6 months, 1 year, 1.5 years, 2 years, 3 years, 5 years, 7 years, 10 years, and then once in every 5 years.',
    },
    {
      type: 'Low',
      description:
        'Re-measurement will happen after  2 years,  10 years, 20 years and then once in every 20 years.',
    },
  ];
  return (
    <View style={styles.FrequencySelectionContainer}>
      {/* if sample tree count is present and has length greater than zero then maps the array */}
      {allFrequencies &&
        allFrequencies.length > 0 &&
        allFrequencies.map((frequency: FrequencyData, index: number) => {
          // used to show the selected tree count selected by user
          const isSelected = frequency.type === selectedFrequency;
          return (
            <TouchableOpacity
              onPress={() => {
                // setIsCustomSelected(false);
                setSelectedFrequency(frequency.type);
              }}
              key={`tree-number-selection-${index}`}>
              <View
                style={[
                  styles.treeCountSelection,
                  isSelected ? styles.treeCountSelectionActive : {},
                  // { marginRight: index % 2 == 0 ? '10%' : 0 },
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
    fontSize: Typography.FONT_SIZE_18,
    letterSpacing: 0.5,
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
