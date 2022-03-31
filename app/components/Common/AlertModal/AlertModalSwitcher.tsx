import i18next from 'i18next';
import React from 'react';
import AlertModal from '.';
import { ModalType } from '../../../utils/constants';

type Props = {
  visible: boolean;
  type: ModalType;
  setVisible?: React.Dispatch<React.SetStateAction<boolean>>;
  onPressPrimaryButton?: () => void;
  onPressSecondaryButton?: () => void;
};

const AlertModalSwitcher = ({
  visible,
  setVisible = () => {},
  type,
  onPressPrimaryButton = () => {},
  onPressSecondaryButton = () => {},
}: Props) => {
  switch (type) {
    case ModalType.LOCATION_SERVICE_NOT_SATISFIED:
      return (
        <AlertModal
          visible={visible}
          heading="Alert"
          message="This is an alert"
          primaryBtnText="OK"
          onPressPrimaryBtn={onPressPrimaryButton}
          showSecondaryButton={false}
          secondaryBtnText=""
          onPressSecondaryBtn={onPressSecondaryButton}
        />
      );
    case ModalType.POOR_ACCURACY:
      return (
        <AlertModal
          visible={visible}
          heading={i18next.t('label.poor_accuracy')}
          message={i18next.t('label.poor_accuracy_message')}
          primaryBtnText={i18next.t('label.try_again')}
          onPressPrimaryBtn={onPressPrimaryButton}
          showSecondaryButton={true}
          secondaryBtnText={i18next.t('label.continue')}
          onPressSecondaryBtn={onPressSecondaryButton}
        />
      );
    case ModalType.UNKNOWN_LOCATION:
      return (
        <AlertModal
          visible={visible}
          heading={i18next.t('label.something_went_wrong')}
          message={i18next.t('label.locate_tree_unable_to_retrieve_location')}
          primaryBtnText={i18next.t('label.ok')}
          onPressPrimaryBtn={() => setVisible(false)}
          showSecondaryButton={false}
        />
      );
    default:
      return (
        <AlertModal
          visible={visible}
          heading="Alert"
          message="This is an alert"
          primaryBtnText="OK"
          onPressPrimaryBtn={onPressPrimaryButton}
          showSecondaryButton={false}
          secondaryBtnText=""
          onPressSecondaryBtn={onPressSecondaryButton}
        />
      );
  }
};

export default AlertModalSwitcher;
