import i18next from 'i18next';
import React from 'react';
import { Linking, Platform } from 'react-native';
import AlertModal from '../AlertModal';

const isAndroid = Platform.OS === 'android';

interface IPermissionDeniedAlertProps {
  isPermissionDeniedAlertShow: boolean;
  setIsPermissionDeniedAlertShow: React.Dispatch<React.SetStateAction<boolean>>;
  onPressPrimaryBtn: any;
  onPressSecondaryBtn: any;
}

export const PermissionDeniedAlert = ({
  isPermissionDeniedAlertShow,
  setIsPermissionDeniedAlertShow,
  onPressPrimaryBtn,
  onPressSecondaryBtn,
}: IPermissionDeniedAlertProps) => {
  return (
    <AlertModal
      visible={isPermissionDeniedAlertShow}
      heading={i18next.t('label.permission_denied')}
      message={i18next.t('label.permission_denied_message')}
      primaryBtnText={i18next.t('label.ok')}
      secondaryBtnText={i18next.t('label.back')}
      onPressPrimaryBtn={() => {
        setIsPermissionDeniedAlertShow(false);
        onPressPrimaryBtn();
      }}
      onPressSecondaryBtn={() => {
        setIsPermissionDeniedAlertShow(false);
        onPressSecondaryBtn();
      }}
      showSecondaryButton={true}
    />
  );
};

interface IPermissionBlockAlertProps {
  isPermissionBlockedAlertShow: boolean;
  setIsPermissionBlockedAlertShow: React.Dispatch<React.SetStateAction<boolean>>;
  onPressPrimaryBtn: any;
  onPressSecondaryBtn: any;
}

export const PermissionBlockedAlert = ({
  isPermissionBlockedAlertShow,
  setIsPermissionBlockedAlertShow,
  onPressPrimaryBtn,
  onPressSecondaryBtn,
}: IPermissionBlockAlertProps) => {
  return (
    <AlertModal
      visible={isPermissionBlockedAlertShow}
      heading={i18next.t('label.permission_blocked')}
      message={i18next.t('label.permission_blocked_message')}
      primaryBtnText={i18next.t('label.open_settings')}
      secondaryBtnText={i18next.t('label.back')}
      onPressPrimaryBtn={() => {
        setIsPermissionBlockedAlertShow(false);
        onPressPrimaryBtn();
        if (isAndroid) {
          Linking.openSettings();
        } else {
          Linking.openURL('app-settings');
        }
      }}
      onPressSecondaryBtn={() => {
        setIsPermissionBlockedAlertShow(false);
        onPressSecondaryBtn();
      }}
      showSecondaryButton={true}
    />
  );
};
