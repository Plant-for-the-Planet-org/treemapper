// components/ProjectInviteModal.js
import React from 'react';
import { X, CheckCircle, XCircle, Users, Info, User } from 'lucide-react';

export default function ProjectInviteModal({ project, onAccept, onDecline, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fadeIn">
        {/* Header */}
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
        
        {/* Content */}
        <div className="px-6 py-5">
          <div className="mb-5">
            <p className="text-gray-600 mb-2">You've been invited to join:</p>
            <h2 className="text-xl font-bold text-gray-900">{project.name}</h2>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-6">
            <div className="flex items-start">
              <Info size={18} className="text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-gray-700">{project.description}</p>
            </div>
            
            <div className="flex items-center">
              <Users size={18} className="text-blue-500 mr-3 flex-shrink-0" />
              <p className="text-gray-700">
                <span className="font-medium">{project.team?.length || 0}</span> team members
              </p>
            </div>
            
            {project.owner && (
              <div className="flex items-center">
                <User size={18} className="text-blue-500 mr-3 flex-shrink-0" />
                <p className="text-gray-700">
                  Invited by <span className="font-medium">{project.owner.name}</span>
                </p>
              </div>
            )}
          </div>
          
          <p className="text-gray-700 font-medium mb-2">Would you like to join this project?</p>
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
          <button 
            onClick={onDecline}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            <XCircle size={18} className="mr-2 text-red-500" />
            Decline
          </button>
          <button 
            onClick={onAccept}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <CheckCircle size={18} className="mr-2" />
            Accept Invitation
          </button>
        </div>
      </div>
    </div>
  );
}