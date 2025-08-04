import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Spinner from '@/component/Spinner';

export const ScreenTwo = ({ onNext, onBack, loading }) => {
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

  const validateField = (field, value) => {
    switch (field) {
      case 'organizationName':
        if (!value.trim()) return '';
        if (value.length > 100) return 'Organization name must be less than 100 characters';
        if (!/^[a-zA-Z0-9\s\-_&.,()]+$/.test(value)) return 'Invalid characters in organization name';
        break;
    }
    return '';
  }

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    const error = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  }

  const hasAnyInput = () => {
    return Object.values(formData).some(value => value && value.trim());
  }

  const canContinue = () => {
    const hasErrors = Object.values(errors).some(error => error);
    return !hasErrors;
  }

  const handleSubmit = () => {
    if (canContinue()) {
      onNext(formData);
    }
  }

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
          className='cursor-pointer'
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={!canContinue() || loading}
          className="bg-gray-900 hover:bg-gray-800 cursor-pointer"
        >
          {loading ? <>
            Processing
            <Spinner />
          </> : <>
            {hasAnyInput() ? 'Continue to Dashboard' : 'Skip and Continue'}
            <ArrowRight className="w-4 h-4 ml-2" /></>}
        </Button>
      </div>
    </motion.div>
  );
};
