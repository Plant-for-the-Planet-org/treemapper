import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BackButton from '../Common/BackButton';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { Colors, Typography } from '../../styles';
import { PrimaryButton } from '../Common';
import i18next from 'i18next';

interface IEditPolygonButtonsProps {
  navigation: any;
  isUndoDisabled: boolean;
  isRedoDisabled: boolean;
  saveGeoJSON: any;
  undoGeoJSON: any;
  redoGeoJSON: any;
  resetGeoJSON: any;
  disableButtons: boolean;
  hid: string;
  isPointJSON?: boolean;
}

const EditPolygonButtons = ({
  navigation,
  isUndoDisabled = true,
  isRedoDisabled = true,
  saveGeoJSON,
  undoGeoJSON,
  redoGeoJSON,
  resetGeoJSON,
  disableButtons = true,
  hid,
  isPointJSON = false,
}: IEditPolygonButtonsProps) => {
  return (
    <>
      <View style={styles.extraInfoContainer}>
        <BackButton onBackPress={() => navigation.goBack()} />
        <Text style={styles.heading}>
          {isPointJSON ? i18next.t('label.edit_point') : i18next.t('label.edit_polygon')}
        </Text>
        <Text style={styles.text}>{i18next.t('label.edit_geometry_message')}</Text>
      </View>
      <View style={styles.bottomButtons}>
        {/* maps the undo redo buttons only visible if geometry is not point */}
        {!isPointJSON ? (
          <View style={styles.undoRedoContainer}>
            <TouchableOpacity
              disabled={isUndoDisabled}
              onPress={() => undoGeoJSON()}
              style={[styles.backIconContainer, { marginRight: 8 }]}>
              <Icon
                name="undo-alt"
                size={16}
                color={isUndoDisabled ? Colors.GRAY_DARK : Colors.TEXT_COLOR}
              />
            </TouchableOpacity>
            <TouchableOpacity
              disabled={isRedoDisabled}
              onPress={() => redoGeoJSON()}
              style={styles.backIconContainer}>
              <Icon
                name="redo-alt"
                size={16}
                color={isRedoDisabled ? Colors.GRAY_DARK : Colors.TEXT_COLOR}
              />
            </TouchableOpacity>
          </View>
        ) : (
          []
        )}

        {/* shows the reset and save button */}
        <View style={styles.buttonContainer}>
          <PrimaryButton
            halfWidth
            btnText={i18next.t('label.reset')}
            theme="white"
            onPress={resetGeoJSON}
            disabled={disableButtons}
          />
          <PrimaryButton
            halfWidth
            btnText={i18next.t('label.save')}
            onPress={saveGeoJSON}
            disabled={disableButtons}
          />
        </View>
      </View>
    </>
  );
};

export default EditPolygonButtons;

const styles = StyleSheet.create({
  extraInfoContainer: {
    position: 'absolute',
    top: 25,
    left: 25,
    alignItems: 'flex-start',
  },
  bottomButtons: {
    position: 'absolute',
    bottom: 25,
    left: 25,
    right: 25,
    flexDirection: 'column',
  },
  undoRedoContainer: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
  },
  heading: {
    fontFamily: Typography.FONT_FAMILY_EXTRA_BOLD,
    fontSize: Typography.FONT_SIZE_27,
    color: Colors.TEXT_COLOR,
    marginTop: 10,
  },
  text: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_14,
    color: Colors.TEXT_COLOR,
    marginTop: 4,
  },
  backIconContainer: {
    backgroundColor: Colors.WHITE,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.GRAY_LIGHT,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
});
