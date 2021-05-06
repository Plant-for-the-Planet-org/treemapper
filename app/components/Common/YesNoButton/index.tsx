import i18next from 'i18next';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Typography } from '../../../styles';

interface IButtonProps {
  isAgreed: boolean;
  editable?: boolean;
  setIsAgreed?: any;
}

interface IYesNoButtonProps extends IButtonProps {
  containerStyle?: any;
  text: string;
}

interface ISingleButtonProps extends IButtonProps {
  buttonType: 'yes' | 'no';
}

const SingleButton = ({
  isAgreed,
  editable = true,
  setIsAgreed,
  buttonType,
}: ISingleButtonProps) => {
  const isActive = (isAgreed && buttonType === 'yes') || (!isAgreed && buttonType === 'no');
  const borderRadiusStyle =
    buttonType === 'yes' ? styles.borderLeftRadius : styles.borderRightRadius;

  return (
    <TouchableOpacity
      disabled={!editable}
      onPress={() => setIsAgreed(buttonType === 'yes')}
      style={[styles.yesNoButton, borderRadiusStyle, isActive ? styles.activeButton : {}]}>
      <Text style={[styles.buttonText, isActive ? styles.activeButtonText : {}]}>
        {i18next.t(`label.${buttonType}`)}
      </Text>
    </TouchableOpacity>
  );
};

const YesNoButton = ({
  text,
  isAgreed,
  editable = true,
  setIsAgreed = () => {},
  containerStyle = {},
}: IYesNoButtonProps) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.text}>{text}</Text>
      <View style={styles.yesNoButtonContainer}>
        <SingleButton
          isAgreed={isAgreed}
          editable={editable}
          setIsAgreed={setIsAgreed}
          buttonType="yes"
        />
        <SingleButton
          isAgreed={isAgreed}
          editable={editable}
          setIsAgreed={setIsAgreed}
          buttonType="no"
        />
      </View>
    </View>
  );
};

export default YesNoButton;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  text: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_16,
    color: Colors.TEXT_COLOR,
    marginRight: 16,
    flex: 1,
  },
  yesNoButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    borderColor: Colors.PRIMARY,
  },
  yesNoButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_12,
    color: Colors.TEXT_COLOR,
  },
  activeButtonText: {
    color: Colors.WHITE,
  },
  activeButton: {
    backgroundColor: Colors.PRIMARY,
  },
  borderRightRadius: {
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  borderLeftRadius: {
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
});
