import React, { useState } from 'react'
import { View, TouchableOpacity, Text, TextInput, StyleSheet } from "react-native";
import { Typography, Colors } from "src/utils/constants";
import { scaleSize } from "src/utils/constants/mixins";

const IntensitySelector = ({
  selectedIntensity,
  setSelectedIntensity,
}: {
  selectedIntensity: number;
  setSelectedIntensity: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const allIntensities = [100, 75, 50, 25];
  const [inputIntensity, setInputIntensity] = useState('')
  return (
    <View style={styles.intensitySelectionContainer}>
      {/* if sample tree count is present and has length greater than zero then maps the array */}
      {allIntensities &&
        allIntensities.length > 0 &&
        allIntensities.map((intensity: number, index: number) => {
          // used to show the selected tree count selected by user
          const isSelected = intensity === selectedIntensity
          return (
            <TouchableOpacity
              key={String(intensity) + String(index)}
              onPress={() => { setSelectedIntensity(intensity) }}>
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
      <View
        style={[
          styles.treeCountInputSelection,
        ]}>
        <TextInput
          style={[
            styles.customTreeCount,
            { borderBottomColor: Colors.TEXT_COLOR },
          ]}
          keyboardType={'numeric'}
          value={inputIntensity}
          placeholder={String(selectedIntensity)}
          returnKeyType='done'
          onBlur={()=>{
            setSelectedIntensity(Number(inputIntensity))
          }}
          onChangeText={setInputIntensity}
        />
        <Text
          style={[
            styles.treeCountSelectionText,
          ]}>
          {'%'}
        </Text>
      </View>
    </View>
  );
};

export default IntensitySelector

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
    backgroundColor: Colors.NEW_PRIMARY,
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
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_20,
    textAlign: "center"
  },
  btnContainer: {
    width: '100%',
    height: scaleSize(70),
    position: 'absolute',
    bottom: 20,
  },
});
