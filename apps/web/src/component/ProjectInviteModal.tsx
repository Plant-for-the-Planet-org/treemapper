import React from 'react';
import { X, CheckCircle, XCircle, Users, Info, User, Clock, AlertTriangle, Loader } from 'lucide-react';
import Spinner from './Spinner';
import { acceptLinkProjectInvite, acceptProjectInvite, declineProjectInvite, getInviteStatus, getLinkInviteStatus } from '@shared-core/fetchApi/api.fetch';
import { toast } from 'react-toastify';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useToken } from '@/context/useTokenContext';

export default function ProjectInviteModal() {
  const searchParams = useSearchParams();
  const [inviteData, setInviteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { accessToken } = useToken()
  console.log('Project Invite ID:', "I am mounted");
  useEffect(() => {
    checkInviteStatus()
  }, [searchParams]);

  const checkInviteStatus = async () => {
    try {
      const projectInviteId = searchParams.get('project-invite');
      const projectLinkInviteId = searchParams.get('project-link');
      if (projectInviteId) {
        setLoading(true);
        const response = await getInviteStatus(accessToken || '', projectInviteId || '')
        if (response.statusCode === 200) {
          setInviteData(response.data);
          setLoading(false);
          return
        }
        toast.error('Failed to fetch invite status. Please try again later.');
      }

      if (projectLinkInviteId) {
        setLoading(true);
        const response = await getLinkInviteStatus(accessToken || '', projectLinkInviteId || '')
        if (response.statusCode === 200) {
          setInviteData(response.data);
          setLoading(false);
          return
        }
        toast.error('Failed to fetch invite status. Please try again later.');
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);

    }
  }

  const handleAccept = async () => {
    const isLink = searchParams.get('project-link');
    if (isLink) {
      handleLinkAccept()
      return
    }
    try {
      setLoading(true);
      const projectInviteId = searchParams.get('project-invite');
      const response = await acceptProjectInvite(accessToken || '', {
        token: projectInviteId
      });
      if (response && response.statusCode === 200) {
        toast.success('Project invite accepted successfully. Redirecting to project dashboard...');
        setTimeout(() => {
          setLoading(false);
          const url = new URL(window.location.href);
          url.searchParams.delete('project-invite');
          window.location.href = url.toString();
          setInviteData(null);
        }, 2000);
        return
      }
      setLoading(false);
      if (response && response.message) {
        toast.error(String(response.message));
        return
      }

    } catch (error) {
      setLoading(false);
      console.error('Error accepting invitation:', error);
      toast.error('Error accepting invitation:');
    }
  };

  const handleLinkAccept = async () => {
    try {
      setLoading(true);
      const projectInviteId = searchParams.get('project-link');
      const response = await acceptLinkProjectInvite(accessToken || '', {
        token: projectInviteId
      });
      if (response && response.statusCode === 200) {
        toast.success('Project invite accepted successfully. Redirecting to project dashboard...');
        setTimeout(() => {
          setLoading(false);
          const url = new URL(window.location.href);
          url.searchParams.delete('project-link');
          window.location.href = url.toString();
          setInviteData(null);
        }, 2000);
        return
      }
      setLoading(false);
      if (response && response.message) {
        toast.error(String(response.message));
        return
      }

    } catch (error) {
      setLoading(false);
      console.error('Error accepting invitation:', error);
      toast.error('Error accepting invitation:');
    }
  };


  const handleDecline = async () => {
    const isLink = searchParams.get('project-link');
    if (isLink) {
      const url = new URL(window.location.href);
      url.searchParams.delete('project-link');
      window.location.href = url.toString();
      setInviteData(null);
      return
    }
    try {
      setLoading(true);
      const projectInviteId = searchParams.get('project-invite');
      const response = await declineProjectInvite(accessToken || '', {
        token: projectInviteId
      });
      if (response && response.statusCode === 200) {
        toast.warning('Project invite declined successfully');
        setTimeout(() => {
          setLoading(false);
          const url = new URL(window.location.href);
          url.searchParams.delete('project-invite');
          window.location.href = url.toString();
          setInviteData(null);
        }, 2000);
        return
      }
      if (response && response.message) {
        toast.error(String(response.message));
        return
      }
    } catch (error) {
      setLoading(false);
      console.error('Error declining invitation:', error);
      toast.error('Error declining invitation:');
    }
  };

  const handleClose = async () => {
    const isLink = searchParams.get('project-link');
    if (isLink) {
      const url = new URL(window.location.href);
      url.searchParams.delete('project-link');
      window.location.href = url.toString();
      setInviteData(null);
      return
    }
    const url = new URL(window.location.href);
    url.searchParams.delete('project-invite');
    toast.warning('Project invite declined successfully');
    window.location.href = url.toString();
    setInviteData(null)
  };

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
      case 'declined':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: <AlertTriangle size={18} className="text-red-500" />,
          text: 'Declined'
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
  if (!inviteData) {
    return null;
  }
  const { project, invitedBy, status, expiresAt, isExpired, message } = inviteData;
  const statusDisplay = getStatusDisplay();
  const canInteract = status === 'pending' && !isExpired;
  return (
    <div className="fixed inset-0 bg-black/20 bg-opacity-40  backdrop-blur-sm flex justify-center items-center z-50 p-4" style={{ zIndex: 1000 }}>
      {
        loading ?
          <div className="flex items-center justify-center h-full">
            <Spinner />
          </div>
          : <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fadeIn">

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Project Invitation</h3>
              <button
                onClick={handleClose}
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
                {/* {project.description && (
                  <div className="flex items-start">
                    <Info size={18} className="text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                    <p className="text-gray-700">{project.description}</p>
                  </div>
                )} */}

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
                    onClick={handleDecline}
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                  >
                    <XCircle size={18} className="mr-2 text-red-500" />
                    Decline
                  </button>
                  <button
                    onClick={handleAccept}
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-800 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                  >
                    <CheckCircle size={18} className="mr-2" />
                    Accept Invitation
                  </button>
                </>
              ) : (
                <button
                  onClick={handleClose}
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