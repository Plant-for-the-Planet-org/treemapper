import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export const ScreenTwo = ({ onNext, onBack }) => {
  // Local state for all form data
  const [formData, setFormData] = useState({
    organizationName: '',
    organizationType: '',
    organizationSize: '',
    role: '',
    primaryGoal: '',
    areaSize: '',
    projectRole: '',
    projectDuration: '',
    isNewProject: '',
    hasMonitoring: '',
    trackingTool: '',
    premiumFeatures: [],
    wantsDemo: '',
    wantsContact: '',
    email: '',
    phone: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Form options
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

  const organizationTypeOptions = [
    'NGO',
    'Government',
    'Corporation',
    'Startup',
    'Academic',
    'Individual',
    'Other'
  ];

  const organizationSizeOptions = [
    '1–10',
    '11–50',
    '51–200',
    '200+'
  ];

  const projectRoleOptions = [
    'Project manager',
    'Field staff',
    'Procurement',
    'Fundraiser',
    'Executive'
  ];

  const projectDurationOptions = [
    '<6 months',
    '1 year',
    '2+ years',
    'ongoing'
  ];

  const trackingToolOptions = [
    'Excel',
    'Other digital tool',
    'None'
  ];

  const premiumFeatures = [
    'Live dashboards',
    'Multi-user team access',
    'API integrations',
    'Satellite verification',
    'Donor reporting exports',
    'Custom branding',
    'Offline syncing at scale',
    'AI-based survival analysis'
  ];

  // Validation functions
  const validateField = useCallback((field, value) => {
    // switch (field) {
    //   case 'organizationName':
    //     if (!value.trim()) return '';
    //     if (value.length > 100) return 'Organization name must be less than 100 characters';
    //     if (!/^[a-zA-Z0-9\s\-_&.,()]+$/.test(value)) return 'Invalid characters in organization name';
    //     break;
    //   case 'areaSize':
    //     if (!value.trim()) return '';
    //     if (!/^\d+(\.\d{1,2})?$/.test(value)) return 'Please enter a valid number (e.g., 100 or 100.50)';
    //     if (parseFloat(value) <= 0) return 'Area size must be greater than 0';
    //     if (parseFloat(value) > 1000000) return 'Area size seems too large';
    //     break;
    //   case 'email':
    //     if (!value.trim()) return 'Email address is required';
    //     if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
    //     break;
    //   case 'phone':
    //     if (!value.trim()) return '';
    //     if (!/^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, ''))) return 'Please enter a valid phone number';
    //     break;
    // }
    return '';
  }, []);

  // Handle field changes with validation
  const handleFieldChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));

    // Validate field
    const error = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  }, [validateField]);

  // Handle checkbox changes for premium features
  const handleCheckboxChange = useCallback((feature, checked) => {
    setFormData(prev => {
      const currentFeatures = prev.premiumFeatures || [];
      const updatedFeatures = checked 
        ? [...currentFeatures, feature]
        : currentFeatures.filter(f => f !== feature);
      
      return {
        ...prev,
        premiumFeatures: updatedFeatures
      };
    });
  }, []);

  // Check if user has provided any input
  const hasAnyInput = useCallback(() => {
    return Object.entries(formData).some(([key, value]) => {
      if (key === 'premiumFeatures') {
        return Array.isArray(value) && value.length > 0;
      }
      return typeof value === 'string' && value.trim();
    });
  }, [formData]);

  // // Validate email requirement when other fields are filled
  // useEffect(() => {
  //   if (hasAnyInput() && !formData.email.trim() && touched.email !== false) {
  //     setErrors(prev => ({
  //       ...prev,
  //       email: 'Email is required when providing other information'
  //     }));
  //   } else if (formData.email.trim() || !hasAnyInput()) {
  //     setErrors(prev => {
  //       const newErrors = { ...prev };
  //       if (newErrors.email === 'Email is required when providing other information') {
  //         delete newErrors.email;
  //       }
  //       return newErrors;
  //     });
  //   }
  // }, [formData.email, hasAnyInput, touched.email]);

  // Check if form can be submitted
  const canContinue = useCallback(() => {
    if (!hasAnyInput()) return true;
    
    // If there's any input, email is required
    // if (hasAnyInput() && !formData.email.trim()) {
    //   return false;
    // }
    
    // Check for any validation errors
    const hasErrors = Object.values(errors).some(error => error);
    return !hasErrors;
  }, [formData.email, hasAnyInput, errors]);

  // Handle form submission
  const handleSubmit = useCallback(() => {
    if (canContinue()) {
      // Pass the complete form data to parent
      onNext(formData);
    }
  }, [formData, canContinue, onNext]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -100, scale: 0.95 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="backdrop-blur-md bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-10 max-h-[90vh] overflow-y-auto"
      style={{
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Header */}
      <div className="mb-8 text-center">
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-bold text-white mb-3 tracking-tight"
        >
          Tell us about yourself
        </motion.h1>
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-lg text-white/80"
        >
          Help us customize your TreeMapper experience
        </motion.p>
      </div>

      <div className="space-y-8">
        {/* Basic Information Section */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 rounded-2xl p-6 border border-white/10"
        >
          <h3 className="text-xl font-semibold text-white mb-6">Basic Information</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Organization Name */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Organization Name
              </label>
              <input
                type="text"
                value={formData.organizationName || ''}
                onChange={(e) => handleFieldChange('organizationName', e.target.value)}
                placeholder="Enter organization name"
                className={`w-full px-4 py-3 text-sm bg-white/10 backdrop-blur-sm border rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-300 ${
                  errors.organizationName ? 'border-red-400/60 ring-2 ring-red-400/30' : 'border-white/20 hover:border-white/40'
                }`}
              />
              {errors.organizationName && (
                <p className="mt-1 text-xs text-red-300">{errors.organizationName}</p>
              )}
            </div>

            {/* Organization Type */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Organization Type
              </label>
              <select
                value={formData.organizationType || ''}
                onChange={(e) => handleFieldChange('organizationType', e.target.value)}
                className="w-full px-4 py-3 text-sm bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/30 hover:border-white/40 transition-all duration-300"
              >
                <option value="" className="bg-gray-800 text-white">Select organization type</option>
                {organizationTypeOptions.map((type) => (
                  <option key={type} value={type} className="bg-gray-800 text-white">{type}</option>
                ))}
              </select>
            </div>

            {/* Organization Size */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Organization Size
              </label>
              <select
                value={formData.organizationSize || ''}
                onChange={(e) => handleFieldChange('organizationSize', e.target.value)}
                className="w-full px-4 py-3 text-sm bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/30 hover:border-white/40 transition-all duration-300"
              >
                <option value="" className="bg-gray-800 text-white">Select organization size</option>
                {organizationSizeOptions.map((size) => (
                  <option key={size} value={size} className="bg-gray-800 text-white">{size}</option>
                ))}
              </select>
            </div>

            {/* Your Role */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Your Role in Organization
              </label>
              <select
                value={formData.role || ''}
                onChange={(e) => handleFieldChange('role', e.target.value)}
                className="w-full px-4 py-3 text-sm bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/30 hover:border-white/40 transition-all duration-300"
              >
                <option value="" className="bg-gray-800 text-white">Select your role</option>
                {roleOptions.map((role) => (
                  <option key={role} value={role} className="bg-gray-800 text-white">{role}</option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Project Information Section */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white/5 rounded-2xl p-6 border border-white/10"
        >
          <h3 className="text-xl font-semibold text-white mb-6">Project Information</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Primary Goal */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Primary Goal
              </label>
              <select
                value={formData.primaryGoal || ''}
                onChange={(e) => handleFieldChange('primaryGoal', e.target.value)}
                className="w-full px-4 py-3 text-sm bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/30 hover:border-white/40 transition-all duration-300"
              >
                <option value="" className="bg-gray-800 text-white">Select your primary goal</option>
                {goalOptions.map((goal) => (
                  <option key={goal} value={goal} className="bg-gray-800 text-white">{goal}</option>
                ))}
              </select>
            </div>

            {/* Area Size */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Management Area (hectares)
              </label>
              <input
                type="text"
                value={formData.areaSize || ''}
                onChange={(e) => handleFieldChange('areaSize', e.target.value)}
                placeholder="e.g., 150.5"
                className={`w-full px-4 py-3 text-sm bg-white/10 backdrop-blur-sm border rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-300 ${
                  errors.areaSize ? 'border-red-400/60 ring-2 ring-red-400/30' : 'border-white/20 hover:border-white/40'
                }`}
              />
              {errors.areaSize && (
                <p className="mt-1 text-xs text-red-300">{errors.areaSize}</p>
              )}
            </div>

            {/* Project Role */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Your Role in the Project
              </label>
              <select
                value={formData.projectRole || ''}
                onChange={(e) => handleFieldChange('projectRole', e.target.value)}
                className="w-full px-4 py-3 text-sm bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/30 hover:border-white/40 transition-all duration-300"
              >
                <option value="" className="bg-gray-800 text-white">Select your project role</option>
                {projectRoleOptions.map((role) => (
                  <option key={role} value={role} className="bg-gray-800 text-white">{role}</option>
                ))}
              </select>
            </div>

            {/* Project Duration */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                How long will this project last?
              </label>
              <select
                value={formData.projectDuration || ''}
                onChange={(e) => handleFieldChange('projectDuration', e.target.value)}
                className="w-full px-4 py-3 text-sm bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/30 hover:border-white/40 transition-all duration-300"
              >
                <option value="" className="bg-gray-800 text-white">Select project duration</option>
                {projectDurationOptions.map((duration) => (
                  <option key={duration} value={duration} className="bg-gray-800 text-white">{duration}</option>
                ))}
              </select>
            </div>

            {/* Is New Project */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Is this a new project or ongoing one?
              </label>
              <div className="flex gap-4">
                {['New', 'Ongoing'].map((option) => (
                  <label key={option} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="isNewProject"
                      value={option}
                      checked={formData.isNewProject === option}
                      onChange={(e) => handleFieldChange('isNewProject', e.target.value)}
                      className="mr-2 w-4 h-4 text-green-600 bg-white/10 border-white/30 focus:ring-green-500"
                    />
                    <span className="text-sm text-white">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Has Monitoring */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Do you have existing monitoring processes?
              </label>
              <div className="flex gap-4">
                {['Yes', 'No', 'Somewhat'].map((option) => (
                  <label key={option} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="hasMonitoring"
                      value={option}
                      checked={formData.hasMonitoring === option}
                      onChange={(e) => handleFieldChange('hasMonitoring', e.target.value)}
                      className="mr-2 w-4 h-4 text-green-600 bg-white/10 border-white/30 focus:ring-green-500"
                    />
                    <span className="text-sm text-white">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Current Tools Section */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-white/5 rounded-2xl p-6 border border-white/10"
        >
          <h3 className="text-xl font-semibold text-white mb-6">Current Tools & Preferences</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tracking Tool */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-white mb-3">
                Are you currently using any other digital tools for tracking?
              </label>
              <select
                value={formData.trackingTool || ''}
                onChange={(e) => handleFieldChange('trackingTool', e.target.value)}
                className="w-full px-4 py-3 text-sm bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/30 hover:border-white/40 transition-all duration-300"
              >
                <option value="" className="bg-gray-800 text-white">Select current tool</option>
                {trackingToolOptions.map((tool) => (
                  <option key={tool} value={tool} className="bg-gray-800 text-white">{tool}</option>
                ))}
              </select>
            </div>

            {/* Premium Features */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-white mb-4">
                Which features are most important to you? (Select all that apply)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {premiumFeatures.map((feature) => (
                  <label key={feature} className="flex items-center cursor-pointer bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={(formData.premiumFeatures || []).includes(feature)}
                      onChange={(e) => handleCheckboxChange(feature, e.target.checked)}
                      className="mr-3 w-4 h-4 text-green-600 bg-white/10 border-white/30 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-white">{feature}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Demo & Contact Section */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="bg-white/5 rounded-2xl p-6 border border-white/10"
        >
          <h3 className="text-xl font-semibold text-white mb-6">Demo & Support</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Demo Interest */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Would you like a demo of advanced features?
              </label>
              <div className="flex gap-4">
                {['Yes', 'No'].map((option) => (
                  <label key={option} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="wantsDemo"
                      value={option}
                      checked={formData.wantsDemo === option}
                      onChange={(e) => handleFieldChange('wantsDemo', e.target.value)}
                      className="mr-2 w-4 h-4 text-green-600 bg-white/10 border-white/30 focus:ring-green-500"
                    />
                    <span className="text-sm text-white">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Team Contact */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Would you like to speak with someone from our team?
              </label>
              <div className="flex gap-4">
                {['Yes', 'No'].map((option) => (
                  <label key={option} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="wantsContact"
                      value={option}
                      checked={formData.wantsContact === option}
                      onChange={(e) => handleFieldChange('wantsContact', e.target.value)}
                      className="mr-2 w-4 h-4 text-green-600 bg-white/10 border-white/30 focus:ring-green-500"
                    />
                    <span className="text-sm text-white">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Contact Information Section */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-white/5 rounded-2xl p-6 border border-white/10"
        >
          <h3 className="text-xl font-semibold text-white mb-6">Contact & Follow-Up</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                placeholder="Enter your email address"
                className={`w-full px-4 py-3 text-sm bg-white/10 backdrop-blur-sm border rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-300 ${
                  errors.email ? 'border-red-400/60 ring-2 ring-red-400/30' : 'border-white/20 hover:border-white/40'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-300">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Phone Number or WhatsApp <span className="text-white/60">(Optional)</span>
              </label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                placeholder="Enter your phone number"
                className={`w-full px-4 py-3 text-sm bg-white/10 backdrop-blur-sm border rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-300 ${
                  errors.phone ? 'border-red-400/60 ring-2 ring-red-400/30' : 'border-white/20 hover:border-white/40'
                }`}
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-300">{errors.phone}</p>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Navigation Buttons */}
      <motion.div 
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="flex justify-between mt-8"
      >
        <motion.button
          whileHover={{ scale: 1.05, x: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="px-8 py-4 rounded-2xl text-base font-semibold flex items-center bg-white/10 text-white border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300"
        >
          <ChevronLeft className="w-5 h-5 mr-2" />
          Back
        </motion.button>

        <motion.button
          whileHover={{ scale: canContinue() ? 1.05 : 1, x: canContinue() ? 5 : 0 }}
          whileTap={{ scale: canContinue() ? 0.95 : 1 }}
          onClick={handleSubmit}
          disabled={!canContinue()}
          className={`px-8 py-4 rounded-2xl text-base font-semibold flex items-center transition-all duration-300 ${
            canContinue()
              ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-xl hover:shadow-2xl hover:from-emerald-500 hover:to-green-500'
              : 'bg-white/10 text-white/40 cursor-not-allowed'
          }`}
          style={{
            boxShadow: canContinue() ? '0 10px 30px rgba(0, 122, 73, 0.4)' : 'none'
          }}
        >
          {hasAnyInput() ? 'Continue to Dashboard' : 'Skip and Continue'}
          <ChevronRight className="w-5 h-5 ml-2" />
        </motion.button>
      </motion.div>
    </motion.div>
  );
};