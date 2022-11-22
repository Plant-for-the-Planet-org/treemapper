import i18next from 'i18next';
import React, {useEffect, useState} from 'react';
import {StyleSheet, Switch, Text, View, Keyboard} from 'react-native';
import {Typography, Colors} from '../../styles';
import {DBHInMeter, meterToFoot} from '../../utils/constants';
import {getConvertedHeight} from '../../utils/measurements';
import OutlinedInput from './OutlinedInput';

type Props = {
  height: string;
  heightError: string;
  handleHeightChange: (text: string) => void;
  diameter: string;
  diameterError: string;
  handleDiameterChange: (text: string) => void;
  diameterRef: any;
  isNonISUCountry: boolean;
  showTagIdInput?: boolean;
  tagId?: string;
  tagIdError?: string;
  handleTagIdChange?: (text: string) => void;
  tagIdRef?: any;
  isTagIdPresent?: boolean;
  setIsTagIdPresent?: React.Dispatch<React.SetStateAction<boolean>>;
};

const MeasurementInputs = ({
  height,
  heightError,
  diameterError,
  diameterRef,
  handleHeightChange,
  diameter,
  handleDiameterChange,
  isNonISUCountry,
  showTagIdInput = false,
  tagId,
  tagIdError,
  handleTagIdChange,
  tagIdRef,
  isTagIdPresent,
  setIsTagIdPresent,
}: Props) => {
  const [diameterLabel, setDiameterLabel] = useState<string>(
    i18next.t('label.measurement_basal_diameter'),
  );

  useEffect(() => {
    if (!isTagIdPresent && handleTagIdChange) {
      handleTagIdChange('');
    }
  }, [isTagIdPresent]);

  // on every change in height value, checks if diameter label needs to be changed
  useEffect(() => {
    const convertedHeight = height ? getConvertedHeight(height, isNonISUCountry) : 0;

    if (convertedHeight < DBHInMeter) {
      setDiameterLabel(i18next.t('label.measurement_basal_diameter'));
    } else {
      setDiameterLabel(i18next.t('label.measurement_DBH'));
    }
  }, [height]);

  return (
    <View>
      <View style={styles.inputBox}>
        <View>
          <OutlinedInput
            value={height}
            onChangeText={(text: string) => handleHeightChange(text)}
            label={i18next.t('label.select_species_height')}
            keyboardType={'decimal-pad'}
            rightText={isNonISUCountry ? i18next.t('label.select_species_feet') : 'm'}
            error={heightError}
            autoFocus
            returnKeyType={'next'}
            onSubmitEditing={() => diameterRef.current.focus()}
          />
        </View>
      </View>

      <View style={[styles.inputBox, {zIndex: 1}]}>
        <View>
          <OutlinedInput
            value={diameter}
            onChangeText={(text: string) => handleDiameterChange(text)}
            label={diameterLabel}
            keyboardType={'decimal-pad'}
            rightText={isNonISUCountry ? i18next.t('label.select_species_inches') : 'cm'}
            error={diameterError}
            ref={diameterRef}
            returnKeyType={'done'}
            onSubmitEditing={Keyboard.dismiss}
            showInfo={true}
            infoText={i18next.t('label.measurement_diameter_info', {
              height: isNonISUCountry
                ? Math.round(DBHInMeter * meterToFoot * 1000) / 1000
                : DBHInMeter,
              unit: isNonISUCountry ? i18next.t('label.select_species_inches') : 'm',
            })}
          />
        </View>
      </View>

      {showTagIdInput ? (
        <>
          <View style={styles.switchContainer}>
            <Text style={styles.switchText}>
              {i18next.t('label.select_species_tagged_for_identification')}
            </Text>
            <Switch
              trackColor={{false: '#767577', true: '#d4e7b1'}}
              thumbColor={isTagIdPresent ? Colors.PRIMARY : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={() => setIsTagIdPresent(!isTagIdPresent)}
              value={isTagIdPresent}
            />
          </View>
          {isTagIdPresent && handleTagIdChange ? (
            <>
              <View style={styles.inputBox}>
                <View>
                  <OutlinedInput
                    value={tagId}
                    label={i18next.t('label.select_species_tree_tag')}
                    onChangeText={(text: string) => handleTagIdChange(text)}
                    error={tagIdError}
                    ref={tagIdRef}
                  />
                </View>
              </View>
            </>
          ) : (
            []
          )}
        </>
      ) : (
        []
      )}
    </View>
  );
};

export default MeasurementInputs;

const styles = StyleSheet.create({
  inputBox: {
    marginTop: 24,
    marginBottom: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  switchText: {
    color: Colors.TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    marginRight: 10,
    flex: 1,
  },
});
