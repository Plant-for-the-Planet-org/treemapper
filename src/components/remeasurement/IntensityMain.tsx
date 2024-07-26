import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Colors, Typography } from 'src/utils/constants'
import CustomButton from '../common/CustomButton';
import { scaleSize } from 'src/utils/constants/mixins';
import IntensitySelector from './IntensitySelector';
import { AvoidSoftInput, AvoidSoftInputView } from "react-native-avoid-softinput";

interface Props {
  intensity: any
}


const Intensity = (props: Props) => {
  const { intensity } = props
  const [selectedIntensity, setSelectedIntensity] = useState();


  useEffect(() => {
    AvoidSoftInput.setShouldMimicIOSBehavior(true); //todo check this behavior or android/ios and finalize
    return () => {
      AvoidSoftInput.setShouldMimicIOSBehavior(true);
    };
  }, [])

  useEffect(() => {
    if (intensity) {
      setSelectedIntensity(intensity);
    }
  }, [intensity]);

  return (
    <AvoidSoftInputView
      avoidOffset={20}
      style={{ flex: 1 }}>
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
          {/* <Text>{i18next.t('label.cant_change_intensity')}</Text> */}
          <CustomButton
            label={i18next.t('label.save')}
            containerStyle={styles.btnContainer}
            pressHandler={() => { }}
          />
        </View>
      </View>
    </AvoidSoftInputView>
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
    fontSize: 16,
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
  btnContainer: {
    width: '100%',
    height: scaleSize(70),
    position: 'absolute',
    bottom: 50,
  },
});
