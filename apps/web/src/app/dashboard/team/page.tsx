'use client'

import React, { useEffect, useState } from 'react';
import {
    Search,
    Download,
    MoreVertical,
    UserPlus,
    Eye,
    UserX,
    ChevronUp,
    ChevronDown,
    Filter,
    Link
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import InviteUserModal from './component/InviteUserModal';
import UserDetailsModal from './component/UserDetailsModal';
import { useToken } from '@/context/useTokenContext';
import { getTeamMemebers } from '@shared-core/fetchApi/api.fetch';
import useProjectStore from '@shared-core/store/useProjectStore';
import Spinner from '@/component/Spinner';
import avatar from 'animal-avatar-generator'
import BulkInvitationModal from './component/BulkInviteModal';


function transformData(data) {
    const members = data.members.map(member => ({
        uid: member.user.uid,
        name: member.user.name || member.user.authName,
        username: member.user.name || member.user.authName,
        email: member.user.email,
        role: capitalize(member.role),
        lastActive: member.user.isActive ? member.joinedAt : null,
        joinedDate: member.joinedAt,
        status: member.user.isActive ? 'Active' : 'Inactive',
        invitedBy: null, // No invitedBy info for members
        type: 'member',
        avatar: member.user.image,
    }));

    const invitations = data.invitations.map((invite, index) => ({
        uid: invite.uid, // Generate unique ID offset from members
        name: invite.email.split('@')[0],
        username: invite.email.split('@')[0],
        email: invite.email,
        role: capitalize(invite.role),
        lastActive: null,
        joinedDate: invite.createdAt,
        status: capitalize(invite.status), // e.g., Pending, Accepted
        invitedBy: invite.invitedBy?.displayName || invite.invitedBy?.name || 'Unknown',
        type: 'invitation',
        token: invite.token,
    }));

    return [...members, ...invitations];
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

const customImageGenerator = (id) => {
    const svg = avatar(id, { size: 40 })
    return <div
        className="h-10 w-10 rounded-full overflow-hidden"
        dangerouslySetInnerHTML={{ __html: svg }}
    />
}

const TeamsDashboard = () => {
    // Sample data - replace with your actual data fetching logic
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalUserOpen, setIsModalUserOpen] = useState(false);
    const { accessToken } = useToken()
    const [bulkInviteModal, setBulkInviteModal] = useState(false);

    const [users, setUsers] = useState<any>([]);
    const [loading, setLoading] = useState(false)
    // State for search and sorting
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({
        key: 'joinedDate',
        direction: 'desc'
    });

    const SelectedProject = useProjectStore((state) => state.selectedProject);

    useEffect(() => {
        if (SelectedProject) {
            fetchTeamMembers();
        }
    }, [SelectedProject])

    const fetchTeamMembers = async () => {
        setLoading(true)
        try {
            const response = await getTeamMemebers(accessToken || '', SelectedProject?.uid)
            if (response && response.statusCode === 200) {
                const transformedData = transformData(response.data);
                setUsers(transformedData)
            }
            setLoading(false)
        } catch (error) {
            setLoading(false)
        }
    }


    // Handle sorting
    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Get sorted and filtered users
    const getSortedAndFilteredUsers = () => {
        const filteredUsers = users.filter(user =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return [...filteredUsers].sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(date);
    };

    // Format time since last active
    const getTimeSince = (dateString) => {
        if (!dateString) return 'Never';

        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
        } else {
            return formatDate(dateString);
        }
    };

    // Get status badge color
    const getStatusColor = (status) => {
        switch (status) {
            case 'Active':
                return 'bg-green-700 text-white';
            case 'Suspended':
                return 'bg-red-100 text-red-800';
            case 'Pending Invitation':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };


    const downloadJsonAsCsv = (jsonData, filename, includeHeaders = true) => {
        // Return early if no data
        if (!jsonData || !jsonData.length) {
            console.error('No data provided for CSV download');
            return;
        }
        const finalList = [...jsonData]
        finalList.map(el => {
            delete el.uid;
            return el
        })
        try {

            // Get headers from the first object in the array
            const headers = Object.keys(finalList[0]);

            // Create CSV rows from the JSON data
            let csvRows = [];

            // Add headers row if requested
            if (includeHeaders) {
                csvRows.push(headers.join(','));
            }
            // Add data rows
            finalList.forEach(item => {
                const values = headers.map(header => {
                    // Handle special cases (commas, quotes, undefined, null)
                    const cellValue = item[header] === null || item[header] === undefined ? '' : item[header];
                    const escapedValue = String(cellValue)
                        .replace(/"/g, '""') // Escape double quotes with double quotes
                        .replace(/\n/g, ' '); // Replace newlines with spaces

                    // Wrap with quotes if contains comma, quote or newline
                    return /[,"\n]/.test(escapedValue) ? `"${escapedValue}"` : escapedValue;
                });

                csvRows.push(values.join(','));
            });

            // Combine rows into a CSV string
            const csvString = csvRows.join('\n');

            // Create a Blob containing the CSV data
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

            // Create a link element to trigger the download
            const link = document.createElement('a');

            // Create a URL for the blob
            const url = URL.createObjectURL(blob);

            // Set link properties
            link.setAttribute('href', url);
            link.setAttribute('download', `${filename}.csv`);
            link.style.visibility = 'hidden';

            // Add link to the document, trigger click, and remove it
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Release the blob URL
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error generating CSV download:', error);
        }
    };

    // Handlers for button actions (placeholders)
    const handleExportUsers = () => {
        console.log('Exporting users...');
        // Implement export logic
        downloadJsonAsCsv(users, 'userList')

    };

    const handleInviteUser = () => {
        console.log('Inviting user...');
        // Implement invite logic
        setIsModalOpen(true)
    };

    const handleViewUser = (userD) => {
        setSelectedUser(userD);
        setIsModalUserOpen(true);

    };

    const handleRemoveUser = (userId) => {
        console.log(`Removing user with ID: ${userId}`);
        // Implement remove user logic
    };

    // Get sorted users
    const sortedUsers = getSortedAndFilteredUsers();

    // Render sort indicator
    const renderSortIndicator = (key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
    };

    return (
        <div className="bg-white">
            <div className="flex flex-col mb-6 sm:flex-row sm:justify-between sm:items-center sm:space-y-0 sm:space-x-4 border-b border-gray-200 sticky top-0 pb-3 p-6" >
                <div className="flex items-center" style={{ flex: 1 }}>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name or email"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64"
                        />
                    </div>
                    {users && users.length > 0 && <button
                        onClick={handleExportUsers}
                        className="cursor-pointer ml-4 flex items-center text-sm text-gray-600 hover:text-green-800"
                    >
                        Export all {users.length} users
                        <Download size={16} className="ml-1" />
                    </button>}
                </div>
                <>
                    <button
                        onClick={() => { setBulkInviteModal(true) }}
                        className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium"
                    >
                        <Link size={18} className="mr-2" />
                        Bulk Invite
                    </button>
                    <button
                        onClick={handleInviteUser}
                        className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium"
                    >
                        <UserPlus size={18} className="mr-2" />
                        Invite User
                    </button>
                </>
            </div>
            <div className='p-6' style={{flex:1, display:'flex',flexDirection:'column', width:'full', height:'full'}}>
                {loading ? <div style={{ marginTop: '40vh' }}><Spinner /></div> : <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => requestSort('role')}
                                        className="flex items-center font-medium focus:outline-none"
                                    >
                                        Role
                                        {renderSortIndicator('role')}
                                    </button>
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => requestSort('lastActive')}
                                        className="flex items-center font-medium focus:outline-none"
                                    >
                                        Last Active
                                        {renderSortIndicator('lastActive')}
                                    </button>
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => requestSort('joinedDate')}
                                        className="flex items-center font-medium focus:outline-none"
                                    >
                                        Joined Date
                                        {renderSortIndicator('joinedDate')}
                                    </button>
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => requestSort('status')}
                                        className="flex items-center font-medium focus:outline-none"
                                    >
                                        Status
                                        {renderSortIndicator('status')}
                                    </button>
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sortedUsers.map((user) => (
                                <tr key={user.uid} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                {user.avatar ? <img
                                                    className="h-10 w-10 rounded-full"
                                                    src={user.avatar}
                                                    alt={user.name}
                                                /> : customImageGenerator(user.uid)}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                <div className="text-sm text-gray-500">
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm text-gray-900">{user.role}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm text-gray-500">{getTimeSince(user.lastActive)}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm text-gray-500">{user.status === 'Pending' ? "------------" : formatDate(user.joinedDate)}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(user.status)}`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap text-right text-sm font-medium" style={{ width: '120px' }}>
                                        <div className="flex justify-center">
                                            <button
                                                onClick={() => handleViewUser(user)}
                                                className="text-gray-600 hover:text-gray-900  cursor-pointer"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {sortedUsers.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No users found matching your search criteria.</p>
                        </div>
                    )}
                </div>}
            </div>
            <AnimatePresence>
                <BulkInvitationModal
                    isOpen={bulkInviteModal}
                    onClose={() => setBulkInviteModal(false)}
                />
            </AnimatePresence>
            <AnimatePresence>
                <InviteUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} token={accessToken} handleRefresh={fetchTeamMembers} />
            </AnimatePresence>
            <AnimatePresence>
                <UserDetailsModal
                    isOpen={isModalUserOpen}
                    onClose={() => setIsModalUserOpen(false)}
                    user={selectedUser}
                    handleRefresh={fetchTeamMembers} />
            </AnimatePresence>
        </div>
    );
};

export default TeamsDashboard;