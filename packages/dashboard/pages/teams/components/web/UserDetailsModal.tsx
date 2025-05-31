import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Shield, User, Mail, AlertCircle, Trash2, Save, CheckCircle } from 'lucide-react';
import { expireInvite, removeProjectMember } from '../../../../api/api.fetch';
import { useToken } from '../../../../context/TokenContext';
import useProjectStore from '../../../../store/useProjectStore';
import { toast } from 'react-toastify';

const UserDetailsModal = ({ isOpen, onClose, user, handleRefresh }) => {
  const [currentRole, setCurrentRole] = useState(user?.role || '');
  const [isEdited, setIsEdited] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { accessToken } = useToken()
  const selectedProject = useProjectStore((state) => state.selectedProject);

  // Reset state when user changes or modal opens
  useEffect(() => {
    if (user && isOpen) {
      setCurrentRole(user.role || '');
      setIsEdited(false);
      setSaveSuccess(false);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setCurrentRole(newRole);
    setIsEdited(newRole !== user.role);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Call the parent function to handle the API call
      // await onUpdateUser(user.id, { role: currentRole });
      setSaveSuccess(true);
      setIsEdited(false);

      // Hide success message after 2 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to update user:', error);
      // You can add error handling here
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveUser = async () => {
    setIsRemoving(true);
    if (user.type === 'invitation') {
      handleRemoveInvitation()
      return
    }
    try {
      const response = await removeProjectMember(accessToken || '', selectedProject?.uid || '', user.id)
      if (response && response.statusCode == 200) {
        setShowConfirmModal(false);
        onClose();
        toast.success("User removed successfully")
        handleRefresh()
        return
      }
      toast.error(String(response.message))

    } catch (error) {
      console.error('Failed to remove user:', error);
      // You can add error handling here
      toast.error(String('Failed to remove user:'))

    } finally {
      setIsRemoving(false);
    }
  };

  const handleRemoveInvitation = async () => {
    setIsRemoving(true);
    try {
      const response = await expireInvite(accessToken || '', {
        token: user.token
      }, selectedProject?.uid || '')
      setShowConfirmModal(false);
      onClose();
      if (response && response.statusCode == 200) {
        setShowConfirmModal(false);
        onClose();
        toast.success("Invitation removed successfully")
        handleRefresh()
        return
      }
    } catch (error) {
      console.error('Failed to remove user:', error);
      // You can add error handling here
    } finally {
      setIsRemoving(false);
    }
  };

  const confirmRemove = () => {
    setShowConfirmModal(true);
  };

  const getRoleColor = (role) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'text-purple-700 bg-purple-100';
      case 'contributor':
        return 'text-blue-700 bg-blue-100';
      case 'reviewer':
        return 'text-green-700 bg-green-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
        {showConfirmModal && (
          <div className="fixed inset-0 z-60 bg-black bg-opacity-60 flex items-center justify-center p-4" style={{ zIndex: 20 }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Remove User
              </h3>

              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to remove <strong>{user.name}</strong> from this project?
                This action cannot be undone and they will lose access immediately.
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isRemoving}
                  className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveUser}
                  disabled={isRemoving}
                  className={`flex-1 px-4 py-3 text-sm font-medium text-white rounded-lg transition-colors ${isRemoving
                    ? 'bg-red-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                    }`}
                >
                  {isRemoving ? 'Removing...' : 'Yes, Remove'}
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                {user.role}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-8 overflow-y-auto flex-1">
            {/* Top section: Avatar + Name */}
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center overflow-hidden shadow-lg">
                  {user.id ? (
                    <img
                      src={`https://avatar.iran.liara.run/public/${user.id}`}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-white">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  )}
                </div>
                <span
                  className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white shadow-lg flex items-center justify-center ${user.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                >
                  <div className="w-2 h-2 rounded-full bg-white opacity-90"></div>
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{user.name}</h3>
                <p className="text-lg text-gray-500 mb-2">@{user.username}</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${user.status === 'Active'
                  ? 'text-green-800 bg-green-100'
                  : 'text-gray-800 bg-gray-100'
                  }`}>
                  {user.status}
                </span>
              </div>
            </div>

            {/* Info Grid */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoItem icon={Mail} label="Email Address" value={user.email} />
                <InfoItem icon={Calendar} label="Member Since" value={formatDate(user.joinedDate)} />
                {user.invitedBy && <InfoItem icon={User} label="Invited By" value={user.invitedBy} />}
                {user.lastActive && <InfoItem icon={Clock} label="Last Activity" value={formatDate(user.lastActive)} />}
              </div>
            </div>

            {/* Role Management Section */}
            {user.role !== 'Owner' && user.type !== 'invitation' ? (<div className="bg-blue-50 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Role Management</h4>
              <div className="flex items-start gap-4">
                <Shield className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Role
                  </label>
                  <select
                    value={currentRole}
                    onChange={handleRoleChange}
                    className="block w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                  >
                    <option value="admin">Admin - Full access and management</option>
                    <option value="manger">Manager - Can manage project and members</option>
                    <option value="contributor">Contributor - Can edit and create</option>
                    <option value="observer">Observre - Can review the project</option>
                    <option value="researcher">Researcher - Has access to reports</option>
                  </select>

                  {isEdited && !saveSuccess && (
                    <p className="mt-2 text-sm text-amber-600 font-medium">
                      Role will be changed from {user.role} to {currentRole}
                    </p>
                  )}

                  {saveSuccess && (
                    <div className="mt-2 flex items-center text-sm text-green-600 font-medium">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Role updated successfully!
                    </div>
                  )}
                </div>
              </div>
            </div>) : null}

            {user.role !== 'Owner' && user.type === 'invitation' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Pending Invitation</h4>
                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="mb-4">
                      <p className="text-sm text-gray-700 mb-2">
                        <span className="font-medium">{user.name || user.email}</span> has not yet accepted the project invitation.
                      </p>
                      <p className="text-xs text-gray-500">
                        Invited {user.invitedAt ? new Date(user.invitedAt).toLocaleDateString() : 'recently'} • Role: {user.role}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        disabled={isRemoving}
                        onClick={handleRemoveInvitation}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Discard Invitation
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}


          </div>

          {/* Footer */}
          {user.role !== 'Owner' && user.type !== 'invitation' && <div className="flex justify-between items-center p-6 border-t border-gray-100 bg-gray-50">
            <button
              onClick={confirmRemove}
              disabled={isRemoving}
              className={`flex items-center px-6 py-3 rounded-lg text-sm font-medium transition-all ${isRemoving
                ? 'bg-red-300 text-red-700 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                }`}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isRemoving ? 'Removing...' : 'Remove User'}
            </button>

            {isEdited && !saveSuccess && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`flex items-center px-6 py-3 rounded-lg text-sm font-medium transition-all ${isSaving
                  ? 'bg-blue-300 text-blue-700 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  }`}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>}
        </div>
      </div>

      {/* Confirmation Modal */}

    </>
  );
};

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="p-2 bg-white rounded-lg shadow-sm">
      <Icon className="w-5 h-5 text-gray-600" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-base text-gray-900 font-medium break-words">{value}</p>
    </div>
  </div>
);

export default UserDetailsModal;