import { motion } from "framer-motion";
import { Users, Building, Target, Check, ChevronRight } from "lucide-react";
import { useState } from "react";

export const ScreenOne = ({ formData, updateFormData, onNext }) => {
    const [errors, setErrors] = useState({});

    const plans = [
        {
            id: 'public',
            title: 'Plant-for-the-Planet Platform',
            subtitle: 'All data will be shared publicly',
            description: 'Contribute to global reforestation efforts with transparent data sharing and community collaboration',
            icon: <Users className="w-6 h-6" />,
            recommended: false,
            gradient: 'from-emerald-600 to-green-600'
        },
        {
            id: 'private',
            title: 'Personal/Organization Use',
            subtitle: 'Use All Features of TreeMapper',
            description: 'Complete access to all TreeMapper features for your private conservation projects',
            icon: <Building className="w-6 h-6" />,
            gradient: 'from-green-600 to-emerald-600',
            recommended: true,
        },
        {
            id: 'trial',
            title: 'Development Mode',
            subtitle: 'Data auto-deleted after 30 days of inactivity',
            description: 'Explore and test all features with temporary data storage for evaluation',
            icon: <Target className="w-6 h-6" />,
            gradient: 'from-emerald-500 to-green-500'
        }
    ];

    const validateProjectName = (name) => {
        if (!name.trim()) return 'Project name is required';
        if (name.length < 2) return 'Project name must be at least 2 characters';
        if (name.length > 50) return 'Project name must be less than 50 characters';
        if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) return 'Only letters, numbers, spaces, hyphens, and underscores allowed';
        return '';
    };

    const handleProjectNameChange = (e) => {
        const value = e.target.value;
        updateFormData({ projectName: value });

        const error = validateProjectName(value);
        setErrors(prev => ({
            ...prev,
            projectName: error
        }));
    };

    const handlePlanSelect = (planId) => {
        updateFormData({ selectedPlan: planId });
    };

    const canProceed = () => {
        return formData.projectName.trim() && !errors.projectName && formData.selectedPlan;
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
                    Get started with TreeMapper
                </motion.h1>
                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-lg text-white/80"
                >
                    Set up your project
                </motion.p>
            </div>

            {/* Project Name Input */}
            <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mb-10"
            >
                <label className="block text-base font-semibold text-white mb-4">
                    Project Name
                </label>
                <div className="relative">
                    <input
                        type="text"
                        value={formData.projectName}
                        onChange={handleProjectNameChange}
                        placeholder="Enter your project name"
                        className={`w-full px-6 py-4 text-base bg-white/10 backdrop-blur-sm border rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-300 ${errors.projectName ? 'border-red-400/60 ring-2 ring-red-400/30' : 'border-white/20 hover:border-white/40'
                            }`}
                    />
                    {errors.projectName && (
                        <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-2 text-sm text-red-300"
                        >
                            {errors.projectName}
                        </motion.p>
                    )}
                </div>
            </motion.div>

            {/* Plan Selection */}
            <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mb-12"
            >
                <label className="block text-base font-semibold text-white mb-6">
                    What are you using TreeMapper for?
                </label>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.id}
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            whileHover={{ y: -8, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handlePlanSelect(plan.id)}
                            className={`relative p-6 rounded-2xl cursor-pointer transition-all duration-300 backdrop-blur-sm ${formData.selectedPlan === plan.id
                                ? 'bg-white/20 border-2 border-white/40 shadow-xl'
                                : 'bg-white/5 border border-white/20 hover:bg-white/10 hover:border-white/30'
                                }`}
                            style={{
                                boxShadow: formData.selectedPlan === plan.id
                                    ? '0 20px 40px rgba(0, 122, 73, 0.4), 0 0 20px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                                    : '0 10px 30px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                            }}
                        >
                            {plan.recommended && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.8, type: "spring" }}
                                    className="absolute -top-3 left-6 px-4 py-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-sm font-medium rounded-full shadow-lg"
                                >
                                    Recommended
                                </motion.div>
                            )}

                            <div className="flex items-start mb-4">
                                <div className={`p-3 rounded-xl mr-4 bg-gradient-to-br ${plan.gradient} shadow-lg`}>
                                    {plan.icon}
                                </div>
                                {formData.selectedPlan === plan.id && (
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        className="ml-auto bg-white/20 p-2 rounded-full"
                                    >
                                        <Check className="w-5 h-5 text-white" />
                                    </motion.div>
                                )}
                            </div>

                            <h3 className="font-bold text-white text-lg mb-2 leading-tight">{plan.title}</h3>
                            <p className="text-sm text-white/70 mb-3 font-medium">{plan.subtitle}</p>
                            <p className="text-sm text-white/60 leading-relaxed">{plan.description}</p>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Next Button */}
            <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="flex justify-end"
            >
                <motion.button
                    whileHover={{ scale: canProceed() ? 1.05 : 1, x: canProceed() ? 5 : 0 }}
                    whileTap={{ scale: canProceed() ? 0.95 : 1 }}
                    onClick={onNext}
                    disabled={!canProceed()}
                    className={`px-8 py-4 rounded-2xl text-base font-semibold flex items-center transition-all duration-300 ${canProceed()
                        ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-xl hover:shadow-2xl hover:from-emerald-500 hover:to-green-500'
                        : 'bg-white/10 text-white/40 cursor-not-allowed'
                        }`}
                    style={{
                        boxShadow: canProceed() ? '0 10px 30px rgba(0, 122, 73, 0.4)' : 'none'
                    }}
                >
                    Next
                    <ChevronRight className="w-5 h-5 ml-2" />
                </motion.button>
            </motion.div>
        </motion.div>
    );
};