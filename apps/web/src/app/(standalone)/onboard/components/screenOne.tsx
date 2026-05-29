import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Check, Users, Building, Target, ArrowRight, Lock, BeakerIcon, Beaker, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import Spinner from '@/component/Spinner';
import pftpLogo from '@/assets/pftp-logo.svg';

export const ScreenOne = ({ onNext, setupProject, forProject, isExistingUser, loading }) => {
  const [formData, setFormData] = useState({
    projectName: '',
    selectedPlan: ''
  });
  const [errors, setErrors] = useState({});
  const plans = [
    {
      id: 'public',
      title: 'Plant-for-the-Planet Platform',
      subtitle: 'To contribute to global reforestation efforts with transparent data sharing.',
      description: 'Data is published on the Plant-for-the-Planet platform.',
      recommended: false,
      icon: <Image
        src={pftpLogo}
        alt="TreeMapper Logo"
        width={80}
        height={80}
        priority
        className="w-5 h-5"
      />,
    },
    {
      id: 'private',
      title: 'Personal/Organization Use',
      subtitle: 'Use TreeMapper for my Company/City/Personal use.',
      description: 'Data is kept private to you.',
      icon: <Lock className="w-5 h-5" />,
      recommended: false

    },
    {
      id: 'trial',
      title: 'Trying It Out',
      subtitle: 'Explore all features of TreeMapper',
      description: 'Data auto deletes on 30 days of inactivity.',
      icon: <FlaskConical className="w-5 h-5" />
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
    if (formData.selectedPlan !== 'private' || forProject || isExistingUser) {
      setupProject({
        projectName: formData.projectName,
        selectedPlan: formData.selectedPlan
      })
      return;
    }
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
        {forProject ? <h1 className="text-3xl font-bold text-gray-900">Create Project</h1> : <h1 className="text-3xl font-bold text-gray-900">Get started with TreeMapper</h1>}
      </div>

      {/* Project Name Card */}
      <Card >
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
        <CardHeader>
          {!forProject && <CardTitle className="text-lg">What brings you to TreeMapper?</CardTitle>}
          <CardDescription>
            Choose one that best fits your needs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`cursor-pointer transition-all hover:shadow-md relative ${formData.selectedPlan === plan.id
                  ? plan.recommended===true?'ring-2 ring-[#808080] border-[#808080]': 'ring-2 ring-[#007A49] border-[#006B3F]'
                  : 'hover:border-gray-300'
                  }`}
                onClick={() => handlePlanSelect(plan.id)}
              >
                {plan.recommended && (
                  <Badge
                    variant="default"
                    className="absolute -top-2 left-4 bg-[#808080] z-10"
                  >
                    Coming soon
                  </Badge>
                )}
                <CardContent className="p-4 h-full">
                  <div className="flex flex-col space-y-3 h-full">
                    <>
                      <div className="flex items-center justify-between">
                        <div className={`p-2 rounded-md ${formData.selectedPlan === plan.id && plan.recommended!==true
                          ? 'bg-[#007A49] text-[#fff]'
                          : 'bg-gray-100 text-gray-600'
                          }`}>
                          {plan.icon}
                        </div>
                        {formData.selectedPlan === plan.id && (
                          <Check className={`w-5 h-5 ${plan.recommended===true?'text-[#808080]':'text-[#007A49]'}`} />
                        )}
                      </div>

                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm leading-tight">
                          {plan.title}
                        </h3>
                        <p className="text-xs text-gray-600 mt-1">{plan.subtitle}</p>
                      </div></>
                    <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                      {plan.description}
                    </p>
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
          disabled={!canProceed() || loading}
          className="bg-gray-900 hover:bg-gray-800 cursor-pointer"
        >
          {loading ? <>
            Processing
            <Spinner /></> : 'Continue'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
};