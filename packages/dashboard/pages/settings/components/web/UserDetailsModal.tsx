import React, { useState } from 'react';
import { X, Calendar, Clock, Shield, User, Mail, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const UserDetailsModal = ({ isOpen, onClose, user }) => {
  const [currentRole, setCurrentRole] = useState(user?.role || '');
  const [isEdited, setIsEdited] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsEdited(false);
      onClose();
    }, 1000);
  };

  const handleRemoveUser = () => {
    setIsRemoving(true);
    setTimeout(() => {
      setIsRemoving(false);
      onClose();
    }, 1000);
  };

  const confirmRemove = () => {
    if (window.confirm(`Are you sure you want to remove ${user.name} from this project?`)) {
      handleRemoveUser();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b">
          <h2 className="text-xl font-semibold text-gray-800">User Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Top section: Avatar + Name */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                {user.id ? (
                  <img src={`https://avatar.iran.liara.run/public/${user.id}`} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-blue-600">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                )}
              </div>
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                  user.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'
                }`}
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
              <p className="text-sm text-gray-500">@{user.username}</p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InfoItem icon={Mail} label="Email" value={user.email} />
            <InfoItem icon={Calendar} label="Joined" value={formatDate(user.joinedDate)} />
            <InfoItem icon={User} label="Invited by" value={user.invitedBy} />
            <InfoItem icon={Clock} label="Last active" value={formatDate(user.lastActive)} />

            {/* Role dropdown spans full width */}
            <div className="md:col-span-2 flex items-start gap-3">
              <Shield className="w-5 h-5 text-gray-400 mt-1" />
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-500">Role</label>
                <select
                  value={currentRole}
                  onChange={handleRoleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Admin">Admin</option>
                  <option value="Contributor">Contributor</option>
                  <option value="Reviewer">Reviewer</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-4 border-t bg-gray-50">
          <button
            onClick={confirmRemove}
            disabled={isRemoving}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white ${
              isRemoving
                ? 'bg-red-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            {isRemoving ? 'Removing...' : 'Remove from project'}
          </button>

          {isEdited && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${
                isSaving
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSaving ? 'Saving...' : 'Save changes'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <Icon className="w-5 h-5 text-gray-400 mt-1" />
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-base text-gray-900">{value}</p>
    </div>
  </div>
);

export default UserDetailsModal;
