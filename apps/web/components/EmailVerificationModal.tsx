'use client'
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

const EmailVerificationModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const searchParams = useSearchParams();

    useEffect(() => {
        // Check if verification=required parameter exists in URL
        const verificationRequired = searchParams.get('verification') === 'required';
        
        if (verificationRequired) {
            setIsOpen(true);
        }
    }, [searchParams]);

    const handleClose = () => {
        setIsOpen(false);
        // Optionally clear the URL parameter when closing
        if (searchParams.get('verification') === 'required') {
            const url = new URL(window.location.href);
            url.searchParams.delete('verification');
            window.history.replaceState({}, '', url.toString());
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop with blur */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        onClick={handleClose} // Allow closing by clicking backdrop
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="fixed left-1/3 top-1/4 w-full max-w-md z-50"
                    >
                        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 relative">
                            {/* Close button */}
                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {/* Icon */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6"
                            >
                                <Mail className="w-8 h-8 text-blue-600" />
                            </motion.div>

                            {/* Content */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-center"
                            >
                                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                                    Email Verification Required
                                </h2>
                                <p className="text-gray-600 mb-6">
                                    Please verify your email address before you can access your account. Check your inbox for a verification email.
                                </p>

                                {/* Info box */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6"
                                >
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                        <div className="text-left">
                                            <p className="text-sm text-amber-800 font-medium mb-1">
                                                Didn't receive the email?
                                            </p>
                                            <p className="text-sm text-amber-700">
                                                Check your spam folder or try logging in again to resend the verification email.
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Actions */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="flex flex-col gap-3"
                                >
                                    <button
                                        onClick={handleClose}
                                        className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                    >
                                        I'll verify my email
                                    </button>
                                </motion.div>
                            </motion.div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default EmailVerificationModal;