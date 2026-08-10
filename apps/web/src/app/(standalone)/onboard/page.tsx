'use client'

import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ScreenOne } from './components/screenOne';
import { ScreenTwo } from './components/screenTwo';
import { toast } from 'react-toastify'
import { startOnboarding } from '@shared-core/fetchApi/api.fetch';
import { useToken } from '@/context/useTokenContext'
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserStore } from '@shared-core/store/useUserStore';

const Onboarding = () => {
  const [currentScreen, setCurrentScreen] = useState(1);
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  // Additional-project flow lands here as /onboard?flow=add-project.
  const forProject = searchParams.get('flow') === 'add-project'
  // Existing users have already completed the profile survey during their first
  // project setup, so skip it. primaryProjectUid is set once that happens.
  const isExistingUser = !!useUserStore(state => state.user)?.primaryProjectUid

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
    const projectType = allData.selectedPlan === 'trial'
      ? 'development'
      : allData.selectedPlan === 'public'
        ? 'platform'
        : 'private';

    // Additional-project flow: skip first-time onboarding (which creates a
    // project and repoints the user's primary project). The project form is
    // the single creation path here.
    if (forProject) {
      window.location.replace(`/create-project?name=${allData.projectName}&type=${projectType}`)
      return
    }

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
      window.location.replace(`/create-project?name=${allData.projectName}&type=${projectType}`)
    } catch (error) {
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
              isExistingUser={isExistingUser}
              loading={loading}
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