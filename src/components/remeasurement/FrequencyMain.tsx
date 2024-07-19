import i18next from "i18next";
import React, { useState } from 'react'
import { View, ScrollView, Text, StyleSheet } from "react-native";
import CustomButton from "../common/CustomButton";
import FrequencySelector from "./FrequencySelector";
import { Typography, Colors } from "src/utils/constants";
import { scaleSize } from "src/utils/constants/mixins";

// interface Props {
//     projectDetails: any
//   }

const Frequency = () => {
    const [selectedFrequency, setSelectedFrequency] = useState('');

    return (
      <View style={{ flex: 1 }}>
        <ScrollView style={[styles.scene, styles.defaultSpacing, { flex: 1, zIndex: 1000 }]}>
          {/* <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}> */}
          <View>
            <Text style={[styles.description, styles.descriptionMarginTop]}>
              {i18next.t('label.select_frequency_for_remeasurement')}
            </Text>
            <FrequencySelector
              selectedFrequency={selectedFrequency}
              setSelectedFrequency={setSelectedFrequency}
            />
          </View>
          {/* </KeyboardAvoidingView> */}
        </ScrollView>
        <View style={{ flexDirection: 'column', alignItems: 'center', marginHorizontal: 25 }}>
          <Text>{i18next.t('label.cant_change_frequency')}</Text>
          <CustomButton
              label={i18next.t('label.save')}
              containerStyle={styles.btnContainer}
              pressHandler={()=>{}}
            />
        </View>
      </View>
    );
  };
  
  export default Frequency

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
      backgroundColor: Colors.PRIMARY,
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
      bottom: 40,
    },
  });
  