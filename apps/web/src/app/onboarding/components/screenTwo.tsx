import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export const ScreenTwo = ({ formData, updateFormData, onNext, onBack }) => {
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
        if (!value.trim()) return '';

        switch (field) {
            case 'organizationName':
                if (value.length > 100) return 'Organization name must be less than 100 characters';
                if (!/^[a-zA-Z0-9\s\-_&.,()]+$/.test(value)) return 'Invalid characters in organization name';
                break;
            case 'areaSize':
                if (!/^\d+(\.\d{1,2})?$/.test(value)) return 'Please enter a valid number (e.g., 100 or 100.50)';
                if (parseFloat(value) <= 0) return 'Area size must be greater than 0';
                if (parseFloat(value) > 1000000) return 'Area size seems too large';
                break;
        }
        return '';
    };

    const handleFieldChange = (field, value) => {
        updateFormData({ [field]: value });

        const error = validateField(field, value);
        setErrors(prev => ({
            ...prev,
            [field]: error
        }));
    };

    const hasAnyInput = () => {
        return formData.organizationName.trim() ||
            formData.role ||
            formData.primaryGoal ||
            formData.areaSize.trim();
    };

    const canContinue = () => {
        if (!hasAnyInput()) return true;
        const hasErrors = Object.values(errors).some(error => error);
        return !hasErrors;
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -100, scale: 0.95 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="backdrop-blur-md bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-10"
            style={{
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
            }}
        >
            {/* Header */}
            <div className="mb-10 text-center">
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                {/* Organization Name */}
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <label className="block text-base font-semibold text-white mb-4">
                        Organization Name
                    </label>
                    <input
                        type="text"
                        value={formData.organizationName}
                        onChange={(e) => handleFieldChange('organizationName', e.target.value)}
                        placeholder="Enter organization name"
                        className={`w-full px-6 py-4 text-base bg-white/10 backdrop-blur-sm border rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-300 ${errors.organizationName ? 'border-red-400/60 ring-2 ring-red-400/30' : 'border-white/20 hover:border-white/40'
                            }`}
                    />
                    {errors.organizationName && (
                        <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-2 text-sm text-red-300"
                        >
                            {errors.organizationName}
                        </motion.p>
                    )}
                </motion.div>

                {/* Role */}
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <label className="block text-base font-semibold text-white mb-4">
                        Your Role
                    </label>
                    <select
                        value={formData.role}
                        style={{
                            appearance: 'none'
                        }}
                        onChange={(e) => handleFieldChange('role', e.target.value)}
                        className="w-full px-6 py-4 text-base bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-white/30 hover:border-white/40 transition-all duration-300"
                    >
                        <option value="" className="bg-gray-800 text-white">Select your role</option>
                        {roleOptions.map((role) => (
                            <option key={role} value={role} className="bg-gray-800 text-white">{role}</option>
                        ))}
                    </select>

                </motion.div>

                {/* Primary Goal */}
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    <label className="block text-base font-semibold text-white mb-4">
                        Primary Goal
                    </label>
                    <select
                        style={{
                            appearance: 'none'
                        }}
                        value={formData.primaryGoal}
                        onChange={(e) => handleFieldChange('primaryGoal', e.target.value)}
                        className="w-full px-6 py-4 text-base bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-white/30 hover:border-white/40 transition-all duration-300"
                    >
                        <option value="" className="bg-gray-800 text-white">Select your primary goal</option>
                        {goalOptions.map((goal) => (
                            <option key={goal} value={goal} className="bg-gray-800 text-white">{goal}</option>
                        ))}
                    </select>
                </motion.div>

                {/* Area Size */}
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                >
                    <label className="block text-base font-semibold text-white mb-4">
                        Management Area (hectares)
                    </label>
                    <input
                        type="text"
                        value={formData.areaSize}
                        onChange={(e) => handleFieldChange('areaSize', e.target.value)}
                        placeholder="e.g., 150.5"
                        className={`w-full px-6 py-4 text-base bg-white/10 backdrop-blur-sm border rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-300 ${errors.areaSize ? 'border-red-400/60 ring-2 ring-red-400/30' : 'border-white/20 hover:border-white/40'
                            }`}
                    />
                    {errors.areaSize && (
                        <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-2 text-sm text-red-300"
                        >
                            {errors.areaSize}
                        </motion.p>
                    )}
                </motion.div>
            </div>

            {/* Navigation Buttons */}
            <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex justify-between"
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
                    onClick={onNext}
                    disabled={!canContinue()}
                    className={`px-8 py-4 rounded-2xl text-base font-semibold flex items-center transition-all duration-300 ${canContinue()
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
