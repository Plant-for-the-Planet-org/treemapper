'use client'

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ScreenOne } from './components/screenOne';
import { ScreenTwo } from './components/screenTwo';

const Onboarding = () => {
  const [currentScreen, setCurrentScreen] = useState(1);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [formData, setFormData] = useState({
    projectName: '',
    selectedPlan: '',
    organizationName: '',
    role: '',
    primaryGoal: '',
    areaSize: ''
  });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 20 - 10,
        y: (e.clientY / window.innerHeight) * 20 - 10
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleNext = () => {
    if (currentScreen === 1) {
      setCurrentScreen(2);
    } else {
      handleOnboardingComplete();
    }
  };

  const handleBack = () => {
    setCurrentScreen(1);
  };

  const handleOnboardingComplete = () => {
    console.log('Onboarding completed with data:', formData);
    // Placeholder function - you'll handle the redirection
  };

  const updateFormData = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dynamic Forest Background with Parallax */}
      <div 
        className="absolute inset-0 transition-transform duration-1000 ease-out"
        style={{
          transform: `translate(${mousePosition.x}px, ${mousePosition.y}px) scale(1.1)`
        }}
      >
        {/* Forest Satellite Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat filter blur-sm"
          style={{backgroundImage:`url('/forestbg.jpg')`}}
        />
        
        {/* Green Tint Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-green-800/30 to-emerald-700/40" />
        
        {/* Additional Depth Layers */}
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-800/10 to-transparent" />
      </div>

      {/* Glass Container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-5xl">
          <AnimatePresence mode="wait">
            {currentScreen === 1 && (
              <ScreenOne
                key="screen1"
                formData={formData}
                updateFormData={updateFormData}
                onNext={handleNext}
              />
            )}
            {currentScreen === 2 && (
              <ScreenTwo
                key="screen2"
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};



export default Onboarding;