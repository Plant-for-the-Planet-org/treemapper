import React from 'react';
import BackButtonUI from './components'; // This imports the platform-specific UI

interface Props {
  label?: string
}

function BackButton({ label }: Props) {
  const navigateBack = () => {
  };
  return (
    <BackButtonUI
      navigateBack={navigateBack}
      label={label}
    />
  );
}

export default BackButton;