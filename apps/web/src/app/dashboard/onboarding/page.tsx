'use client'

import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ScreenOne } from './components/screenOne';
import { ScreenTwo } from './components/screenTwo';
import { toast } from 'react-toastify'
import { startOnboarding } from '@shared-core/fetchApi/api.fetch';
import { useToken } from '@/context/useTokenContext'
import { useRouter } from 'next/navigation';
import { useUserStore } from '@shared-core/store/useUserStore';

const Onboarding = ({forProject}) => {
  const [currentScreen, setCurrentScreen] = useState(1);
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const [screenOneData, setScreenOneData] = useState({
    projectName: '',
    selectedPlan: ''
  });
  const { accessToken } = useToken()
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

  const handleOnboardingComplete = async (allData) => {
    setLoading(true)
    try {
      const payload = {
        projectName: allData.projectName,
        devMode: allData.selectedPlan === 'trial',
        forestCloud: allData.selectedPlan === 'public',
        organizationName: allData.organizationName || '',
        role: allData.role || '',
        primaryGoal: allData.primaryGoal || '',
        requestedDemo: Boolean(allData.wantsDemo && allData.requestedDemo),
      };

      payload.skip = payload.organizationName === '' &&
        payload.role === '' &&
        payload.primaryGoal === '';

      const resp = await startOnboarding(accessToken, payload)
      if (resp.statusCode !== 200 && resp.statusCode !== 201) {
        throw ''
      }
      router.replace(`/dashboard/project?name=${allData.projectName}&type=${payload.devMode ? 'development' : payload.forestCloud ? 'platform' : 'private'}`)
    } catch (error) {
      console.log("SD", error)
      toast.error("Something went wrong")
      setLoading(false)
    }

  };
  return (
    <div className="h-full bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <AnimatePresence mode="wait">
          {currentScreen === 1 && (
            <ScreenOne
              key="screen1"
              onNext={handleScreenOneNext}
              setupProject={handleOnboardingComplete}
              forProject={forProject}
            />
          )}
          {currentScreen === 2 && (
            <ScreenTwo
              key="screen2"
              onNext={handleScreenTwoNext}
              onBack={handleBack}
              loading={loading}
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