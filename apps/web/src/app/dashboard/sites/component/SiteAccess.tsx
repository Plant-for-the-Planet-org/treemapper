import React, { useState, useMemo, useEffect } from 'react';
import { X, Users, Check, UserMinus, UserPlus, ChevronDown, Filter } from 'lucide-react';
import { getallstieMembers, grantSiteAccess, revokeiteAccess } from '@shared-core/fetchApi/api.fetch';
import { useToken } from '@/context/useTokenContext';
import useProjectStore from '@shared-core/store/useProjectStore'

const Modal = ({ isOpen, onClose, children, title, size = 'default' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    default: 'max-w-md',
    large: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/10 bg-opacity-10 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-lg shadow-lg w-full mx-4 ${sizeClasses[size]} overflow-hidden h-[70vh] flex flex-col`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

const LoadingSpinner = ({ size = 'default' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-5 h-5',
  };

  return (
    <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-gray-900`} />
  );
};

const ConfirmationDialog = ({ isOpen, onClose, onConfirm, title, message, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/10 bg-opacity-10 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-lg w-full mx-4 max-w-md">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-6">{message}</p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <LoadingSpinner size="small" />}
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// API service functions
const siteAccessAPI = {
  async getMembers(token, prjId, siteUid) {
    const response = await getallstieMembers(token, prjId, siteUid)
    if (response.statusCode !== 200) {
      throw new Error(response.message || 'Failed to fetch members');
    }
    return response.data.data;
  },

  async grantAccess(siteUid, memberUid, selectedProjectUid, token) {
    const response = await grantSiteAccess(token, selectedProjectUid, siteUid, memberUid)
    if (response.statusCode !== 201 && response.statusCode !== 200) {
      throw new Error(response.message || 'Failed to grant access');
    }
    return response.data;
  },

  async revokeAccess(siteUid, memberUid, selectedProjectUid, token) {
    const response = await revokeiteAccess(token, selectedProjectUid, siteUid, memberUid)
    if (response.statusCode !== 201 && response.statusCode !== 200) {
      throw new Error(response.message || 'Failed to revoke access');
    }
    return response.data;
  },
}

export default function SiteAccessModal({ isOpen, setIsOpen, site, refreshData }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [accessFilter, setAccessFilter] = useState('all'); // 'all', 'has-access', 'no-access'
  const [roleFilters, setRoleFilters] = useState({
    admin: true,
    owner: true,
    contributor: true,
    observer: true,
  });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: '', // 'add-all', 'grant-access', 'revoke-access'
    member: null,
  });

  const { accessToken } = useToken()
  const selectedProject = useProjectStore(state => state.selectedProject)

  // Fetch members when modal opens or site changes
  useEffect(() => {
    if (isOpen && site?.id) {
      fetchMembers();
    }
  }, [isOpen, site?.id]);

  const fetchMembers = async () => {
    if (!site?.id) return;
    setInitialLoading(true);
    setError(null);
    try {
      const membersData = await siteAccessAPI.getMembers(accessToken, selectedProject.uid, site.id);
      setMembers(membersData);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching members:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  // Calculate members with access count
  const membersWithAccess = members.filter(member => member.hasAccess).length;

  // Filter members based on current filters
  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      // Access filter
      if (accessFilter === 'has-access' && !member.hasAccess) return false;
      if (accessFilter === 'no-access' && member.hasAccess) return false;

      // Role filter
      if (!roleFilters[member.role]) return false;

      return true;
    });
  }, [members, accessFilter, roleFilters]);

  const handleGrantAccess = (member) => {
    setConfirmDialog({
      isOpen: true,
      type: 'grant-access',
      member,
    });
  };

  const handleRevokeAccess = (member) => {
    setConfirmDialog({
      isOpen: true,
      type: 'revoke-access',
      member,
    });
  };

  const handleAddAllContributors = () => {
    setConfirmDialog({
      isOpen: true,
      type: 'add-all',
      member: null,
    });
  };

  const handleConfirmAction = async () => {
    setLoading(true);
    setError(null);

    try {
      if (confirmDialog.type === 'grant-access') {
        await siteAccessAPI.grantAccess(site.id, confirmDialog.member.uid, selectedProject.uid, accessToken);
        await refreshData()
        // Update local state
        setMembers(prev => prev.map(member =>
          member.uid === confirmDialog.member.uid
            ? { ...member, hasAccess: true }
            : member
        ));

      } else if (confirmDialog.type === 'revoke-access') {
        await siteAccessAPI.revokeAccess(site.id, confirmDialog.member.uid, selectedProject.uid, accessToken);
        await refreshData()
        // Update local state
        setMembers(prev => prev.map(member =>
          member.uid === confirmDialog.member.uid
            ? { ...member, hasAccess: false }
            : member
        ));

      } else if (confirmDialog.type === 'add-all') {
        // Grant access to all contributors without access
        // const contributorsToAdd = members.filter(m =>
        //   (m.role === 'contributor' || m.role === 'observer') && !m.hasAccess
        // );

        // // Execute all grant operations
        // await Promise.all(
        //   contributorsToAdd.map(member =>
        //     siteAccessAPI.grantAccess(site.uid, member.uid)
        //   )
        // );

        // // Update local state
        // setMembers(prev => prev.map(member =>
        //   (member.role === 'contributor' || member.role === 'observer')
        //     ? { ...member, hasAccess: true }
        //     : member
        // ));
      }
    } catch (err) {
      setError(err.message);
      console.error('Error updating access:', err);
    } finally {
      setLoading(false);
      setConfirmDialog({ isOpen: false, type: '', member: null });
    }
  };

  const toggleRoleFilter = (role) => {
    setRoleFilters(prev => ({
      ...prev,
      [role]: !prev[role],
    }));
  };

  const getConfirmationMessage = () => {
    switch (confirmDialog.type) {
      case 'grant-access':
        return `Grant site access to ${confirmDialog.member?.name}?`;
      case 'revoke-access':
        return `Revoke site access from ${confirmDialog.member?.name}?`;
      case 'add-all':
        const contributorsWithoutAccess = members.filter(m =>
          (m.role === 'contributor' || m.role === 'observer') && !m.hasAccess
        ).length;
        return `Add ${contributorsWithoutAccess} contributor${contributorsWithoutAccess !== 1 ? 's' : ''} to this site?`;
      default:
        return '';
    }
  };

  const formatRoleName = (role) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'owner':
        return 'Owner';
      case 'contributor':
        return 'Contributor';
      case 'observer':
        return 'Observer';
      default:
        return role;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
      case 'owner':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Manage Site Access"
        size="xl"
      >
        {initialLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
            <span className="ml-2 text-gray-600">Loading members...</span>
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
              <button
                onClick={fetchMembers}
                className="mt-2 px-3 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header with member count and add all button */}
            <div className="flex items-center justify-between">
              {/* <button
                onClick={handleAddAllContributors}
                disabled={loading}
                className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <UserPlus size={14} />
                Add All Contributors
              </button> */}
            </div>

            {/* Error display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Filters */}
            <div className="flex items-center gap-4">
              {/* Access Filter Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Access:</span>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setAccessFilter('all')}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${accessFilter === 'all'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setAccessFilter('has-access')}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${accessFilter === 'has-access'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    Has Access
                  </button>
                  <button
                    onClick={() => setAccessFilter('no-access')}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${accessFilter === 'no-access'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    No Access
                  </button>
                </div>
              </div>

              {/* Role Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Filter size={14} />
                  <span>Roles</span>
                  <ChevronDown size={14} className={`transition-transform ${filterDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {filterDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
                    <div className="p-2 space-y-1">
                      {Object.keys(roleFilters).map(role => (
                        <label key={role} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={roleFilters[role]}
                            onChange={() => toggleRoleFilter(role)}
                            className="w-4 h-4 text-gray-900 rounded border-gray-300 focus:ring-gray-900"
                          />
                          <span className="text-sm">{formatRoleName(role)}s</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 mr-2" style={{ flex: 1, justifyContent: 'flex-end' }}>
                <Users size={16} />
                <span>{membersWithAccess} member{membersWithAccess !== 1 ? 's' : ''} have access</span>
              </div>
            </div>

            {/* Members Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Member
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Access
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            {member.avatar ? (
                              <img
                                src={member.avatar}
                                alt={member.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-600">
                                  {member.name?.charAt(0)?.toUpperCase() || '?'}
                                </span>
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">{member.name}</div>
                              <div className="text-sm text-gray-500">{member.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(member.role)}`}>
                            {formatRoleName(member.role)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {member.hasAccess ? (
                            <div className="flex items-center gap-2 text-green-600">
                              <span className="text-sm">Has Access</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">No Access</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          {member.role === 'admin' || member.role === 'owner' ? (
                            <span className="text-xs text-gray-500">Default Access</span>
                          ) : member.hasAccess ? (
                            <button
                              onClick={() => handleRevokeAccess(member)}
                              disabled={loading}
                              className="inline-flex items-center gap-1 px-3 py-1 text-xs text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                              <UserMinus size={12} />
                              Revoke
                            </button>
                          ) : (
                            <button
                              onClick={() => handleGrantAccess(member)}
                              disabled={loading}
                              className="cursor-pointer inline-flex items-center gap-1 px-3 py-1 text-xs text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                              <UserPlus size={12} />
                              Provide Access
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {filteredMembers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No members match the current filters</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, type: '', member: null })}
        onConfirm={handleConfirmAction}
        title="Confirm Action"
        message={getConfirmationMessage()}
        loading={loading}
      />
    </>
  );
}