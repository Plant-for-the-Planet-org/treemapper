import i18next from 'i18next';
import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, Typography } from '../../styles';
import { putAuthenticatedRequest } from '../../utils/api';
import { PrimaryButton } from '../Common';
import CustomDropDownPicker from '../Common/Dropdown/CustomDropDownPicker';

export const FrequencySelector = ({
  selectedFrequency,
  setSelectedFrequency,
}: {
  selectedFrequency: string;
  setSelectedFrequency: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const [isCustomSelected, setIsCustomSelected] = useState(false);
  const [showIntervalOptions, setShowIntervalOptions] = useState(false);
  const [selectedIntervalOption, setSelectedIntervalOption] = useState(false);
  const customInputRef = useRef(null);
  const intervalOptions = [
    { value: 'days', label: 'Days' },
    { value: 'weeks', label: 'Weeks' },
    { value: 'months', label: 'Months' },
    { value: 'years', label: 'Years' },
  ];
  const allFrequencies = ['Monthly', 'Quarterly', 'Semiyearly', 'Yearly'];
  return (
    <View style={styles.FrequencySelectionContainer}>
      {/* if sample tree count is present and has length greater than zero then maps the array */}
      {allFrequencies &&
        allFrequencies.length > 0 &&
        allFrequencies.map((treeCount: string, index: number) => {
          // used to show the selected tree count selected by user
          const isSelected = treeCount === selectedFrequency;
          return (
            <TouchableOpacity
              onPress={() => {
                setIsCustomSelected(false);
                setSelectedFrequency(treeCount);
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
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      <View style={{ flexDirection: 'row', justifyContent: 'center', width: '100%' }}>
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={() => {
            setIsCustomSelected(true);
            setSelectedFrequency('');
            if (customInputRef?.current) {
              customInputRef.current.focus();
            }
          }}>
          <View
            style={[
              styles.treeCountInputSelection,
              isCustomSelected ? styles.treeCountSelectionActive : {},
              //   { backgroundColor: '#ffffff' },
            ]}>
            <TextInput
              value={selectedFrequency}
              style={[
                styles.customTreeCount,
                {
                  borderBottomColor: isCustomSelected ? Colors.WHITE : Colors.TEXT_COLOR,
                  backgroundColor: isCustomSelected ? Colors.PRIMARY : Colors.WHITE,
                },
              ]}
              selectionColor={'white'}
              keyboardType={'numeric'}
              onFocus={() => {
                setIsCustomSelected(true);
                setSelectedFrequency('');
              }}
              textAlign={'center'}
              ref={customInputRef}
              onChangeText={text => {
                setSelectedFrequency(text.replace(/,./g, '').replace(/[^0-9]/g, ''));
              }}
            />
            <View>
              <CustomDropDownPicker
                items={intervalOptions}
                open={showIntervalOptions}
                setOpen={setShowIntervalOptions}
                value={selectedIntervalOption}
                setValue={setSelectedIntervalOption}
                style={{
                  marginLeft: 16,
                  width: 110,
                  borderWidth: 0,
                  backgroundColor: isCustomSelected ? Colors.PRIMARY : Colors.WHITE,
                }}
                textStyle={{
                  color: isCustomSelected ? Colors.WHITE : Colors.TEXT_COLOR,
                }}
                listItemLabelStyle={{ color: Colors.TEXT_COLOR }}
                iconColor={isCustomSelected ? Colors.WHITE : Colors.GRAY_LIGHTEST}
                zIndex={3000}
                zIndexInverse={1000}
              />
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};
const Frequency = ({ projectId }: { projectId: string }) => {
  const [selectedFrequency, setSelectedFrequency] = useState('');
  console.log(projectId, 'projectId');

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={[styles.scene, styles.defaultSpacing, { flex: 1 }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}>
          <View>
            <Text style={[styles.description, styles.descriptionMarginTop]}>
              {i18next.t('label.select_frequency_for_remeasurement')}
            </Text>
            <FrequencySelector
              selectedFrequency={selectedFrequency}
              setSelectedFrequency={setSelectedFrequency}
            />
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
      <View style={{ marginHorizontal: 25, display: 'flex', justifyContent: 'flex-end' }}>
        <PrimaryButton
          onPress={() => {
            console.log('Save');
            putAuthenticatedRequest(`/app/projects/${projectId}`, { frequency: 50 }).then();
          }}
          btnText={i18next.t('label.save')}
        />
      </View>
    </View>
  );
};

export default Frequency;

const styles = StyleSheet.create({
  scene: {
    flex: 1,
  },

  defaultSpacing: {
    paddingHorizontal: 25,
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
  FrequencySelectionContainer: {
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
    backgroundColor: Colors.WHITE,
    padding: 20,
    marginBottom: 15,
    minWidth: '45%',
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
    backgroundColor: Colors.PRIMARY,
  },
  treeCountSelectionText: {
    color: Colors.TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_18,
    letterSpacing: 0.5,
    textAlign: 'center',
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
});
