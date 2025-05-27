import React from 'react';
import { X, CheckCircle, XCircle, Users, Info, User, Clock, AlertTriangle, Loader } from 'lucide-react';
import Spinner from './Spinner';

export default function ProjectInviteModal({ invitation, onAccept, onDecline, onClose, loading }) {
  const { project, invitedBy, status, expiresAt, isExpired, message } = invitation;

  // Format expiry date
  const formatExpiryDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status color and icon
  const getStatusDisplay = () => {
    switch (status) {
      case 'accepted':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: <CheckCircle size={18} className="text-green-500" />,
          text: 'Accepted'
        };
      case 'expired':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: <AlertTriangle size={18} className="text-red-500" />,
          text: 'Expired'
        };
      default: // pending
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          icon: <Clock size={18} className="text-yellow-500" />,
          text: 'Pending'
        };
    }
  };

  const statusDisplay = getStatusDisplay();
  const canInteract = status === 'pending' && !isExpired;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      {
        loading ?
          <div className="flex items-center justify-center h-full">
            <Spinner />
          </div>
          : <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fadeIn">

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Project Invitation</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 transition-colors"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Status Banner */}
            <div className={`px-6 py-3 ${statusDisplay.bgColor} border-b ${statusDisplay.borderColor}`}>
              <div className="flex items-center">
                {statusDisplay.icon}
                <span className={`ml-2 text-sm font-medium ${statusDisplay.color}`}>
                  Status: {statusDisplay.text}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-5">
              <div className="mb-5">
                <p className="text-gray-600 mb-2">
                  {status === 'accepted' ? "You've joined:" :
                    status === 'expired' ? "Invitation expired for:" :
                      "You've been invited to join:"}
                </p>
                <h2 className="text-xl font-bold text-gray-900">{project.name}</h2>
                {project.country && (
                  <p className="text-sm text-gray-500 mt-1">{project.country}</p>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-6">
                {project.description && (
                  <div className="flex items-start">
                    <Info size={18} className="text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                    <p className="text-gray-700">{project.description}</p>
                  </div>
                )}

                <div className="flex items-center">
                  <User size={18} className="text-blue-500 mr-3 flex-shrink-0" />
                  <p className="text-gray-700">
                    Invited by <span className="font-medium">{invitedBy.name}</span>
                    {invitedBy.email && (
                      <span className="text-sm text-gray-500 block">{invitedBy.email}</span>
                    )}
                  </p>
                </div>

                <div className="flex items-center">
                  <Clock size={18} className="text-blue-500 mr-3 flex-shrink-0" />
                  <p className="text-gray-700">
                    {isExpired ? 'Expired on' : 'Expires on'}: <span className="font-medium">{formatExpiryDate(expiresAt)}</span>
                  </p>
                </div>
              </div>

              {message && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Message:</span> {message}
                  </p>
                </div>
              )}

              {canInteract && (
                <p className="text-gray-700 font-medium mb-2">Would you like to join this project?</p>
              )}

              {(status === 'accepted') && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    You have successfully joined this project!
                  </p>
                </div>
              )}

              {(status === 'expired' || isExpired) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">
                    This invitation has expired and can no longer be accepted.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
              {canInteract ? (
                <>
                  <button
                    onClick={onDecline}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                  >
                    <XCircle size={18} className="mr-2 text-red-500" />
                    Decline
                  </button>
                  <button
                    onClick={onAccept}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                  >
                    <CheckCircle size={18} className="mr-2" />
                    Accept Invitation
                  </button>
                </>
              ) : (
                <button
                  onClick={onClose}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>
      }
    </div >
  );
}