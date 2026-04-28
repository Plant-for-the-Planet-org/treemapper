import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    User,
    Search,
    Loader2,
    AlertTriangle,
    CheckCircle,
    Crown,
    Shield,
    Users,
    MessageSquare,
    Bell,
    BellOff,
    TreePine,
    Hash,
    Calendar,
    ArrowRight
} from 'lucide-react';
import { getMyProjectMember, ownerrhsipTranferCall } from '@shared-core/fetchApi/api.fetch';

// Types
interface User {
    id: number;
    displayName: string;
    email: string;
    projectRole: 'owner' | 'admin' | 'contributor' | 'observer';
    avatar?: string;
    isActive: boolean;
}

interface Intervention {
    id: number;
    uid: string;
    hid: string;
    type: string;
    status: string;
    createdAt: string;
    treeCount?: number;
}

interface TransferFormData {
    newOwnerId: number;
    reason: string;
    transferMessage: string;
    notifyNewOwner: boolean;
    notifyOldOwner: boolean;
}

interface OwnershipTransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    intervention: Intervention;
    currentOwner: User;
    onTransferComplete: (result: any) => void;
    onSearchUsers: (query: string) => Promise<User[]>;
    onTransferOwnership: (interventionId: number, data: TransferFormData) => Promise<any>;
}

const getRoleIcon = (role: string) => {
    switch (role) {
        case 'owner':
            return <Crown className="h-3 w-3" />;
        case 'admin':
            return <Shield className="h-3 w-3" />;
        case 'contributor':
            return <Users className="h-3 w-3" />;
        default:
            return <User className="h-3 w-3" />;
    }
};

const getRoleColor = (role: string) => {
    switch (role) {
        case 'owner':
            return 'bg-yellow-100 text-yellow-800';
        case 'admin':
            return 'bg-purple-100 text-purple-800';
        case 'contributor':
            return 'bg-blue-100 text-blue-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

const UserSearchSection = ({
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching,
    selectedUser,
    onUserSelect,
    currentOwner
}) => {
    return (
        <div className="space-y-3">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select New Owner *
                </label>
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search project members by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                    {isSearching && (
                        <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
                    )}
                </div>
            </div>

            {/* Selected User Display */}
            {selectedUser && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div className="flex-1">
                            <h4 className="text-sm font-medium text-green-900">Selected New Owner</h4>
                            <div className="flex items-center space-x-2 mt-1">
                                <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center">
                                    <User className="h-3 w-3 text-green-700" />
                                </div>
                                <div>
                                    <div className="font-medium text-green-800">{selectedUser.displayName}</div>
                                    <div className="text-xs text-green-600">{selectedUser.email}</div>
                                </div>
                                <Badge className={`${getRoleColor(selectedUser.projectRole)} text-xs`}>
                                    <div className="flex items-center space-x-1">
                                        {getRoleIcon(selectedUser.projectRole)}
                                        <span className="capitalize">{selectedUser.projectRole}</span>
                                    </div>
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Search Results */}
            {searchTerm && !selectedUser && (
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                    {isSearching ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                            <span className="ml-2 text-sm text-gray-500">Searching...</span>
                        </div>
                    ) : searchResults.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {searchResults
                                .filter(user => user.id !== currentOwner.id) // Exclude current owner
                                .map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => onUserSelect(user)}
                                    >
                                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                            <User className="h-4 w-4 text-gray-500" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-medium text-gray-900">{user.displayName}</span>
                                                <Badge className={`${getRoleColor(user.projectRole)} text-xs`}>
                                                    <div className="flex items-center space-x-1">
                                                        {getRoleIcon(user.projectRole)}
                                                        <span className="capitalize">{user.projectRole}</span>
                                                    </div>
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-gray-500">{user.email}</div>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-gray-400" />
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <User className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <div>No eligible users found</div>
                            <div className="text-xs text-gray-400 mt-1">
                                Only active project members can own interventions
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!searchTerm && !selectedUser && (
                <div className="text-center py-6 text-gray-400 border border-gray-200 border-dashed rounded-lg">
                    <Search className="h-8 w-8 mx-auto mb-2" />
                    <div>Start typing to search for project members</div>
                </div>
            )}
        </div>
    );
};

const OwnershipTransferModal = ({
    isOpen,
    onClose,
    intervention,
    currentOwner,
    onTransferComplete,
    selectedProject,
    accessToken
}) => {
    // State
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isTransferring, setIsTransferring] = useState(false);
    const [error, setError] = useState('');
    // Form data
    const [reason, setReason] = useState('');
    const [transferMessage, setTransferMessage] = useState('');
    const [notifyNewOwner, setNotifyNewOwner] = useState(true);
    const [notifyOldOwner, setNotifyOldOwner] = useState(true);

    // Debounced search
    const handleSearch = async (term) => {
        if (!term.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        setError('');

        try {
            // const results = await getMyProjectMember(accessToken, term.trim());
            return;
            setSearchResults(results.data);
        } catch (error) {
            console.error('Search failed:', error);
            setError('Failed to search users. Please try again.');
        } finally {
            setIsSearching(false);
        }

    }



    useEffect(() => {
        const timeoutId = setTimeout(() => {
            handleSearch(searchTerm);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, handleSearch]);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setSelectedUser(null);
            setReason('');
            setTransferMessage('');
            setNotifyNewOwner(true);
            setNotifyOldOwner(true);
            setError('');
        }
    }, [isOpen]);

    const handleUserSelect = (user) => {
        setSelectedUser(user);
        setSearchTerm(user.displayName);
        setError('');
    };

    const handleTransfer = async () => {
        if (!selectedUser) {
            setError('Please select a new owner');
            return;
        }

        if (!reason.trim()) {
            setError('Please provide a reason for the transfer');
            return;
        }

        setIsTransferring(true);
        setError('');

        try {
            const transferData = {
                newOwnerId: selectedUser.id,
                reason: reason.trim(),
                transferMessage: transferMessage.trim(),
                notifyNewOwner,
                notifyOldOwner,
            };

            const result = await ownerrhsipTranferCall(accessToken, transferData, intervention.uid, selectedProject);
            onTransferComplete(result);
            onClose();
        } catch (error) {
            console.error('Transfer failed:', error);
            setError(error.message || 'Failed to transfer ownership. Please try again.');
        } finally {
            setIsTransferring(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                        <TreePine className="h-5 w-5 text-green-600" />
                        <span>Transfer Intervention Ownership</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Current Intervention Info */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">Intervention Details</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Hash className="h-4 w-4 text-gray-500" />
                                    <span className="font-medium">ID:</span>
                                    <span className="font-mono text-blue-600">{intervention.hid}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Badge variant="outline" className="capitalize">
                                        {intervention.type?.replace('-', ' ')}
                                    </Badge>
                                    <Badge className={
                                        intervention.status === 'active' ? 'bg-green-100 text-green-800' :
                                            intervention.status === 'planned' ? 'bg-blue-100 text-blue-800' :
                                                'bg-gray-100 text-gray-800'
                                    }>
                                        {intervention.status}
                                    </Badge>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {intervention.treeCount !== undefined && (
                                    <div className="flex items-center space-x-2">
                                        <TreePine className="h-4 w-4 text-gray-500" />
                                        <span>{intervention.treeCount} trees</span>
                                    </div>
                                )}
                                <div className="flex items-center space-x-2">
                                    <Calendar className="h-4 w-4 text-gray-500" />
                                    <span>{new Date(intervention.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Current Owner */}
                    {/* <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h3 className="text-sm font-medium text-blue-900 mb-2">Current Owner</h3>
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-blue-700" />
                            </div>
                            <div>
                                <div className="font-medium text-blue-900">{currentOwner.displayName}</div>
                                <div className="text-sm text-blue-700">{currentOwner.email}</div>
                            </div>
                            <Badge className={`${getRoleColor(currentOwner.projectRole)}`}>
                                <div className="flex items-center space-x-1">
                                    {getRoleIcon(currentOwner.projectRole)}
                                    <span className="capitalize">{currentOwner.projectRole}</span>
                                </div>
                            </Badge>
                        </div>
                    </div> */}

                    {/* User Search */}
                    <UserSearchSection
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        searchResults={searchResults}
                        isSearching={isSearching}
                        selectedUser={selectedUser}
                        onUserSelect={handleUserSelect}
                        currentOwner={currentOwner}
                    />

                    {/* Transfer Reason */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Reason for Transfer *
                        </label>
                        <Textarea
                            placeholder="Please provide a reason for this ownership transfer..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            className="resize-none"
                            maxLength={500}
                        />
                        <div className="text-xs text-gray-500 text-right">
                            {reason.length}/500 characters
                        </div>
                    </div>

                    {/* Optional Message */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Message to New Owner (Optional)
                        </label>
                        <Textarea
                            placeholder="Any additional instructions or information for the new owner..."
                            value={transferMessage}
                            onChange={(e) => setTransferMessage(e.target.value)}
                            rows={2}
                            className="resize-none"
                            maxLength={1000}
                        />
                        <div className="text-xs text-gray-500 text-right">
                            {transferMessage.length}/1000 characters
                        </div>
                    </div>

                    {/* Notification Settings */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                            Notifications
                        </label>
                        <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="notify-new"
                                    checked={notifyNewOwner}
                                    onCheckedChange={setNotifyNewOwner}
                                />
                                <label htmlFor="notify-new" className="flex items-center space-x-2 text-sm cursor-pointer">
                                    <Bell className="h-4 w-4 text-gray-500" />
                                    <span>Notify new owner about the transfer</span>
                                </label>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="notify-old"
                                    checked={notifyOldOwner}
                                    onCheckedChange={setNotifyOldOwner}
                                />
                                <label htmlFor="notify-old" className="flex items-center space-x-2 text-sm cursor-pointer">
                                    <Bell className="h-4 w-4 text-gray-500" />
                                    <span>Notify current owner about the transfer</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Warning */}
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Important:</strong> This action will transfer ownership of the intervention
                            and all associated trees to the selected user. The transfer cannot be undone automatically.
                        </AlertDescription>
                    </Alert>

                    {/* Error Display */}
                    {error && (
                        <Alert className="border-red-200 bg-red-50">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800">
                                {error}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isTransferring}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleTransfer}
                        disabled={!selectedUser || !reason.trim() || isTransferring}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {isTransferring ? (
                            <div className="flex items-center space-x-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Transferring...</span>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <ArrowRight className="h-4 w-4" />
                                <span>Transfer Ownership</span>
                            </div>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// Example usage component
const OwenrshipTransfer = ({ isModalOpen, setIsModalOpen, intervention, owner, handleTransferComplete, selectedProject, token }) => {
    return (<OwnershipTransferModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        intervention={intervention}
        currentOwner={owner}
        onTransferComplete={handleTransferComplete}
        selectedProject={selectedProject}
        accessToken={token}
    />)
}
export default OwenrshipTransfer;