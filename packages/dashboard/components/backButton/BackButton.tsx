import React from 'react';
import BackButtonUI from './components'; // This imports the platform-specific UI
import { useRouter } from 'solito/navigation'

interface Props {
  label?: string
}

function BackButton({ label }: Props) {
  const { back } = useRouter()
  const navigateBack = () => {
    back()
  };
  return (
    <BackButtonUI
      navigateBack={navigateBack}
      label={label}
    />
  );
}

export default BackButton;