import i18next from 'src/locales/index';
import React from 'react';
import { Linking, Platform } from 'react-native';
import AlertModal from 'src/components/common/AlertModal';

const isAndroid = Platform.OS === 'android';

interface IPermissionDeniedAlertProps {
  isPermissionDeniedAlertShow: boolean;
  setIsPermissionDeniedAlertShow: React.Dispatch<React.SetStateAction<boolean>>;
  onPressPrimaryBtn: any;
  onPressSecondaryBtn: any;
  message?: string;
}

export const PermissionDeniedAlert = ({
  isPermissionDeniedAlertShow,
  setIsPermissionDeniedAlertShow,
  onPressPrimaryBtn,
  onPressSecondaryBtn,
  message = '',
}: IPermissionDeniedAlertProps) => {
  message = message || i18next.t('label.permission_denied_message');

  return (
    <AlertModal
      visible={isPermissionDeniedAlertShow}
      heading={i18next.t('label.permission_denied')}
      message={message}
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
  message?: string;
}

export const PermissionBlockedAlert = ({
  isPermissionBlockedAlertShow,
  setIsPermissionBlockedAlertShow,
  onPressSecondaryBtn,
  message = '',
}: IPermissionBlockAlertProps) => {
  message = message || i18next.t('label.permission_blocked_message');
  return (
    <AlertModal
      visible={isPermissionBlockedAlertShow}
      heading={i18next.t('label.permission_blocked')}
      message={message}
      primaryBtnText={i18next.t('label.open_settings')}
      secondaryBtnText={i18next.t('label.back')}
      onPressPrimaryBtn={() => {
        setIsPermissionBlockedAlertShow(false);
        if (isAndroid) {
          Linking.openSettings();
        } else {
          Linking.openURL('app-settings:')
          .catch((err) => {
            console.error('Failed to open settings:', err);
          });
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
