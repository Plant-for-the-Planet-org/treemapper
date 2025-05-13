import React, { useState } from 'react';
import { X, CheckCircle, Mail, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createProjectInvite } from '../../../../api/api.fetch';
import useProjectStore from '../../../../store/useProjectStore';

const InviteUserModal = ({ isOpen, onClose, token }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [role, setRole] = useState('Contributor');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const selectedProject = useProjectStore((state) => state.selectedProject);

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email address is invalid';
    }

    // Message validation (optional but with character limit)
    if (message && message.length > 300) {
      newErrors.message = 'Message must be 300 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      setIsSubmitting(true);
      const response = await createProjectInvite(token, selectedProject, {
        email,
        message,
        role
      })
      setIsSubmitting(false);
      if (response.statusCode === 200) {
        setIsSuccess(true);
        setTimeout(() => {
          setEmail('');
          setMessage('');
          setRole('Contributor');
          onClose();
        }, 2000);
      }
      console.log("LSD", response)
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden"
      >
        {isSuccess ? (
          <motion.div
            className="p-6 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            </motion.div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Invitation Sent!</h3>
            <p className="text-gray-600 text-center">
              {email} has been invited to join the project as a {role}.
            </p>
          </motion.div>
        ) : (
          <>
            <div className="flex justify-between items-center border-b border-gray-200 p-4">
              <div className="flex items-center">
                <UserPlus className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-800">Invite member to the Project</h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'
                      } rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="colleague@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="admin">Admin</option>
                  <option value="contributor">Contributor</option>
                  <option value="reviewer">Reviewer</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message (optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows="4"
                  className={`block w-full px-3 py-2 border ${errors.message ? 'border-red-500' : 'border-gray-300'
                    } rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Add a personal message..."
                ></textarea>
                <div className="flex justify-between mt-1">
                  {errors.message ? (
                    <p className="text-sm text-red-600">{errors.message}</p>
                  ) : (
                    <p className="text-sm text-gray-500">
                      {message.length}/300 characters
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded-md text-sm font-medium text-white 
                    ${isSubmitting
                      ? 'bg-blue-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    } flex items-center`}
                >
                  {isSubmitting ? 'Sending...' : 'Send invitation'}
                </button>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
};
export default InviteUserModal