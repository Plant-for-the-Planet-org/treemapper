import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import Icon from '@expo/vector-icons/FontAwesome5';
import { Colors, Typography } from 'src/utils/constants'
import i18next from 'src/locales/index';
import { scaleSize, scaleFont } from 'src/utils/constants/mixins';
import CustomButton from '../common/CustomButton';

const IS_ANDROID = Platform.OS === 'android';

interface IEditPolygonButtonsProps {
  isUndoDisabled: boolean;
  isRedoDisabled: boolean;
  saveGeoJSON: any;
  undoGeoJSON: any;
  redoGeoJSON: any;
  resetGeoJSON: any;
  disableButtons: boolean;
  isPointJSON?: boolean;
}

const EditPolygonButtons = (props: IEditPolygonButtonsProps) => {
  const {
    isUndoDisabled = true,
    isRedoDisabled = true,
    saveGeoJSON,
    undoGeoJSON,
    redoGeoJSON,
    resetGeoJSON,
    disableButtons = true,
    isPointJSON = false,
  } = props
  return (
    <View style={styles.bottomButtonsEdit}>
      {/* maps the undo redo buttons only visible if geometry is not point */}
      {!isPointJSON ? (
        <View style={styles.undoRedoContainerEdit}>
          <TouchableOpacity
            disabled={isUndoDisabled}
            onPress={() => undoGeoJSON()}
            style={[styles.backIconContainerEdit, { marginRight: 8 }]}>
            <Icon
              name="undo-alt"
              size={16}
              color={isUndoDisabled ? Colors.GRAY_DARK : Colors.TEXT_COLOR}
            />
          </TouchableOpacity>
          <TouchableOpacity
            disabled={isRedoDisabled}
            onPress={() => redoGeoJSON()}
            style={styles.backIconContainerEdit}>
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
      <View style={styles.btnContainerEdit}>
        <CustomButton
          label={i18next.t('label.reset')}
          containerStyle={styles.btnWrapperEdit}
          pressHandler={resetGeoJSON}
          wrapperStyle={styles.borderWrapperEdit}
          labelStyle={styles.highlightLabelEdit}
          disable={disableButtons}
        />
        <CustomButton
          label={i18next.t('label.save')}
          containerStyle={styles.btnWrapperEdit}
          pressHandler={saveGeoJSON}
          wrapperStyle={styles.noBorderWrapperEdit}
          disable={disableButtons}
        />
      </View>
    </View>
  );
};

export default EditPolygonButtons;

const styles = StyleSheet.create({
  extraInfoContainerEdit: {
    position: 'absolute',
    top: IS_ANDROID ? 25 : 56,
    left: 25,
    alignItems: 'flex-start',
  },
  bottomButtonsEdit: {
    position: 'absolute',
    bottom: IS_ANDROID ? 36 : 72,
    left: 25,
    right: 25,
    flexDirection: 'column',
  },
  undoRedoContainerEdit: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
  },
  headingEdit: {
    fontFamily: Typography.FONT_FAMILY_EXTRA_BOLD,
    fontSize: Typography.FONT_SIZE_27,
    color: Colors.TEXT_COLOR,
    marginTop: 10,
  },
  textEdit: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_14,
    color: Colors.TEXT_COLOR,
    marginTop: 4,
  },
  backIconContainerEdit: {
    backgroundColor: Colors.WHITE,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.GRAY_LIGHT,
  },
  buttonContainerEdit: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  btnContainerEdit: {
    width: '100%',
    height: scaleSize(70),
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
  },
  btnWrapperEdit: {
    flex: 1,
    width: '90%',
  },
  imageContainerEdit: {
    width: '100%',
    height: '100%',
  },
  borderWrapperEdit: {
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
  noBorderWrapperEdit: {
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
  opaqueWrapperEdit: {
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
  highlightLabelEdit: {
    fontSize: scaleFont(16),
    fontWeight: '400',
    color: Colors.PRIMARY_DARK,
  },
  normalLabelEdit: {
    fontSize: scaleFont(14),
    fontWeight: '400',
    color: Colors.WHITE,
    textAlign: 'center',
  },
});
