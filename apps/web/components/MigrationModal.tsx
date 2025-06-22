'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle, Loader, LogOut, XCircle, RefreshCw, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from 'dashboard/store/useUserStore';
import useProject from 'dashboard/store/useProjectStore';

import { checkForMigration, checkMigrationStatusBackend, startMigrationBackend, updateUserMigrate } from 'dashboard/api/api.fetch'
import { useToken } from 'dashboard/context/TokenContext';

const MigrationModal = () => {
    const [showModal, setShowModal] = useState(false);
    const [migrationState, setMigrationState] = useState('idle'); // idle, starting, in_progress, completed, stopped, error
    const [migrationData, setMigrationData] = useState(null);
    const [stoppedCount, setStoppedCount] = useState(0);
    const [error, setError] = useState(null);
    const [planetId, setPlanetId] = useState('')
    const UserDetails = useUserStore(state => state.user);
    const { accessToken } = useToken();
    const updateUser = useUserStore(state => state.updateUser);
    const intervalRef = useRef(null);

    const onLogout = () => {
        window.location.href = '/api/auth/logout';
    };

    const migrationSteps = [
        { key: 'userMigrated', label: "🪴 Migrating user data" },
        { key: 'projectMigrated', label: "📦 Transferring projects" },
        { key: 'sitesMigrated', label: "📌 Moving related sites" },
        { key: 'speciesMigrated', label: "🌿 Transferring plant species data" },
        { key: 'interventionMigrated', label: "🌳 Migrating interventions" },
        { key: 'imagesMigrated', label: "🖼️ Processing images" }
    ];

    const { selectedProject } = useProject();

    useEffect(() => {
        if (UserDetails && UserDetails.migratedAt === null && accessToken && selectedProject) {
            checkMigrationNeeded();
        }
    }, [UserDetails, selectedProject]);

    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    const checkMigrationNeeded = async () => {
        try {
            const response = await checkForMigration(accessToken || '');
            if (response && response.data) {
                if (response.data.migrationNeeded) {
                    setShowModal(true);
                    setPlanetId(response.data.planetId)
                } else {
                    updateUser({ migratedAt: new Date().toISOString() });
                }
            }
        } catch (error) {
            setError('Failed to check migration status');
        }
    };

    const startMigration = async () => {
        try {
            setMigrationState('starting');
            setError(null);
            const responseCheck = await checkMigrationStatusBackend(accessToken || '')
            if (responseCheck && responseCheck.data && responseCheck.data.migrationFound) {
                setMigrationData(responseCheck.data);
                setMigrationState('in_progress');
                startStatusPolling();
                return
            }
            const response = await startMigrationBackend(accessToken || '', { planetId })
            if (!response.data) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            setMigrationData(response.data);
            setMigrationState('in_progress');
            startStatusPolling();

        } catch (error) {
            console.error('Error starting migration:', error);
            setError('Failed to start migration. Please try again.');
            setMigrationState('error');
        }
    };

    const checkMigrationStatus = async () => {
        try {
            const response = await checkMigrationStatusBackend(accessToken || '')
            if (response && !response.data) {
                throw ''
            }
            const data = response.data
            setMigrationData(response.data);
            if (data.currentStep === 'completed') {
                setMigrationState('completed');
                stopStatusPolling();
                updateUser({ migratedAt: new Date().toISOString() });
            } else if (data.currentStep === 'failed') {
                setMigrationState('failed');
                setStoppedCount(prev => prev + 1);

                if (stoppedCount >= 2) { // Will be 3 after increment
                    stopStatusPolling();
                }
            } else if (data.currentStep === 'in_progress') {
                setMigrationState('in_progress');
                // Reset stopped count if back to in_progress
                setStoppedCount(0);
            }

        } catch (error) {
            console.error('Error checking migration status:', error);
            setError('Failed to check migration status');
        }
    };

    const startStatusPolling = () => {
        intervalRef.current = setInterval(() => {
            checkMigrationStatus();
        }, 10000); // Every 10 seconds
    };

    const stopStatusPolling = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };


    const handleRetryMigration = () => {
        setMigrationState('idle');
        setStoppedCount(0);
        setError(null);
        setMigrationData(null);
    };

    const calculateProgress = () => {
        if (!migrationData) return 0;

        const completedSteps = migrationSteps.filter(step =>
            migrationData[step.key] === true || migrationData[step.key] > 0
        ).length;

        return Math.round((completedSteps / migrationSteps.length) * 100);
    };

    const getCompletedSteps = () => {
        if (!migrationData) return [];

        return migrationSteps.filter(step =>
            migrationData[step.key] === true || migrationData[step.key] > 0
        );
    };

    const handleStartApp = () => {
        setShowModal(false);
        // Optionally redirect to main dashboard
        window.location.reload();
    };

    if (!showModal) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ zIndex: 1000 }}>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-green-100/30 backdrop-blur-sm"
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
                    {/* Initial State */}
                    {migrationState === 'idle' && (
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
                                Welcome back, eco-warrior! We're updating your settings to align with the new dashboard experience. Your data is safe, and this will only take a moment.
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
                                    onClick={startMigration}
                                    className="w-1/2 rounded-lg bg-green-600 px-4 py-2.5 text-white transition hover:bg-green-700"
                                >
                                    Start Migration
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Starting State */}
                    {migrationState === 'starting' && (
                        <motion.div
                            key="starting"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6 text-center"
                        >
                            <div className="flex items-center justify-center">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                >
                                    <Loader size={32} className="text-green-500" />
                                </motion.div>
                            </div>
                            <h3 className="text-xl font-bold text-green-800">
                                Starting Migration... 🌱
                            </h3>
                            <p className="text-gray-700">
                                Please wait while we initialize the migration process.
                            </p>
                        </motion.div>
                    )}

                    {/* Migration In Progress */}
                    {migrationState === 'in_progress' && (
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
                                        animate={{ width: `${calculateProgress()}%` }}
                                        className="absolute h-full rounded-full bg-gradient-to-r from-green-400 to-green-600"
                                    />
                                </div>
                                <p className="mt-2 text-center text-sm text-green-800">
                                    {calculateProgress()}% Complete
                                </p>
                            </div>

                            <div className="space-y-3">
                                {migrationSteps.map((step, index) => {
                                    const isCompleted = getCompletedSteps().includes(step);
                                    const isActive = !isCompleted && index === getCompletedSteps().length;

                                    return (
                                        <motion.div
                                            key={step.key}
                                            initial={{ opacity: 0.5 }}
                                            animate={{
                                                opacity: 1,
                                                color: isCompleted ? 'currentColor' : '#9CA3AF',
                                            }}
                                            className="flex items-center gap-3"
                                        >
                                            {isCompleted ? (
                                                <motion.div
                                                    initial={{ scale: 0.5 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ type: 'spring', bounce: 0.5 }}
                                                >
                                                    <CheckCircle size={20} className="text-green-500" />
                                                </motion.div>
                                            ) : (
                                                <div className="flex h-5 w-5 items-center justify-center">
                                                    {isActive ? (
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
                                                    isCompleted
                                                        ? 'text-green-800'
                                                        : 'text-gray-500'
                                                }
                                            >
                                                {step.label}
                                                {migrationData && migrationData[step.key] && typeof migrationData[step.key] === 'number' && (
                                                    <span className="ml-2 text-sm">({migrationData[step.key]})</span>
                                                )}
                                            </span>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            <p className="text-center text-sm text-green-700">
                                You're all set! Your TreeManager data is being migrated. Feel free to close this page; we’ll handle the rest and notify you when it's ready. 🌿
                            </p>
                        </motion.div>
                    )}

                    {/* Migration Completed */}
                    {migrationState === 'completed' && (
                        <motion.div
                            key="completed"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6 text-center"
                        >
                            <div className="mb-5 flex items-center justify-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                                    <CheckCircle size={24} />
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-green-800">
                                Migration Complete! 🎉
                            </h3>

                            <p className="text-gray-700">
                                Your data has been successfully migrated to the new dashboard. You're all set to start using the enhanced TreeManager experience!
                            </p>

                            <button
                                onClick={handleStartApp}
                                className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-white transition hover:bg-green-700"
                            >
                                Start Using the App
                            </button>
                        </motion.div>
                    )}

                    {/* Migration Stopped */}
                    {migrationState === 'failed' && (
                        <motion.div
                            key="failed"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6 text-center"
                        >
                            <div className="mb-5 flex items-center justify-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                                    <XCircle size={24} />
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-red-800">
                                Migration Paused ⏸️
                            </h3>

                            <p className="text-gray-700">
                                The migration process has been temporarily stopped. This might be due to server maintenance or high traffic.
                            </p>

                            {stoppedCount >= 3 ? (
                                <div className="space-y-4">
                                    <p className="text-red-600 font-medium">
                                        Migration has been failed multiple times. Please contact our support team for assistance.
                                    </p>
                                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                                        <Mail size={16} />
                                        <a
                                            href="mailto:info@plant-for-the-planet.org"
                                            className="text-green-600 hover:text-green-700 underline"
                                        >
                                            info@plant-for-the-planet.org
                                        </a>
                                    </div>
                                    <button
                                        onClick={onLogout}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-700 transition hover:bg-gray-100"
                                    >
                                        Log Out
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-3">
                                    <button
                                        onClick={onLogout}
                                        className="flex w-1/2 items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-gray-700 transition hover:bg-gray-100"
                                    >
                                        <LogOut size={16} />
                                        <span>Log Out</span>
                                    </button>

                                    <button
                                        onClick={handleRetryMigration}
                                        className="flex w-1/2 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-white transition hover:bg-green-700"
                                    >
                                        <RefreshCw size={16} />
                                        <span>Retry</span>
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Error State */}
                    {migrationState === 'error' && (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6 text-center"
                        >
                            <div className="mb-5 flex items-center justify-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                                    <XCircle size={24} />
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-red-800">
                                Migration Error ❌
                            </h3>

                            <p className="text-gray-700">
                                {error || 'An unexpected error occurred during migration.'}
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={onLogout}
                                    className="flex w-1/2 items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-gray-700 transition hover:bg-gray-100"
                                >
                                    <LogOut size={16} />
                                    <span>Log Out</span>
                                </button>

                                <button
                                    onClick={handleRetryMigration}
                                    className="flex w-1/2 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-white transition hover:bg-green-700"
                                >
                                    <RefreshCw size={16} />
                                    <span>Retry</span>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default MigrationModal;