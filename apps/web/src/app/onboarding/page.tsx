'use client'
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, Users, Building, Target, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
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
const ScreenOne = ({ onNext }) => {
  const [formData, setFormData] = useState({
    projectName: '',
    selectedPlan: 'public'
  });
  const [errors, setErrors] = useState({});

  const plans = [
    {
      id: 'public',
      title: 'Plant-for-the-Planet Platform',
      subtitle: 'All data will be shared publicly',
      description: 'Contribute to global reforestation efforts with transparent data sharing',
      icon: <Users className="w-5 h-5" />,
      recommended: true
    },
    {
      id: 'private', 
      title: 'Personal/Organization Use',
      subtitle: 'Use all features of TreeMapper',
      description: 'Complete access to all TreeMapper features for private projects',
      icon: <Building className="w-5 h-5" />
    },
    {
      id: 'trial',
      title: 'Development Mode',
      subtitle: 'Data auto-deleted after 30 days',
      description: 'Explore and test features with temporary data storage',
      icon: <Target className="w-5 h-5" />
    }
  ];

  const validateProjectName = useCallback((name) => {
    if (!name.trim()) return 'Project name is required';
    if (name.length < 2) return 'Project name must be at least 2 characters';
    if (name.length > 50) return 'Project name must be less than 50 characters';
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) return 'Only letters, numbers, spaces, hyphens, and underscores allowed';
    return '';
  }, []);

  const handleProjectNameChange = useCallback((e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, projectName: value }));
    
    const error = validateProjectName(value);
    setErrors(prev => ({
      ...prev,
      projectName: error
    }));
  }, [validateProjectName]);

  const handlePlanSelect = useCallback((planId) => {
    setFormData(prev => ({ ...prev, selectedPlan: planId }));
  }, []);

  const canProceed = useCallback(() => {
    return formData.projectName.trim() && !errors.projectName && formData.selectedPlan;
  }, [formData.projectName, formData.selectedPlan, errors.projectName]);

  const handleSubmit = useCallback(() => {
    if (canProceed()) {
      onNext(formData);
    }
  }, [formData, canProceed, onNext]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold text-gray-900">Set up your project</h1>
        <p className="text-gray-600">Get started with TreeMapper forest management</p>
      </div>

      {/* Project Name Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">
            Project Name
          </label>
          <input
            type="text"
            value={formData.projectName}
            onChange={handleProjectNameChange}
            placeholder="Enter your project name"
            className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
              errors.projectName ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.projectName && (
            <p className="text-xs text-red-600">{errors.projectName}</p>
          )}
        </div>
      </div>

      {/* Plan Selection Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">
            Select Plan
          </label>
          <p className="text-xs text-gray-500">Choose the plan that best fits your needs</p>
        </div>
        
        <div className="grid gap-3">
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => handlePlanSelect(plan.id)}
              className={`relative p-4 rounded-lg border cursor-pointer transition-all ${
                formData.selectedPlan === plan.id
                  ? 'border-green-500 bg-green-50 ring-1 ring-green-500'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-2 left-4 px-2 py-1 bg-green-600 text-white text-xs rounded font-medium">
                  Recommended
                </div>
              )}
              
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-md ${
                  formData.selectedPlan === plan.id ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {plan.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">{plan.title}</h3>
                    {formData.selectedPlan === plan.id && (
                      <Check className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{plan.subtitle}</p>
                  <p className="text-xs text-gray-500 mt-1">{plan.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Next Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!canProceed()}
          className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            canProceed()
              ? 'bg-gray-900 text-white hover:bg-gray-800'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Next
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </motion.div>
  );
};

// Screen Two Component
const ScreenTwo = ({ onNext, onBack }) => {
  const [formData, setFormData] = useState({
    organizationName: '',
    role: '',
    wantsDemo: '',
    primaryGoal: ''
  });

  const [errors, setErrors] = useState({});

  const roleOptions = [
    'Forest Manager',
    'Researcher', 
    'Conservation Officer',
    'Policy Maker',
    'Environmental Consultant',
    'Land Owner',
    'NGO Representative',
    'Student',
    'Other'
  ];

  const goalOptions = [
    'Forest Conservation',
    'Reforestation Projects',
    'Biodiversity Monitoring', 
    'Carbon Sequestration',
    'Sustainable Logging',
    'Research & Data Collection',
    'Environmental Education',
    'Land Use Planning',
    'Other'
  ];

  const validateField = useCallback((field, value) => {
    switch (field) {
      case 'organizationName':
        if (!value.trim()) return '';
        if (value.length > 100) return 'Organization name must be less than 100 characters';
        if (!/^[a-zA-Z0-9\s\-_&.,()]+$/.test(value)) return 'Invalid characters in organization name';
        break;
    }
    return '';
  }, []);

  const handleFieldChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    const error = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  }, [validateField]);

  const hasAnyInput = useCallback(() => {
    return Object.values(formData).some(value => value && value.trim());
  }, [formData]);

  const canContinue = useCallback(() => {
    const hasErrors = Object.values(errors).some(error => error);
    return !hasErrors;
  }, [errors]);

  const handleSubmit = useCallback(() => {
    if (canContinue()) {
      onNext(formData);
    }
  }, [formData, canContinue, onNext]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold text-gray-900">Tell us about yourself</h1>
        <p className="text-gray-600">Help us customize your TreeMapper experience</p>
      </div>

      {/* Survey Form Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        {/* Organization Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">
            Organization Name
          </label>
          <input
            type="text"
            value={formData.organizationName}
            onChange={(e) => handleFieldChange('organizationName', e.target.value)}
            placeholder="Enter your organization name"
            className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
              errors.organizationName ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.organizationName && (
            <p className="text-xs text-red-600">{errors.organizationName}</p>
          )}
        </div>

        {/* Role */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">
            Your Role
          </label>
          <select
            value={formData.role}
            onChange={(e) => handleFieldChange('role', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Select your role</option>
            {roleOptions.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>

        {/* Demo Call */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-900">
            Would you like a demo call from us?
          </label>
          <div className="flex space-x-4">
            {['Yes', 'No'].map((option) => (
              <label key={option} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="wantsDemo"
                  value={option}
                  checked={formData.wantsDemo === option}
                  onChange={(e) => handleFieldChange('wantsDemo', e.target.value)}
                  className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Primary Goal */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">
            Primary Goal
          </label>
          <select
            value={formData.primaryGoal}
            onChange={(e) => handleFieldChange('primaryGoal', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Select your primary goal</option>
            {goalOptions.map((goal) => (
              <option key={goal} value={goal}>{goal}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </button>

        <button
          onClick={handleSubmit}
          disabled={!canContinue()}
          className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            canContinue()
              ? 'bg-gray-900 text-white hover:bg-gray-800'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {hasAnyInput() ? 'Continue to Dashboard' : 'Skip and Continue'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </motion.div>
  );
};

export default Onboarding;