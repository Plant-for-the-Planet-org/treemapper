import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Plus,
    Copy,
    Trash2,
    Link2 as LinkIcon,
    Mail,
    Calendar,
    User,
    Loader2,
    Check,
    AlertCircle
} from 'lucide-react';

const BulkInvitationModal = ({ isOpen, onClose }) => {
    const [existingLinks, setExistingLinks] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [domainRestriction, setDomainRestriction] = useState('');
    const [newLink, setNewLink] = useState(null);
    const [copiedId, setCopiedId] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Fetch existing links when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchExistingLinks();
            setError('');
            setSuccess('');
        }
    }, [isOpen]);

    const fetchExistingLinks = async () => {
        setIsLoading(true);
        try {
            // TODO: Replace with actual API call
            // const response = await fetch('/api/invitations');
            // const data = await response.json();

            // Placeholder data
            setTimeout(() => {
                setExistingLinks([
                    {
                        id: '1',
                        invitationlink: 'https://app.example.com/invite/abc123',
                        domain_restriction: '@company.com',
                        created_at: '2024-01-15T10:30:00Z',
                        created_by: 'john.doe@example.com'
                    },
                    {
                        id: '2',
                        invitationlink: 'https://app.example.com/invite/xyz789',
                        domain_restriction: '@university.edu',
                        created_at: '2024-01-14T15:45:00Z',
                        created_by: 'jane.smith@example.com'
                    }
                ]);
                setIsLoading(false);
            }, 1000);
        } catch (err) {
            setError('Failed to fetch existing links');
            setIsLoading(false);
        }
    };

    const generateInvitationLink = async () => {
        if (!domainRestriction.trim()) {
            setError('Please enter a domain restriction');
            return;
        }

        if (!domainRestriction.startsWith('@')) {
            setError('Domain restriction should start with @');
            return;
        }

        setIsCreating(true);
        setError('');

        try {
            // TODO: Replace with actual API call
            // const response = await fetch('/api/invitations', {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify({ domain_restriction: domainRestriction })
            // });
            // const data = await response.json();

            // Simulated API response
            setTimeout(() => {
                const generatedLink = {
                    id: Date.now().toString(),
                    invitationlink: `https://app.example.com/invite/${Math.random().toString(36).substr(2, 9)}`,
                    domain_restriction: domainRestriction,
                    created_at: new Date().toISOString(),
                    created_by: 'current.user@example.com'
                };

                setNewLink(generatedLink);
                setExistingLinks(prev => [generatedLink, ...prev]);
                setDomainRestriction('');
                setSuccess('Invitation link created successfully!');
                setIsCreating(false);
            }, 1500);
        } catch (err) {
            setError('Failed to create invitation link');
            setIsCreating(false);
        }
    };

    const deleteLink = async (id) => {
        try {
            // TODO: Replace with actual API call
            // await fetch(`/api/invitations/${id}`, { method: 'DELETE' });

            setExistingLinks(prev => prev.filter(link => link.id !== id));
            setSuccess('Link deleted successfully');
        } catch (err) {
            setError('Failed to delete link');
        }
    };

    const copyToClipboard = async (text, id) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            setError('Failed to copy to clipboard');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            style={{zIndex:10000}}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", duration: 0.3 }}
                className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                        <LinkIcon className="w-6 h-6 text-blue-600" />
                        Invitation Links
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row h-full max-h-[calc(90vh-80px)]">
                    {/* Create New Link Section */}
                    <div className="lg:w-1/2 p-6 border-r border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-green-600" />
                            Create New Link
                        </h3>

                        {/* Success/Error Messages */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700"
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="text-sm">{error}</span>
                                </motion.div>
                            )}

                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700"
                                >
                                    <Check className="w-4 h-4" />
                                    <span className="text-sm">{success}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Domain Restriction
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={domainRestriction}
                                        onChange={(e) => setDomainRestriction(e.target.value)}
                                        placeholder="@company.com"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        disabled={isCreating}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Only emails with this domain can use the invitation link
                                </p>
                            </div>

                            <button
                                onClick={generateInvitationLink}
                                disabled={isCreating}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                {isCreating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Creating Link...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4" />
                                        Generate Invitation Link
                                    </>
                                )}
                            </button>
                        </div>

                        {/* New Link Animation */}
                        <AnimatePresence>
                            {newLink && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ type: "spring", duration: 0.5 }}
                                    className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Check className="w-5 h-5 text-green-600" />
                                        <span className="font-medium text-green-800">New Link Created!</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={newLink.invitationlink}
                                            readOnly
                                            className="flex-1 px-3 py-2 bg-white border border-green-300 rounded text-sm"
                                        />
                                        <button
                                            onClick={() => copyToClipboard(newLink.invitationlink, newLink.id)}
                                            className="p-2 text-green-600 hover:bg-green-100 rounded transition-colors"
                                        >
                                            {copiedId === newLink.id ? (
                                                <Check className="w-4 h-4" />
                                            ) : (
                                                <Copy className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Existing Links Section */}
                    <div className="lg:w-1/2 p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                            <LinkIcon className="w-5 h-5 text-blue-600" />
                            Existing Links
                        </h3>

                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {isLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="animate-pulse">
                                            <div className="bg-gray-200 h-20 rounded-lg"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : existingLinks.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <LinkIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                    <p>No invitation links created yet</p>
                                </div>
                            ) : (
                                existingLinks.map((link) => (
                                    <motion.div
                                        key={link.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -100 }}
                                        className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Mail className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {link.domain_restriction}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>{formatDate(link.created_at)}</span>
                                                    <User className="w-3 h-3 ml-2" />
                                                    <span>{link.created_by}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={link.invitationlink}
                                                        readOnly
                                                        className="flex-1 px-2 py-1 text-xs bg-white border border-gray-300 rounded truncate"
                                                    />
                                                    <button
                                                        onClick={() => copyToClipboard(link.invitationlink, link.id)}
                                                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                        title="Copy link"
                                                    >
                                                        {copiedId === link.id ? (
                                                            <Check className="w-3 h-3 text-green-600" />
                                                        ) : (
                                                            <Copy className="w-3 h-3" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => deleteLink(link.id)}
                                                className="p-1 text-gray-400 hover:text-red-600 transition-colors ml-2"
                                                title="Delete link"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default BulkInvitationModal;
