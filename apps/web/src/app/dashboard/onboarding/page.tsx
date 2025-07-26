'use client'

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, Users, Building, Target, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';

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
const ScreenOne = ({ onNext }) => {
  const [formData, setFormData] = useState({
    projectName: '',
    selectedPlan: ''
  });
  const [errors, setErrors] = useState({});

  const plans = [
    {
      id: 'public',
      title: 'Plant-for-the-Planet Platform',
      subtitle: 'All data will be shared publicly',
      description: 'Contribute to global reforestation efforts with transparent data sharing',
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: 'private',
      title: 'Personal/Organization Use',
      subtitle: 'Use all features of TreeMapper',
      description: 'Complete access to all TreeMapper features for private projects',
      icon: <Building className="w-5 h-5" />,
      recommended: true

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

    // const error = validateProjectName(value);
    setErrors(prev => ({
      ...prev,
      projectName: ''
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
        <h1 className="text-3xl font-bold text-gray-900">Get started with TreeMapper</h1>
      </div>

      {/* Project Name Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project Details</CardTitle>
          <CardDescription>
            Choose a name for your forest management project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              type="text"
              value={formData.projectName}
              onChange={handleProjectNameChange}
              placeholder="Enter your project name"
              className={errors.projectName ? 'border-red-300' : ''}
            />
            {errors.projectName && (
              <p className="text-sm text-red-600">{errors.projectName}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plan Selection Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Plan</CardTitle>
          <CardDescription>
            Choose the plan that best fits your needs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`cursor-pointer transition-all hover:shadow-md relative ${formData.selectedPlan === plan.id
                  ? 'ring-2 ring-green-500 border-green-500'
                  : 'hover:border-gray-300'
                  }`}
                onClick={() => handlePlanSelect(plan.id)}
              >
                {plan.recommended && (
                  <Badge
                    variant="default"
                    className="absolute -top-2 left-4 bg-green-600 z-10"
                  >
                    Recommended
                  </Badge>
                )}
                <CardContent className="p-4 h-full">
                  <div className="flex flex-col space-y-3 h-full">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-md ${formData.selectedPlan === plan.id
                        ? 'bg-green-100 text-green-600'
                        : 'bg-gray-100 text-gray-600'
                        }`}>
                        {plan.icon}
                      </div>
                      {formData.selectedPlan === plan.id && (
                        <Check className="w-5 h-5 text-green-600" />
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 text-sm leading-tight">
                        {plan.title}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">{plan.subtitle}</p>
                      <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                        {plan.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Next Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!canProceed()}
          className="bg-gray-900 hover:bg-gray-800"
        >
          Next
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">About You</CardTitle>
          <CardDescription>
            Share some details to help us personalize your experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Organization Name */}
          <div className="space-y-2">
            <Label htmlFor="organizationName">Organization Name</Label>
            <Input
              id="organizationName"
              type="text"
              value={formData.organizationName}
              onChange={(e) => handleFieldChange('organizationName', e.target.value)}
              placeholder="Enter your organization name"
              className={errors.organizationName ? 'border-red-300' : ''}
            />
            {errors.organizationName && (
              <p className="text-sm text-red-600">{errors.organizationName}</p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Your Role</Label>
            <Select value={formData.role} onValueChange={(value) => handleFieldChange('role', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((role) => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Demo Call */}
          <div className="space-y-3">
            <Label>Would you like a demo call from us?</Label>
            <RadioGroup
              value={formData.wantsDemo}
              onValueChange={(value) => handleFieldChange('wantsDemo', value)}
              className="flex space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Yes" id="demo-yes" />
                <Label htmlFor="demo-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="No" id="demo-no" />
                <Label htmlFor="demo-no">No</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Primary Goal */}
          <div className="space-y-2">
            <Label htmlFor="primaryGoal">Primary Goal</Label>
            <Select value={formData.primaryGoal} onValueChange={(value) => handleFieldChange('primaryGoal', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your primary goal" />
              </SelectTrigger>
              <SelectContent>
                {goalOptions.map((goal) => (
                  <SelectItem key={goal} value={goal}>{goal}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onBack}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={!canContinue()}
          className="bg-gray-900 hover:bg-gray-800"
        >
          {hasAnyInput() ? 'Continue to Dashboard' : 'Skip and Continue'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
};

export default Onboarding;