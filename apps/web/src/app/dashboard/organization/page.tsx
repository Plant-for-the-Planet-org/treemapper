"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Footer } from './components/Footer';
import { OrganizationGrid } from './components/OrganizationGrid';
import { PageHeader } from './components/PageHeader';
import { useToken } from '@/context/useTokenContext';
import { toast } from 'react-toastify';
import Spinner from '@/component/Spinner';
import { Info, X, Mail, Phone, MapPin } from 'lucide-react';

// Placeholder API calls
const assignToDevOrg = async (accessToken: string) => {
  // TODO: Implement API call to assign user to dev organization
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ statusCode: 200, data: { orgId: 'dev-org-id' } });
    }, 1000);
  });
};

const submitPartnerInquiry = async (accessToken: string, formData: any) => {
  // TODO: Implement API call to submit partner inquiry
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ statusCode: 200, message: 'Inquiry submitted successfully' });
    }, 1000);
  });
};

// Tooltip Component
const Tooltip = ({ children, content }: { children: React.ReactNode; content: string }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative group">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50 max-w-xs w-max">
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          <div className="leading-relaxed whitespace-pre-line">
            {content}
          </div>
        </div>
      )}
    </div>
  );
};


// Partner Modal Component
const PartnerModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { accessToken } = useToken();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await submitPartnerInquiry(accessToken, formData);
      toast.success('Thank you for your interest! We\'ll contact you soon.');
      onClose();
      setFormData({ name: '', email: '', company: '', message: '' });
    } catch (error) {
      toast.error('Failed to submit inquiry. Please try again.');
    }

    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Partner with TreeMapper</h2>
              <p className="text-gray-600">Unlock advanced features and personalized services</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Features Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Partner Benefits</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                <h4 className="font-medium text-green-900 mb-2">Advanced Analytics</h4>
                <p className="text-green-700 text-sm">Access detailed insights and custom reporting tools</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                <h4 className="font-medium text-green-900 mb-2">Priority Support</h4>
                <p className="text-green-700 text-sm">Dedicated support team and faster response times</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                <h4 className="font-medium text-green-900 mb-2">Custom Features</h4>
                <p className="text-green-700 text-sm">Tailored functionality to meet your specific needs</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                <h4 className="font-medium text-green-900 mb-2">API Access</h4>
                <p className="text-green-700 text-sm">Integration capabilities with your existing systems</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007A49] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007A49] focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company/Organization</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007A49] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Tell us about your requirements and how we can help..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007A49] focus:border-transparent resize-none"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-[#007A49] text-white rounded-md hover:bg-[#006141] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Spinner /> : <Mail size={16} />}
                {isSubmitting ? 'Submitting...' : 'Send Inquiry'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Main Component
export default function OrganizationSelector() {
  const router = useRouter();
  const [organizations] = useState([
    // Mock existing organizations - in real app this would come from user's profile
    { id: 1, name: 'Partner Organization', description: 'Access to partner features and tools' },
    { id: 2, name: 'Public Organization', description: 'General access to TreeMapper features' }
  ]);
  const { accessToken } = useToken();
  const [isLoading, setLoading] = useState(false);
  const [isTestingMode, setIsTestingMode] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [showPartnerModal, setShowPartnerModal] = useState(false);

  const handleTestingToggle = useCallback((enabled: boolean) => {
    setIsTestingMode(enabled);
    if (enabled) {
      setSelectedOrgId(null); // Clear any selected organization
    }
  }, []);

  const handleSelectOrganization = useCallback((orgId: number) => {
    setSelectedOrgId(orgId);
    setIsTestingMode(false); // Disable testing mode when org is selected
  }, []);

  const handleContinueToDashboard = useCallback(async () => {
    setLoading(true);

    try {
      if (isTestingMode) {
        // Assign to dev organization
        const response = await assignToDevOrg(accessToken);
        localStorage.setItem('orgId', 'dev');
        localStorage.setItem('isTestingMode', 'true');
      } else if (selectedOrgId) {
        // Use selected organization
        localStorage.setItem('orgId', String(selectedOrgId));
        localStorage.removeItem('isTestingMode');
      }

      router.replace('/dashboard');
    } catch (error) {
      toast.error('Failed to proceed. Please try again.');
      setLoading(false);
    }
  }, [isTestingMode, selectedOrgId, accessToken, router]);

  const canProceed = isTestingMode || selectedOrgId !== null;

  return (
    <div className="h-full bg-gray-50 flex flex-col w-full">
      {/* Main Content */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">
        <PageHeader
          title="Welcome to TreeMapper"
          description="Choose how you'd like to get started with our platform."
          canProceed={canProceed}
          handleContinueToDashboard={handleContinueToDashboard}
          isLoading={isLoading}
        />

        <div className="max-w-8xl mx-auto space-y-8">
          {/* Testing Mode Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Explore TreeMapper
              </h3>
              <Tooltip content="Enable this to access our development environment for testing features and functionality without affecting real data">
                <Info size={16} className="text-gray-400 hover:text-gray-600" />
              </Tooltip>
            </div>
            <p className="text-gray-600 mb-6">
              Interested in trying TreeMapper’s features without making real changes?
            </p>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">No</span>
              <button
                onClick={() => handleTestingToggle(!isTestingMode)}
                disabled={selectedOrgId !== null}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#007A49] focus:ring-offset-2 ${isTestingMode
                  ? 'bg-[#007A49]'
                  : selectedOrgId !== null
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-gray-200 hover:bg-gray-300'
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isTestingMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
              <span className="text-sm text-gray-700">Yes</span>
            </div>
            {selectedOrgId !== null && (
              <p className="text-sm text-gray-500 mt-2">
                Testing mode is disabled when an organization is selected
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Partner with TreeMapper
              </h3>
              <Tooltip content="Access advanced features, priority support, and custom solutions tailored to your organization's needs">
                <Info size={16} className="text-gray-400 hover:text-gray-600" />
              </Tooltip>
            </div>
            <p className="text-gray-600 mb-6">
              Looking for advanced features and personalized services? Partner with us to unlock the full potential of TreeMapper.
            </p>
            <button
              onClick={() => setShowPartnerModal(true)}
              className="px-6 py-3 bg-[#007A49] text-white rounded-lg hover:bg-[#006141] transition-colors flex items-center gap-2 font-medium"
            >
              <Mail size={16} />
              Learn More & Contact Us
            </button>
          </div>

          {organizations.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Your Organizations
                </h3>
                <Tooltip content="Organizations you're already a member of. Select one to access your existing projects and data">
                  <Info size={16} className="text-gray-400 hover:text-gray-600" />
                </Tooltip>
              </div>
              <p className="text-gray-600 mb-6">
                Select from your existing organizations to continue.
              </p>
              <div className={`grid gap-4 ${isTestingMode ? 'opacity-50 pointer-events-none' : ''}`}>
                {organizations.map((org) => (
                  <div
                    key={org.id}
                    onClick={() => !isTestingMode && handleSelectOrganization(org.id)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedOrgId === org.id
                      ? 'border-[#007A49] bg-green-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      } ${isTestingMode ? 'cursor-not-allowed' : ''}`}
                  >
                    <h4 className="font-medium text-gray-900 mb-1">{org.name}</h4>
                    <p className="text-sm text-gray-600">{org.description}</p>
                  </div>
                ))}
              </div>
              {isTestingMode && (
                <p className="text-sm text-gray-500 mt-2">
                  Organization selection is disabled in testing mode
                </p>
              )}
            </div>
          )}


        </div>
      </main>

      <Footer />

      {/* Partner Modal */}
      <PartnerModal
        isOpen={showPartnerModal}
        onClose={() => setShowPartnerModal(false)}
      />
    </div>
  );
}