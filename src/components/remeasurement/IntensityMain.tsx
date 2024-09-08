import i18next from 'i18next';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Colors, Typography } from 'src/utils/constants';
import CustomButton from '../common/CustomButton';
import IntensitySelector from './IntensitySelector';
import { AvoidSoftInput, AvoidSoftInputView } from 'react-native-avoid-softinput';

interface Props {
  intensity: any;
  setSelectedIntensity: (i: number) => void
  save: () => void
  loading: boolean
}

const Intensity: React.FC<Props> = (props: Props) => {
  const { setSelectedIntensity, intensity, save, loading } = props;

  useEffect(() => {
    AvoidSoftInput.setShouldMimicIOSBehavior(true);
    return () => {
      AvoidSoftInput.setShouldMimicIOSBehavior(false);
    };
  }, []);


  return (
    <AvoidSoftInputView avoidOffset={20} style={{ flex: 1 }} showAnimationDuration={200}>
      <View style={[styles.scene, styles.defaultSpacing]}>
        <ScrollView style={styles.scrollView}>
          <Text style={[styles.description, styles.descriptionMarginTop]}>
            {i18next.t('label.select_intensity_for_remeasurement')}
          </Text>
          <IntensitySelector
            selectedIntensity={intensity}
            setSelectedIntensity={setSelectedIntensity}
          />
        </ScrollView>
        <CustomButton
          label={i18next.t('label.save')}
          containerStyle={styles.btnContainer}
          pressHandler={save}
          disable={loading}
          loading={loading}
        />
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
    paddingTop: 10,
  },
  scrollView: {
    paddingHorizontal: 25,
  },
  description: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: 16,
    color: Colors.TEXT_COLOR,
  },
  descriptionMarginTop: {
    marginTop: 20,
  },
  buttonContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginHorizontal: 25,
  },
  btnContainer: {
    width: '100%',
    height: 80,
    position: 'absolute',
    bottom: 30,
  },
});
