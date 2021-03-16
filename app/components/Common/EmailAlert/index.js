import React from 'react';
import AlertModal from '../AlertModal';

const VerifyEmailAlert = ({ emailAlert, setEmailAlert }) => {
  return (
    <AlertModal
      visible={emailAlert}
      heading={i18next.t('label.verify_email')}
      message={i18next.t('label.verify_email_message')}
      primaryBtnText={i18next.t('label.ok')}
      onPressPrimaryBtn={() => setEmailAlert(false)}
    />
  );
};

export default VerifyEmailAlert;
