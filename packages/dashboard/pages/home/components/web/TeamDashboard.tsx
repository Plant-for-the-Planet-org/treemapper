import React, { useState } from 'react';
import {
    Search,
    Download,
    MoreVertical,
    UserPlus,
    Eye,
    UserX,
    ChevronUp,
    ChevronDown,
    Filter
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import InviteUserModal from './InviteUserModal';
import UserDetailsModal from './UserDetailsModal';


const TeamsDashboard = () => {
    // Sample data - replace with your actual data fetching logic
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalUserOpen, setIsModalUserOpen] = useState(false);
    const [users, setUsers] = useState([
        {
            id: 1,
            name: 'John Doe',
            username: 'johndoe',
            email: 'john.doe@example.com',
            role: 'Admin',
            lastActive: '2025-04-20T10:30:00',
            joinedDate: '2024-01-15T09:00:00',
            status: 'Active',
            invitedBy: 'Sarah Williams'
        },
        {
            id: 2,
            name: 'Jane Smith',
            username: 'janesmith',
            email: 'jane.smith@example.com',
            role: 'Editor',
            lastActive: '2025-04-19T14:45:00',
            joinedDate: '2024-02-22T11:30:00',
            status: 'Active',
            invitedBy: 'John Doe'
        },
        {
            id: 3,
            name: 'Robert Johnson',
            username: 'robertj',
            email: 'robert.j@example.com',
            role: 'Viewer',
            lastActive: '2025-04-10T09:15:00',
            joinedDate: '2024-03-05T13:20:00',
            status: 'Suspended',
            invitedBy: 'Sarah Williams'
        },
        {
            id: 4,
            name: 'Emily Wilson',
            username: 'emilyw',
            email: 'emily.w@example.com',
            role: 'Editor',
            lastActive: null,
            joinedDate: '2025-04-18T16:45:00',
            status: 'Pending Invitation',
            invitedBy: 'John Doe'
        },
        {
            id: 5,
            name: 'Michael Brown',
            username: 'michaelb',
            email: 'michael.b@example.com',
            role: 'Viewer',
            lastActive: '2025-04-21T08:30:00',
            joinedDate: '2024-01-30T10:15:00',
            status: 'Active',
            invitedBy: 'Sarah Williams'
        }
    ]);

    // State for search and sorting
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({
        key: 'joinedDate',
        direction: 'desc'
    });

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
                return 'bg-green-100 text-green-800';
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

        try {
            // Get headers from the first object in the array
            const headers = Object.keys(jsonData[0]);

            // Create CSV rows from the JSON data
            let csvRows = [];

            // Add headers row if requested
            if (includeHeaders) {
                csvRows.push(headers.join(','));
            }

            // Add data rows
            jsonData.forEach(item => {
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
        downloadJsonAsCsv([{ name: "TreeMapperTest" }], 'userList')

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
        <div className="p-6 bg-white">
            <InviteUserModal />
            <div className="flex flex-col mb-6 sm:flex-row sm:justify-between sm:items-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">Team Members</h1>

                <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                    <button
                        onClick={handleInviteUser}
                        className="flex items-center justify-center px-4 py-2 text-white rounded-md bg-[#007A49] hover:bg-green-800 transition-colors"
                    >
                        <UserPlus size={18} className="mr-2" />
                        Invite User
                    </button>
                </div>
            </div>

            {/* Controls section */}
            <div className="flex flex-col mb-6 space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
                <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-500">Total Users: {users.length}</span>
                    <button
                        onClick={handleExportUsers}
                        className="ml-4 flex items-center text-sm text-gray-600 hover:text-indigo-600"
                    >
                        <Download size={16} className="mr-1" />
                        Export All
                    </button>
                </div>

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
            </div>

            {/* Table section */}
            <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
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
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Invited By
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sortedUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10">
                                            <img
                                                className="h-10 w-10 rounded-full"
                                                src={`https://avatar.iran.liara.run/public/${user.id}`}
                                                alt={user.name}
                                            />
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                            <div className="text-sm text-gray-500">
                                                {user.email}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                @{user.username}
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
                                    <span className="text-sm text-gray-500">{formatDate(user.joinedDate)}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(user.status)}`}>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {user.invitedBy}
                                </td>
                                <td className="whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-center">
                                        <button
                                            onClick={() => handleViewUser(user)}
                                            className="text-indigo-600 hover:text-indigo-900 ml-5"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Empty state */}
                {sortedUsers.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No users found matching your search criteria.</p>
                    </div>
                )}
            </div>
            <AnimatePresence>
                <InviteUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            </AnimatePresence>
            <AnimatePresence>
                <UserDetailsModal
                    isOpen={isModalUserOpen}
                    onClose={() => setIsModalUserOpen(false)}
                    user={selectedUser}
                />
            </AnimatePresence>
        </div>
    );
};

export default TeamsDashboard;