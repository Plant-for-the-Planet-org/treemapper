'use client'

import React, { useState } from 'react';
import {  AnimatePresence } from 'framer-motion';
import { ScreenOne } from './components/screenOne';
import { ScreenTwo } from './components/screenTwo';

// Main Onboarding Component
const Onboarding = () => {
  const [currentScreen, setCurrentScreen] = useState(1);
  const [screenOneData, setScreenOneData] = useState({
    projectName: '',
    selectedPlan: 'public'
  });

  const handleScreenOneNext = (data) => {
    setScreenOneData(data);
    setCurrentScreen(2);
  };

  const handleScreenTwoNext = (surveyData) => {
    const completeData = {
      ...screenOneData,
      ...surveyData
    };
    handleOnboardingComplete(completeData);
  };

  const handleBack = () => {
    setCurrentScreen(1);
  };

  const handleOnboardingComplete = (allData) => {
    console.log('Onboarding completed with data:', allData);
    // Placeholder function - you'll handle the redirection
  };

  return (
    <div className="h-full bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <AnimatePresence mode="wait">
          {currentScreen === 1 && (
            <ScreenOne
              key="screen1"
              onNext={handleScreenOneNext}
            />
          )}
          {currentScreen === 2 && (
            <ScreenTwo
              key="screen2"
              onNext={handleScreenTwoNext}
              onBack={handleBack}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Screen One Component


// Screen Two Component

export default Onboarding;