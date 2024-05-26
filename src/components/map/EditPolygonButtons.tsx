import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import Icon from '@expo/vector-icons/FontAwesome5';
import { Colors, Typography}from 'src/utils/constants'
import i18next from 'src/locales/index';
import { scaleSize, scaleFont } from 'src/utils/constants/mixins';
import CustomButton from '../common/CustomButton';

const IS_ANDROID = Platform.OS === 'android';

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
  isUndoDisabled = true,
  isRedoDisabled = true,
  saveGeoJSON,
  undoGeoJSON,
  redoGeoJSON,
  resetGeoJSON,
  disableButtons = true,
  isPointJSON = false,
}: IEditPolygonButtonsProps) => {
  return (
    <>
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
        <View style={styles.btnContainer}>
        <CustomButton
          label={i18next.t('label.reset')}
          containerStyle={styles.btnWrapper}
          pressHandler={resetGeoJSON}
          wrapperStyle={styles.borderWrapper}
          labelStyle={styles.highlightLabel}
          disable={disableButtons}
        />
        <CustomButton
          label={i18next.t('label.save')}
          containerStyle={styles.btnWrapper}
          pressHandler={saveGeoJSON}
          wrapperStyle={styles.noBorderWrapper}
          disable={disableButtons}
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
    top: IS_ANDROID ? 25 : 56,
    left: 25,
    alignItems: 'flex-start',
  },
  bottomButtons: {
    position: 'absolute',
    bottom: IS_ANDROID ? 36 : 72,
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
  btnContainer: {
    width: '100%',
    height: scaleSize(70),
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
  },
  btnWrapper: {
    flex: 1,
    width: '90%',
  },
  imageContainer: {
    widht: '100%',
    height: '100%',
  },
  borderWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 5,
    width: '90%',
    height: '80%',
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.PRIMARY_DARK,
  },
  noBorderWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 5,
    width: '90%',
    height: '80%',
    backgroundColor: Colors.PRIMARY_DARK,
    borderRadius: 12,
  },
  opaqueWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 5,
    width: '90%',
    height: '70%',
    backgroundColor: Colors.PRIMARY_DARK,
    borderRadius: 10,
  },
  highlightLabel: {
    fontSize: scaleFont(16),
    fontWeight: '400',
    color: Colors.PRIMARY_DARK,
  },
  normalLable: {
    fontSize: scaleFont(14),
    fontWeight: '400',
    color: Colors.WHITE,
    textAlign: 'center',
  },
});
