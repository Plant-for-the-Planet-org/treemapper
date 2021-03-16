import React from 'react';
import AlertModal from '../AlertModal';

const VerifyEmailAlert = ({ emailAlert, setEmailAlert }) => {
  return (
    <AlertModal
      visible={emailAlert}
      heading={'Verify your Email'}
      message={'Please verify your email before logging in.'}
      primaryBtnText={'Ok'}
      onPressPrimaryBtn={() => setEmailAlert(false)}
    />
  );
};

export default VerifyEmailAlert;
