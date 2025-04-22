import React, { useState } from 'react';
import {
  User,
  Bell,
  Lock,
  Shield,
  Trash2,
  LogOut,
  Save,
  Users,
  FileText,
  Settings,
  Globe,
  ChevronRight,
  Upload
} from 'lucide-react';
import BackButton from '../../../components/backButton/BackButton';

const ProfileSettings = () => {
  // State for user profile data
  const [profile, setProfile] = useState({
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    jobTitle: 'Product Manager',
    company: 'Acme Inc.',
    bio: 'Passionate about building great products and leading teams.',
    avatar: 'https://avatar.iran.liara.run/public'
  });

  // State for notification settings
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    marketing: false,
    projectUpdates: true,
    securityAlerts: true
  });

  // State for collaborative projects
  const [collaborativeProjects, setCollaborativeProjects] = useState([
    { id: 1, name: 'Marketing Dashboard', owner: 'Jane Smith', role: 'Editor', active: true },
    { id: 2, name: 'Sales Analytics', owner: 'Robert Johnson', role: 'Viewer', active: true },
    { id: 3, name: 'Product Roadmap', owner: 'Emily Chen', role: 'Contributor', active: false }
  ]);
  
  // State for active tab
  const [activeTab, setActiveTab] = useState('profile');

  // Handle profile form changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  // Handle notification toggle changes
  const handleNotificationChange = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Handle project role changes
  const handleProjectRoleChange = (id, role) => {
    setCollaborativeProjects(prev => 
      prev.map(project => 
        project.id === id ? { ...project, role } : project
      )
    );
  };

  // Handle project active status changes
  const handleProjectActiveChange = (id) => {
    setCollaborativeProjects(prev => 
      prev.map(project => 
        project.id === id ? { ...project, active: !project.active } : project
      )
    );
  };

  // Handle file upload for avatar
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // In a real application, you would upload the file to your server
      // For this example, we'll just use a fake URL
      setProfile(prev => ({ ...prev, avatar: URL.createObjectURL(file) }));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Settings Header */}
      <BackButton label='Profile Setting'/>
      <div className="border-b border-gray-200 p-6">
        <p className="text-sm text-gray-500 mt-1">
          Manage your profile, notification preferences, and account settings
        </p>
      </div>

      {/* Settings Navigation */}
      <div className="grid grid-cols-12 min-h-screen">
        <div className="col-span-3 border-r border-gray-200">
          <nav className="p-4 space-y-1">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex items-center px-4 py-3 w-full rounded-md ${
                activeTab === 'profile' 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <User size={18} className="mr-3" />
              <span>Profile Information</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center px-4 py-3 w-full rounded-md ${
                activeTab === 'notifications' 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Bell size={18} className="mr-3" />
              <span>Notifications</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('projects')}
              className={`flex items-center px-4 py-3 w-full rounded-md ${
                activeTab === 'projects' 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Users size={18} className="mr-3" />
              <span>Collaborative Projects</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('security')}
              className={`flex items-center px-4 py-3 w-full rounded-md ${
                activeTab === 'security' 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Lock size={18} className="mr-3" />
              <span>Security</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('privacy')}
              className={`flex items-center px-4 py-3 w-full rounded-md ${
                activeTab === 'privacy' 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Shield size={18} className="mr-3" />
              <span>Privacy & Data</span>
            </button>
          </nav>
        </div>

        {/* Settings Content */}
        <div className="col-span-9 p-6">
          {/* Profile Information Tab */}
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Profile Information</h2>
              
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <img 
                      src={profile.avatar || '/api/placeholder/150/150'} 
                      alt="Profile" 
                      className="w-32 h-32 rounded-full object-cover border-2 border-gray-200"
                    />
                    <label 
                      htmlFor="avatar-upload" 
                      className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full cursor-pointer hover:bg-blue-700 text-white"
                    >
                      <Upload size={16} />
                      <input 
                        id="avatar-upload" 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleAvatarChange}
                      />
                    </label>
                  </div>
                  <p className="text-sm text-gray-500">Upload a profile picture</p>
                </div>

                <div className="flex-grow">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        name="fullName"
                        value={profile.fullName}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={profile.email}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={profile.phone}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                      <input
                        type="text"
                        name="jobTitle"
                        value={profile.jobTitle}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                      <input
                        type="text"
                        name="company"
                        value={profile.company}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      name="bio"
                      value={profile.bio}
                      onChange={handleProfileChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
                  <Save size={16} className="mr-2" />
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Notification Preferences</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-3">Communication Channels</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-gray-500">Receive updates via email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={notifications.email}
                          onChange={() => handleNotificationChange('email')}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Push Notifications</p>
                        <p className="text-sm text-gray-500">Receive alerts on your device</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={notifications.push}
                          onChange={() => handleNotificationChange('push')}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">SMS Notifications</p>
                        <p className="text-sm text-gray-500">Receive text messages for important updates</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={notifications.sms}
                          onChange={() => handleNotificationChange('sms')}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-3">Notification Types</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Project Updates</p>
                        <p className="text-sm text-gray-500">Changes to your projects and collaborations</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={notifications.projectUpdates}
                          onChange={() => handleNotificationChange('projectUpdates')}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Security Alerts</p>
                        <p className="text-sm text-gray-500">Important security-related notifications</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={notifications.securityAlerts}
                          onChange={() => handleNotificationChange('securityAlerts')}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Marketing & Updates</p>
                        <p className="text-sm text-gray-500">New features, tips, and promotional content</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={notifications.marketing}
                          onChange={() => handleNotificationChange('marketing')}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
                  <Save size={16} className="mr-2" />
                  Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* Collaborative Projects Tab */}
          {activeTab === 'projects' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Collaborative Projects</h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                <p className="text-sm text-blue-800">
                  You are participating in {collaborativeProjects.filter(p => p.active).length} active projects. 
                  Manage your roles and access below.
                </p>
              </div>
              
              <div className="space-y-4">
                {collaborativeProjects.map(project => (
                  <div key={project.id} className={`border rounded-md p-4 ${project.active ? 'border-gray-200' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-lg">{project.name}</h3>
                        <p className="text-sm text-gray-500">Owned by {project.owner}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={project.active}
                          onChange={() => handleProjectActiveChange(project.id)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className={`mt-4 ${!project.active && 'opacity-50'}`}>
                      <div className="flex items-center">
                        <span className="text-sm font-medium mr-3">Your Role:</span>
                        <select 
                          value={project.role} 
                          onChange={(e) => handleProjectRoleChange(project.id, e.target.value)}
                          disabled={!project.active}
                          className="bg-white border border-gray-300 text-gray-700 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 p-2"
                        >
                          <option value="Viewer">Viewer</option>
                          <option value="Editor">Editor</option>
                          <option value="Contributor">Contributor</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button 
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                          disabled={!project.active}
                        >
                          <FileText size={16} className="mr-2" />
                          View Project Details
                        </button>
                        <button 
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm flex items-center justify-center text-red-600 hover:bg-red-50 hover:border-red-200 disabled:opacity-50"
                          disabled={!project.active}
                        >
                          <LogOut size={16} className="mr-2" />
                          Leave Project
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Security Settings</h2>
              
              <div className="space-y-6">
                <div className="border border-gray-200 rounded-md p-5">
                  <h3 className="text-lg font-medium mb-4">Password</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                      <input 
                        type="password" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter your current password" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <input 
                        type="password" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter new password" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                      <input 
                        type="password" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Confirm new password" 
                      />
                    </div>
                    <div className="pt-2">
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        Update Password
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-md p-5">
                  <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Add an extra layer of security to your account by enabling two-factor authentication.
                  </p>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                    Enable 2FA
                  </button>
                </div>
                
                <div className="border border-gray-200 rounded-md p-5">
                  <h3 className="text-lg font-medium mb-4">Active Sessions</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Devices and locations where you're currently logged in.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="border-b border-gray-200 pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">Chrome on Windows</p>
                          <p className="text-sm text-gray-500">New York, USA • Current Session</p>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full">Active</span>
                      </div>
                    </div>
                    
                    <div className="border-b border-gray-200 pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">Safari on iPhone</p>
                          <p className="text-sm text-gray-500">New York, USA • Last active: 2 hours ago</p>
                        </div>
                        <button className="text-xs text-red-600 hover:text-red-800">Sign Out</button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <button className="text-sm text-red-600 font-medium hover:text-red-800">
                      Sign Out From All Devices
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Privacy & Data Tab */}
          {activeTab === 'privacy' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Privacy & Data Settings</h2>
              
              <div className="space-y-6">
                <div className="border border-gray-200 rounded-md p-5">
                  <h3 className="text-lg font-medium mb-2">Data Privacy</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Control how your data is used and shared across the platform.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input id="privacy-profile" type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                      <label htmlFor="privacy-profile" className="ml-2 text-sm font-medium text-gray-700">
                        Make my profile visible to other users
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input id="privacy-activity" type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                      <label htmlFor="privacy-activity" className="ml-2 text-sm font-medium text-gray-700">
                        Share my activity status with collaborators
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input id="privacy-usage" type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                      <label htmlFor="privacy-usage" className="ml-2 text-sm font-medium text-gray-700">
                        Allow usage data collection to improve services
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-md p-5">
                  <h3 className="text-lg font-medium mb-2">Data Export</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Request a copy of your personal data that we have stored.
                  </p>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
                    <FileText size={16} className="mr-2" />
                    Request Data Export
                  </button>
                </div>
                
                <div className="border border-red-100 rounded-md p-5 bg-red-50">
                  <h3 className="text-lg font-medium text-red-800 mb-2">Account Deletion</h3>
                  <p className="text-sm text-red-700 mb-4">
                    This action is irreversible. All your data will be permanently deleted.
                  </p>
                  <button className="px-4 py-2 bg-white border border-red-600 text-red-600 rounded-md hover:bg-red-50 flex items-center">
                    <Trash2 size={16} className="mr-2" />
                    Request Account Deletion
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;