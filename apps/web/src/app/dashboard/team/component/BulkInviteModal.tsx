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
    AlertCircle,
    Minus
} from 'lucide-react';
import { createProjectInviteLink, getAllProjectInviteLink, removeInviteLink } from '@shared-core/fetchApi/api.fetch';
import { useToken } from '@/context/useTokenContext'
import useProjectStore from '@shared-core/store/useProjectStore'

const BulkInvitationModal = ({ isOpen, onClose }) => {
    const [existingLinks, setExistingLinks] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [domainRestrictions, setDomainRestrictions] = useState(['']); // Changed to array
    const [newLink, setNewLink] = useState(null);
    const [copiedId, setCopiedId] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { accessToken } = useToken()
    const SelectedProject = useProjectStore(state => (state.selectedProject))
    const inviteurl = `${window.location.protocol}//${window.location.host}/dashboard?project-link`;

    // Fetch existing links when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchExistingLinks();
            setError('');
            setSuccess('');
            setDomainRestrictions(['']); // Reset to single empty field
        }
    }, [isOpen]);

    const fetchExistingLinks = async () => {
        setIsLoading(true);
        try {
            const response = await getAllProjectInviteLink(accessToken || '', SelectedProject?.uid)
            if (response && response.statusCode == 200) {
                setExistingLinks(response.data)
                setIsLoading(false);
            } else {
                throw ''
            }
            setIsLoading(false);
        } catch (err) {
            setError('Failed to fetch existing links');
            setIsLoading(false);
        }
    };

    const addDomainField = () => {
        setDomainRestrictions(prev => [...prev, '']);
    };

    const removeDomainField = (index) => {
        if (domainRestrictions.length > 1) {
            setDomainRestrictions(prev => prev.filter((_, i) => i !== index));
        }
    };

    const updateDomainRestriction = (index, value) => {
        setDomainRestrictions(prev => 
            prev.map((domain, i) => i === index ? value : domain)
        );
    };

    const generateInvitationLink = async () => {
        // Filter out empty domains and validate
        const validDomains = domainRestrictions.filter(domain => domain.trim());
        
        if (validDomains.length === 0) {
            setError('Please enter at least one domain restriction');
            return;
        }

        // Validate all domains start with @
        const invalidDomains = validDomains.filter(domain => !domain.startsWith('@'));
        if (invalidDomains.length > 0) {
            setError('All domain restrictions should start with @');
            return;
        }

        // Check for duplicates
        const uniqueDomains = [...new Set(validDomains)];
        if (uniqueDomains.length !== validDomains.length) {
            setError('Duplicate domains are not allowed');
            return;
        }

        setIsCreating(true);
        setError('');

        try {
            const response = await createProjectInviteLink(accessToken || '', SelectedProject?.uid, {
                restriction: uniqueDomains, // Now sending array
                expiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
            })
            if (response && (response.statusCode == 200 || response.statusCode == 201)) {
                const generatedLink = {
                    id: Date.now().toString(),
                    invitationlink: `${response.data.link}`,
                    restriction: uniqueDomains, // Updated field name
                    created_at: new Date().toISOString(),
                    created_by: "me"
                };
                setNewLink(`${response.data.link}`);
                setExistingLinks(prev => [generatedLink, ...prev]);
                setDomainRestrictions(['']); // Reset to single empty field
                setSuccess('Invitation link created successfully!');
                setIsCreating(false);
            } else {
                throw ''
            }

        } catch (err) {
            setError('Failed to create invitation link');
            setIsCreating(false);
        }
    };

    const deleteLink = async (id) => {
        try {
            setExistingLinks(prev => prev.filter(link => link.id !== id));
            setSuccess('Link deleted successfully');
            await removeInviteLink(accessToken || '', SelectedProject?.uid, id)
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

    const renderDomainRestrictions = (restrictions) => {
        // Handle both old format (string) and new format (array)
        if (Array.isArray(restrictions)) {
            return restrictions.join(', ');
        }
        return restrictions || '';
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/10 bg-opacity-10  backdrop-blur-sm z-50 flex items-center justify-center p-4"
            style={{ zIndex: 10000 }}
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
                                    Domain Restrictions
                                </label>
                                
                                {/* Dynamic Domain Input Fields */}
                                <div className="space-y-2">
                                    {domainRestrictions.map((domain, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="flex items-center gap-2"
                                        >
                                            <div className="relative flex-1">
                                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={domain}
                                                    onChange={(e) => updateDomainRestriction(index, e.target.value)}
                                                    placeholder="@company.com"
                                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    disabled={isCreating}
                                                />
                                            </div>
                                            
                                            {/* Remove button (only show if more than 1 field) */}
                                            {domainRestrictions.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeDomainField(index)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    disabled={isCreating}
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Add another domain button */}
                                <button
                                    type="button"
                                    onClick={addDomainField}
                                    className="mt-2 text-sm text-[#006B3F] hover:text-green-700 flex items-center gap-1"
                                    disabled={isCreating}
                                >
                                    <Plus className="w-3 h-3" />
                                    Add another domain
                                </button>

                                <p className="text-xs text-gray-500 mt-1">
                                    Only emails with these domains can use the invitation link
                                </p>
                            </div>

                            <button
                                onClick={generateInvitationLink}
                                disabled={isCreating}
                                className="w-full bg-[#007A49] hover:bg-[#006B3F]disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
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
                                            value={`${inviteurl}=${newLink}`}
                                            readOnly
                                            className="flex-1 px-3 py-2 bg-white border border-green-300 rounded text-sm"
                                        />
                                        <button
                                            onClick={() => copyToClipboard(`${inviteurl}=${newLink}`, newLink.id)}
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
                                                        {renderDomainRestrictions(link.restriction || link.domain_restriction)}
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
                                                        value={`${inviteurl}=${link.invitationlink}`}
                                                        readOnly
                                                        className="flex-1 px-2 py-1 text-xs bg-white border border-gray-300 rounded truncate"
                                                    />
                                                    <button
                                                        onClick={() => copyToClipboard(`${inviteurl}=${link.invitationlink}`, link.id)}
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