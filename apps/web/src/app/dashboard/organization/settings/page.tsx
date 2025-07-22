'use client'

import React, { useEffect, useState } from 'react';
import {
  Settings, Users, BarChart3, Shield, Trash2, Save,
  Building2, Globe, Mail, Phone, MapPin, Palette,
  Upload, Eye, EyeOff, Plus, Crown, UserCheck,
  UserX, Calendar, Clock, Activity, TrendingUp, TreePine, Target, X, Check, Loader,
  ChevronRight, Menu, AlertTriangle, Lock,
  Edit3, Copy, ExternalLink, Filter, Search,
  ArrowLeft
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

// Mock API functions - replace with your actual API calls
const useOrganization = () => ({ currentOrg: { uid: 'mock-org' } });
const getOrganizationDetails = async () => ({
  statusCode: 200,
  data: {
    name: 'EcoRestore Initiative',
    slug: 'eco-restore',
    description: 'Leading environmental restoration organization',
    logo: '',
    email: 'contact@ecorestore.org',
    phone: '+1-555-0123',
    website: 'https://ecorestore.org',
    address: '123 Green Street, Eco City, EC 12345',
    country: 'US',
    timezone: 'America/New_York',
    primaryColor: '#007A49',
    secondaryColor: '#34D399',
    domainRestriction: 'ecorestore.org',
    isActive: true
  }
});

const getOrganizationMembers = async () => ({
  statusCode: 200,
  data: [
    {
      uid: 'user-1',
      user: {
        uid: 'user-1',
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@ecorestore.org',
        image: '',
        lastLoginAt: '2024-01-15T10:30:00Z'
      },
      role: 'owner',
      status: 'active',
      joinedAt: '2023-01-01T00:00:00Z',
      projects: ['Forest Recovery Project', 'Urban Green Initiative']
    },
    {
      uid: 'user-2',
      user: {
        uid: 'user-2',
        firstname: 'Sarah',
        lastname: 'Green',
        email: 'sarah@ecorestore.org',
        image: '',
        lastLoginAt: '2024-01-14T15:45:00Z'
      },
      role: 'admin',
      status: 'active',
      joinedAt: '2023-03-15T00:00:00Z',
      projects: ['Coastal Restoration', 'Wildlife Habitat']
    }
  ]
});

const getOrganizationStats = async () => ({
  statusCode: 200,
  data: {
    totalMembers: 12,
    totalProjects: 8,
    activeProjects: 6,
    totalTrees: 15420,
    totalInterventions: 234,
    monthlyGrowth: 15,
    recentActivity: [
      { type: 'project_created', title: 'New Wetland Restoration Project', time: '2 hours ago' },
      { type: 'member_joined', title: 'Alex Johnson joined the organization', time: '1 day ago' },
      { type: 'trees_planted', title: '150 trees planted in Forest Recovery Project', time: '3 days ago' }
    ]
  }
});

const updateOrganizationSettings = async () => ({ statusCode: 200 });

// Generate animal avatar using the pattern you provided
const generateAnimalAvatar = (uid) => {
  const hash = uid ? uid.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0) & 0xffffffff, 0) : Math.random();
  const index = Math.abs(hash) % 50 + 1;
  return `https://avatar.iran.liara.run/public/${index}`;
};

// Enhanced Input Field Component
const InputField = ({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  icon: Icon,
  validation,
  required = false,
  disabled = false,
  ...props
}) => {
  const hasError = validation?.error;
  const hasSuccess = validation?.success;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-stone-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-stone-400" />
          </div>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`${Icon ? 'pl-12' : 'pl-4'} w-full px-4 py-3 border rounded-xl transition-all duration-300 ${disabled
            ? 'bg-stone-50 text-stone-500 cursor-not-allowed border-stone-200'
            : hasError
              ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
              : hasSuccess
                ? 'border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200'
                : 'border-stone-300 focus:border-[#007A49] focus:ring-2 focus:ring-[#007A49]/20'
            } focus:outline-none bg-white`}
          {...props}
        />
        {hasError && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <X size={16} className="text-red-500" />
          </div>
        )}
        {hasSuccess && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <Check size={16} className="text-green-500" />
          </div>
        )}
      </div>
      {hasError && (
        <p className="text-xs text-red-600 animate-in slide-in-from-top-1 duration-200">
          {validation.error}
        </p>
      )}
      {validation?.hint && !hasError && (
        <p className="text-xs text-stone-500">{validation.hint}</p>
      )}
    </div>
  );
};

// Enhanced Select Field Component
const SelectField = ({
  label,
  name,
  value,
  onChange,
  options,
  icon: Icon,
  validation,
  required = false,
  disabled = false,
  ...props
}) => {
  const hasError = validation?.error;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-stone-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-stone-400" />
          </div>
        )}
        <select
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`${Icon ? 'pl-12' : 'pl-4'} w-full px-4 py-3 border rounded-xl transition-all duration-300 ${disabled
            ? 'bg-stone-50 text-stone-500 cursor-not-allowed border-stone-200'
            : hasError
              ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
              : 'border-stone-300 focus:border-[#007A49] focus:ring-2 focus:ring-[#007A49]/20'
            } focus:outline-none bg-white appearance-none`}
          {...props}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
          <ChevronRight className="h-4 w-4 text-stone-500 rotate-90" />
        </div>
      </div>
      {hasError && (
        <p className="text-xs text-red-600 animate-in slide-in-from-top-1 duration-200">
          {validation.error}
        </p>
      )}
    </div>
  );
};

// Enhanced Textarea Component
const TextareaField = ({
  label,
  name,
  value,
  onChange,
  rows = 4,
  placeholder,
  icon: Icon,
  validation,
  required = false
}) => {
  const hasError = validation?.error;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-stone-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute top-4 left-4 flex items-start pointer-events-none">
            <Icon className="h-5 w-5 text-stone-400" />
          </div>
        )}
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          rows={rows}
          placeholder={placeholder}
          className={`${Icon ? 'pl-12' : 'pl-4'} w-full px-4 py-3 border rounded-xl resize-none transition-all duration-300 ${hasError
            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
            : 'border-stone-300 focus:border-[#007A49] focus:ring-2 focus:ring-[#007A49]/20'
            } focus:outline-none bg-white`}
        />
      </div>
      {hasError && (
        <p className="text-xs text-red-600 animate-in slide-in-from-top-1 duration-200">
          {validation.error}
        </p>
      )}
    </div>
  );
};

// Collapsible Section Component
const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-stone-200/50 shadow-sm transition-all duration-300 hover:shadow-md">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center justify-between text-left hover:bg-stone-50/50 transition-colors duration-200 rounded-t-2xl"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#007A49]/10 rounded-xl flex items-center justify-center">
            <Icon className="h-5 w-5 text-[#007A49]" />
          </div>
          <h3 className="text-lg font-semibold text-stone-800">{title}</h3>
        </div>
        <ChevronRight
          className={`h-5 w-5 text-stone-500 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
          {children}
        </div>
      )}
    </div>
  );
};

// Logo Upload Component
const LogoUpload = ({ orgData, onLogoChange, isUploading }) => {
  const logoSrc = orgData.logo || generateAnimalAvatar(orgData.name || 'default');

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative group">
        <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-stone-100 shadow-lg bg-stone-50">
          <img
            src={logoSrc}
            alt="Organization Logo"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            onError={(e) => {
              e.target.src = generateAnimalAvatar(orgData.name || 'fallback');
            }}
          />
        </div>
        <label
          className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer backdrop-blur-sm"
        >
          {isUploading ? (
            <Loader size={24} className="text-white animate-spin" />
          ) : (
            <Upload size={24} className="text-white" />
          )}
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={onLogoChange}
            disabled={isUploading}
          />
        </label>
      </div>
      <p className="text-sm text-stone-500 text-center max-w-[180px]">
        {isUploading ? 'Uploading...' : 'Click to upload organization logo'}
      </p>
    </div>
  );
};

// Color Picker Component
const ColorPicker = ({ label, name, value, onChange }) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-stone-700">{label}</label>
      <div className="flex items-center space-x-3">
        <div className="relative">
          <input
            type="color"
            name={name}
            value={value}
            onChange={onChange}
            className="w-12 h-12 rounded-lg border-2 border-stone-300 cursor-pointer"
          />
        </div>
        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          className="flex-1 px-4 py-3 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007A49]/20 focus:border-[#007A49] transition-all duration-300"
          placeholder="#007A49"
        />
      </div>
    </div>
  );
};

// Navigation Item Component
const NavItem = ({ item, isActive, onClick }) => (
  <button
    onClick={() => onClick(item.id)}
    className={`flex items-center w-full px-4 py-3 rounded-xl text-left transition-all duration-200 ${isActive
      ? item.danger
        ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm'
        : 'bg-[#007A49]/10 text-[#007A49] border border-[#007A49]/20 shadow-sm'
      : item.danger
        ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
        : 'text-stone-700 hover:bg-stone-50 hover:text-stone-900'
      }`}
  >
    <item.icon size={20} className="mr-3 flex-shrink-0" />
    <span className="font-medium">{item.label}</span>
  </button>
);

// Member Details Modal
const MemberDetailsModal = ({ member, isOpen, onClose }) => {
  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-stone-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-stone-900">Member Details</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Member Info */}
          <div className="flex items-center space-x-4">
            <img
              src={member.user.image || generateAnimalAvatar(member.user.uid)}
              alt={`${member.user.firstname} ${member.user.lastname}`}
              className="w-16 h-16 rounded-xl object-cover"
            />
            <div>
              <h3 className="text-lg font-semibold text-stone-900">
                {member.user.firstname} {member.user.lastname}
              </h3>
              <p className="text-stone-600">{member.user.email}</p>
              <div className="flex items-center space-x-4 mt-2">
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${member.role === 'owner' ? 'bg-purple-100 text-purple-700' :
                  member.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                  {member.role}
                </span>
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${member.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                  {member.status}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-stone-50 rounded-xl">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar size={16} className="text-stone-500" />
                <span className="text-sm font-medium text-stone-600">Joined</span>
              </div>
              <p className="text-stone-900 font-medium">
                {new Date(member.joinedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="p-4 bg-stone-50 rounded-xl">
              <div className="flex items-center space-x-2 mb-2">
                <Clock size={16} className="text-stone-500" />
                <span className="text-sm font-medium text-stone-600">Last Active</span>
              </div>
              <p className="text-stone-900 font-medium">
                {new Date(member.user.lastLoginAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Projects */}
          <div>
            <h4 className="text-sm font-semibold text-stone-700 mb-3">Projects Involved</h4>
            <div className="space-y-2">
              {member.projects?.map((project, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                  <span className="text-stone-900 font-medium">{project}</span>
                  <ExternalLink size={16} className="text-stone-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Stats Card Component
const StatsCard = ({ icon: Icon, title, value, change, color = '[#007A49]' }) => (
  <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-stone-200/50 p-6 shadow-sm hover:shadow-md transition-all duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-stone-600">{title}</p>
        <p className="text-2xl font-bold text-stone-900 mt-2">{value}</p>
        {change && (
          <p className={`text-sm font-medium mt-1 ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change > 0 ? '+' : ''}{change}% from last month
          </p>
        )}
      </div>
      <div className={`w-12 h-12 bg-${color}/10 rounded-xl flex items-center justify-center`}>
        <Icon className={`h-6 w-6 text-${color}`} />
      </div>
    </div>
  </div>
);

// Recent Activity Component
const RecentActivity = ({ activities }) => (
  <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-stone-200/50 p-6 shadow-sm">
    <h3 className="text-lg font-semibold text-stone-800 mb-4">Recent Activity</h3>
    <div className="space-y-4">
      {activities && activities.map((activity, index) => (
        <div key={index} className="flex items-center space-x-3 p-3 bg-stone-50/50 rounded-lg">
          <div className="w-2 h-2 bg-[#007A49] rounded-full"></div>
          <div className="flex-1">
            <p className="text-sm font-medium text-stone-900">{activity.title}</p>
            <p className="text-xs text-stone-500">{activity.time}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Overview Component
const OverviewSettings = ({ stats }) => (
  <div className="space-y-8">
    <div>
      <h2 className="text-3xl font-bold text-stone-900 mb-2">Organization Overview</h2>
      <p className="text-stone-600">Key metrics and recent activity for your organization.</p>
    </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        icon={Users}
        title="Total Members"
        value={stats.totalMembers}
        change={stats.monthlyGrowth}
      />
      <StatsCard
        icon={Building2}
        title="Total Projects"
        value={stats.totalProjects}
      />
      <StatsCard
        icon={TreePine}
        title="Trees Planted"
        value={stats.totalTrees?.toLocaleString()}
      />
      <StatsCard
        icon={Target}
        title="Interventions"
        value={stats.totalInterventions}
      />
    </div>

    {/* Activity */}
    <RecentActivity activities={stats.recentActivity} />
  </div>
);

// General Settings Component
const GeneralSettings = ({ orgData, handleInputChange, handleSubmit, logoFileName, loading, validationErrors }) => (
  <div className="space-y-8">
    <div>
      <h2 className="text-3xl font-bold text-stone-900 mb-2">General Settings</h2>
      <p className="text-stone-600">Manage your organization's basic information and branding.</p>
    </div>

    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <CollapsibleSection title="Basic Information" icon={Building2}>
        <div className="flex flex-col lg:flex-row gap-8">
          <LogoUpload
            orgData={orgData}
            onLogoChange={() => { }}
            isUploading={false}
          />

          <div className="flex-1 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="Organization Name"
                name="name"
                value={orgData.name}
                onChange={handleInputChange}
                icon={Building2}
                validation={{ error: validationErrors.name }}
                required
              />

              <InputField
                label="Slug"
                name="slug"
                value={orgData.slug}
                onChange={handleInputChange}
                disabled
                validation={{ hint: "Your unique organization identifier" }}
              />
            </div>

            <TextareaField
              label="Description"
              name="description"
              value={orgData.description}
              onChange={handleInputChange}
              placeholder="Describe your organization's mission and goals..."
              rows={3}
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Contact Information */}
      <CollapsibleSection title="Contact Information" icon={Mail}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            label="Email"
            name="email"
            type="email"
            value={orgData.email}
            onChange={handleInputChange}
            icon={Mail}
            required
          />

          <InputField
            label="Phone"
            name="phone"
            type="tel"
            value={orgData.phone}
            onChange={handleInputChange}
            icon={Phone}
          />

          <div className="md:col-span-2">
            <InputField
              label="Website"
              name="website"
              type="url"
              value={orgData.website}
              onChange={handleInputChange}
              icon={Globe}
              placeholder="https://yourorganization.com"
            />
          </div>

          <div className="md:col-span-2">
            <TextareaField
              label="Address"
              name="address"
              value={orgData.address}
              onChange={handleInputChange}
              icon={MapPin}
              rows={2}
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Regional Settings */}
      <CollapsibleSection title="Regional Settings" icon={Globe}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SelectField
            label="Country"
            name="country"
            value={orgData.country}
            onChange={handleInputChange}
            options={[
              { value: 'US', label: 'United States' },
              { value: 'CA', label: 'Canada' },
              { value: 'UK', label: 'United Kingdom' },
              { value: 'AU', label: 'Australia' }
            ]}
          />

          <SelectField
            label="Timezone"
            name="timezone"
            value={orgData.timezone}
            onChange={handleInputChange}
            options={[
              { value: 'America/New_York', label: 'Eastern Time' },
              { value: 'America/Chicago', label: 'Central Time' },
              { value: 'America/Denver', label: 'Mountain Time' },
              { value: 'America/Los_Angeles', label: 'Pacific Time' },
              { value: 'UTC', label: 'UTC' }
            ]}
          />
        </div>
      </CollapsibleSection>

      {/* Branding */}
      <CollapsibleSection title="Brand Colors" icon={Palette}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ColorPicker
            label="Primary Color"
            name="primaryColor"
            value={orgData.primaryColor}
            onChange={handleInputChange}
          />

          <ColorPicker
            label="Secondary Color"
            name="secondaryColor"
            value={orgData.secondaryColor}
            onChange={handleInputChange}
          />
        </div>
      </CollapsibleSection>

      {/* Security Settings */}
      <CollapsibleSection title="Security Settings" icon={Shield}>
        <div className="space-y-6">
          <InputField
            label="Domain Restriction"
            name="domainRestriction"
            value={orgData.domainRestriction}
            onChange={handleInputChange}
            icon={Shield}
            placeholder="yourcompany.com"
            validation={{ hint: "Only users with email addresses from this domain can join" }}
          />

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800">Domain Restriction</h4>
                <p className="text-sm text-amber-700 mt-1">
                  When enabled, only users with email addresses from the specified domain can join your organization.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Save Button */}
      <div className="flex justify-end pt-6">
        <button
          disabled={loading}
          type="submit"
          className="px-8 py-3 bg-[#007A49] text-white rounded-xl hover:bg-[#006841] disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-semibold shadow-md transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
        >
          {loading ? (
            <>
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  </div>
);

// Members Management Component
const MembersSettings = ({ members }) => {
  const [selectedMember, setSelectedMember] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filteredMembers = members.filter(member => {
    const matchesSearch = `${member.user.firstname} ${member.user.lastname} ${member.user.email}`
      .toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner': return Crown;
      case 'admin': return UserCheck;
      default: return Users;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-700';
      case 'admin': return 'bg-blue-100 text-blue-700';
      default: return 'bg-green-100 text-green-700';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-stone-900 mb-2">Members Management</h2>
        <p className="text-stone-600">Manage organization members, roles, and permissions.</p>
      </div>

      {/* Controls */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-stone-200/50 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007A49]/20 focus:border-[#007A49] transition-all duration-200"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007A49]/20 focus:border-[#007A49] transition-all duration-200"
            >
              <option value="all">All Roles</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
            </select>
          </div>

          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-[#007A49] text-white rounded-lg hover:bg-[#006841] flex items-center font-medium transition-all duration-200 transform hover:scale-105"
          >
            <Plus size={16} className="mr-2" />
            Invite Member
          </button>
        </div>
      </div>

      {/* Members List */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-stone-200/50 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-200">
          <h3 className="text-lg font-semibold text-stone-800">
            Organization Members ({filteredMembers.length})
          </h3>
        </div>

        <div className="divide-y divide-stone-200">
          {filteredMembers.map((member) => {
            const RoleIcon = getRoleIcon(member.role);
            return (
              <div key={member.uid} className="p-6 hover:bg-stone-50/50 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img
                      src={member.user.image || generateAnimalAvatar(member.user.uid)}
                      alt={`${member.user.firstname} ${member.user.lastname}`}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                    <div>
                      <h4 className="font-semibold text-stone-900">
                        {member.user.firstname} {member.user.lastname}
                      </h4>
                      <p className="text-sm text-stone-600">{member.user.email}</p>
                      <div className="flex items-center space-x-3 mt-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${getRoleColor(member.role)}`}>
                          <RoleIcon size={12} className="mr-1" />
                          {member.role}
                        </span>
                        <span className="text-xs text-stone-500">
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedMember(member)}
                      className="px-3 py-2 text-sm font-medium text-[#007A49] hover:bg-[#007A49]/10 rounded-lg transition-colors duration-200"
                    >
                      <Eye size={16} className="mr-1 inline" />
                      View
                    </button>
                    {member.role !== 'owner' && (
                      <button className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200">
                        <UserX size={16} className="mr-1 inline" />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Member Details Modal */}
      <MemberDetailsModal
        member={selectedMember}
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
      />

      {/* Invite Modal Placeholder */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-stone-900">Invite Member</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-stone-600 text-center py-8">
              Member invitation feature will be implemented here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Danger Zone Component
const DangerZone = ({ orgData }) => {
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-red-600 mb-2">Danger Zone</h2>
        <p className="text-stone-600">Critical actions that permanently affect your organization. These actions cannot be undone.</p>
      </div>

      <div className="space-y-6">
        {/* Transfer Ownership */}
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/30 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="relative p-8">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <Crown className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-amber-800 mb-2">Transfer Ownership</h3>
                <p className="text-amber-700 mb-6 leading-relaxed">
                  Transfer ownership of this organization to another admin. You will become an admin member after the transfer is complete.
                </p>

                {!showTransferConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowTransferConfirm(true)}
                    className="px-6 py-3 bg-white border-2 border-amber-500 text-amber-700 rounded-xl hover:bg-amber-50 hover:border-amber-600 flex items-center font-semibold shadow-md transition-all duration-200 transform hover:scale-105"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Transfer Ownership
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border-2 border-amber-300">
                      <p className="text-sm font-semibold text-amber-800 mb-2">
                        Transfer ownership of "{orgData.name}"?
                      </p>
                      <p className="text-xs text-amber-600">
                        Select an admin member to transfer ownership to. This action cannot be undone.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={() => setShowTransferConfirm(false)}
                        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 flex items-center justify-center font-semibold shadow-md transition-all duration-200 transform hover:scale-105"
                      >
                        <Crown className="h-4 w-4 mr-2" />
                        Select New Owner
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowTransferConfirm(false)}
                        className="px-6 py-3 bg-white border border-stone-300 text-stone-700 rounded-xl hover:bg-stone-50 flex items-center justify-center font-medium transition-all duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Delete Organization */}
        <div className="relative overflow-hidden bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 rounded-2xl shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-100/30 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-red-100/20 rounded-full translate-y-12 -translate-x-12"></div>
          <div className="relative p-8">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-red-800 mb-2">Delete Organization</h3>
                <p className="text-red-700 mb-6 leading-relaxed">
                  Permanently delete this organization and all associated data. This includes all projects, members, and historical data. This action cannot be undone.
                </p>

                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-6 py-3 bg-white border-2 border-red-500 text-red-600 rounded-xl hover:bg-red-50 hover:border-red-600 flex items-center font-semibold shadow-md transition-all duration-200 transform hover:scale-105"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Organization
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border-2 border-red-300">
                      <p className="text-sm font-semibold text-red-800 mb-2">
                        Are you absolutely sure you want to delete "{orgData.name}"?
                      </p>
                      <p className="text-xs text-red-600 mb-3">
                        This action cannot be undone and will permanently delete:
                      </p>
                      <ul className="text-xs text-red-600 space-y-1 ml-4">
                        <li>• All organization projects and data</li>
                        <li>• All member accounts and permissions</li>
                        <li>• All trees, sites, and intervention data</li>
                        <li>• Organization branding and settings</li>
                      </ul>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 flex items-center justify-center font-semibold shadow-md transition-all duration-200 transform hover:scale-105"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Yes, Delete Forever
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-6 py-3 bg-white border border-stone-300 text-stone-700 rounded-xl hover:bg-stone-50 flex items-center justify-center font-medium transition-all duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Success/Error Notification Component
const NotificationToast = ({ type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-[#007A49]';
  const IconComponent = type === 'success' ? Check : type === 'error' ? X : Activity;

  return (
    <div className={`fixed top-20 right-4 ${bgColor} text-white px-6 py-4 rounded-xl shadow-lg animate-in slide-in-from-right-full duration-300 z-50 max-w-sm`}>
      <div className="flex items-center space-x-3">
        <IconComponent size={20} />
        <div>
          <p className="font-medium">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-auto hover:bg-white/20 rounded-lg p-1 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

// Main Organization Settings Component
const OrganizationSettings = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const [orgData, setOrgData] = useState({
    name: '',
    slug: '',
    description: '',
    logo: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    country: '',
    timezone: 'UTC',
    primaryColor: '#007A49',
    secondaryColor: '#34D399',
    domainRestriction: '',
    isActive: true
  });

  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState({});

  const { currentOrg } = useOrganization();

  const [activeTab, setActiveTab] = useState('overview');
  const [logoFileName, setLogoFileName] = useState('No file selected');
  const router = useRouter()
  useEffect(() => {
    fetchOrganizationData();
  }, []);

  const fetchOrganizationData = async () => {
    try {
      // Fetch organization details
      const orgResult = await getOrganizationDetails(currentOrg?.uid);
      if (orgResult.statusCode === 200) {
        setOrgData(orgResult.data);
      }

      // Fetch members
      const membersResult = await getOrganizationMembers(currentOrg?.uid);
      if (membersResult.statusCode === 200) {
        setMembers(membersResult.data);
      }

      // Fetch stats
      const statsResult = await getOrganizationStats(currentOrg?.uid);
      if (statsResult.statusCode === 200) {
        setStats(statsResult.data);
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to load organization data' });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!orgData.name.trim()) {
      errors.name = 'Organization name is required';
    }

    if (!orgData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(orgData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (orgData.website && !/^https?:\/\/.+/.test(orgData.website)) {
      errors.website = 'Please enter a valid URL starting with http:// or https://';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setOrgData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setNotification({ type: 'error', message: 'Please fix the validation errors before saving' });
      return;
    }

    setLoading(true);
    try {
      const response = await updateOrganizationSettings(currentOrg?.uid, orgData);
      if (response.statusCode === 200) {
        setNotification({ type: 'success', message: 'Organization settings updated successfully!' });
      } else {
        throw new Error('Failed to save organization settings');
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to save organization settings' });
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'general', label: 'General Settings', icon: Settings },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'danger', label: 'Danger Zone', icon: Trash2, danger: true },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewSettings stats={stats} />;
      case 'general':
        return (
          <GeneralSettings
            orgData={orgData}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            logoFileName={logoFileName}
            loading={loading}
            validationErrors={validationErrors}
          />
        );
      case 'members':
        return <MembersSettings members={members} />;
      case 'danger':
        return <DangerZone orgData={orgData} />;
      default:
        return <OverviewSettings stats={stats} />;
    }
  };

  return (
    <div className="bg-gradient-to-br from-stone-50 to-stone-100 min-h-screen">
      {/* Notification Toast */}
      {notification && (
        <NotificationToast
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-stone-200/50 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.button
              whileHover={{ x: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={router.back}
              className="cursor-pointer flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={18} />
              <span className="text-sm font-medium">Back to home</span>
            </motion.button>
            {/* <h1 className="text-2xl font-bold text-stone-900">Organization Settings</h1> */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors duration-200"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Sidebar Navigation */}
        <div className={`
          ${isMobileMenuOpen ? 'block' : 'hidden lg:block'}
          lg:w-80 bg-white/70 backdrop-blur-sm border-r border-stone-200/50
          fixed lg:sticky top-16 lg:top-16 z-40 w-full lg:w-auto h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)]
          overflow-y-auto lg:overflow-visible
        `}>
          <div className="p-6 space-y-2">

            <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4">
              Organization Management
            </h3>
            {navItems.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                isActive={activeTab === item.id}
                onClick={(id) => {
                  setActiveTab(id);
                  setIsMobileMenuOpen(false);
                }}
              />
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm lg:hidden z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default OrganizationSettings;