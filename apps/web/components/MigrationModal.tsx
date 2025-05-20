'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MigrationModal = () => {
    const [showModal, setShowModal] = useState(false);
    const [isMigrating, setIsMigrating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [completedSteps, setCompletedSteps] = useState([]);
    const isExistingUser = false;

    const onLogout = () => { };
    const onProceed = () => { };

    const migrationSteps = [
        "🪴 Migrating user data",
        "📦 Transferring projects",
        "📌 Moving related sites",
        "🌳 Migrating interventions",
        "🌿 Transferring plant species data"
    ];

    useEffect(() => {
        if (isExistingUser) {
            setShowModal(true);
        }
    }, []);

    const handleProceed = () => {
        setIsMigrating(true);

        let currentProgress = 0;
        let completedItems = [];

        const interval = setInterval(() => {
            currentProgress += Math.random() * 15;

            if (currentProgress >= 100) {
                currentProgress = 100;
                clearInterval(interval);
                setTimeout(() => {
                    setShowModal(false);
        }, 1500);
            }

            setProgress(Math.min(Math.round(currentProgress), 100));

            const stepsToComplete = Math.floor(currentProgress / (100 / migrationSteps.length));
            const newCompletedSteps = migrationSteps.slice(0, stepsToComplete);
            setCompletedSteps(newCompletedSteps);
        }, 1000);
    };

    if (!showModal) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-green-100/30 backdrop-blur-sm"
                onClick={() => !isMigrating && setShowModal(false)}
            />

            {/* Modal */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', bounce: 0.3 }}
                className="relative mx-4 w-full max-w-xl overflow-hidden rounded-3xl bg-white p-8 shadow-2xl border border-green-200"
            >
                <AnimatePresence mode="wait">
                    {!isMigrating ? (
                        <motion.div
                            key="confirmation"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4"
                        >
                            <div className="mb-5 flex items-center justify-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                                    <AlertCircle size={24} />
                                </div>
                            </div>

                            <h3 className="text-center text-xl font-bold text-green-800">
                                Let's Prepare Your Forest 🌳
                            </h3>

                            <p className="text-center text-gray-700">
                                Welcome back, eco-warrior! We’re updating your settings to align with the new dashboard experience. Your data is safe, and this will only take a moment.
                            </p>

                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={onLogout}
                                    className="flex w-1/2 items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-gray-700 transition hover:bg-gray-100"
                                >
                                    <LogOut size={16} />
                                    <span>Log Out</span>
                                </button>

                                <button
                                    onClick={handleProceed}
                                    className="w-1/2 rounded-lg bg-green-600 px-4 py-2.5 text-white transition hover:bg-green-700"
                                >
                                    Start Migration
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="migrating"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            <h3 className="text-center text-xl font-bold text-green-800">
                                Preparing the Dashboard 🌱
                            </h3>

                            <div className="mx-auto w-full max-w-xs">
                                <div className="relative h-2 w-full overflow-hidden rounded-full bg-green-200">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        className="absolute h-full rounded-full bg-gradient-to-r from-green-400 to-green-600"
                                    />
                                </div>
                                <p className="mt-2 text-center text-sm text-green-800">
                                    {progress}% Complete
                                </p>
                            </div>

                            <div className="space-y-3">
                                {migrationSteps.map((step, index) => (
                                    <motion.div
                                        key={step}
                                        initial={{ opacity: 0.5 }}
                                        animate={{
                                            opacity: 1,
                                            color: completedSteps.includes(step) ? 'currentColor' : '#9CA3AF',
                                        }}
                                        className="flex items-center gap-3"
                                    >
                                        {completedSteps.includes(step) ? (
                                            <motion.div
                                                initial={{ scale: 0.5 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: 'spring', bounce: 0.5 }}
                                            >
                                                <CheckCircle size={20} className="text-green-500" />
                                            </motion.div>
                                        ) : (
                                            <div className="flex h-5 w-5 items-center justify-center">
                                                {index === completedSteps.length ? (
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                                    >
                                                        <Loader size={20} className="text-green-500" />
                                                    </motion.div>
                                                ) : (
                                                    <div className="h-2 w-2 rounded-full bg-gray-300" />
                                                )}
                                            </div>
                                        )}
                                        <span
                                            className={
                                                completedSteps.includes(step)
                                                    ? 'text-green-800'
                                                    : 'text-gray-500'
                                            }
                                        >
                                            {step}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>

                            <p className="text-center text-sm text-green-700">
                               You're all set! Your TreeManager data is being migrated. Feel free to close this page; we’ll handle the rest and notify you when it's ready. 🌿
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default MigrationModal;
