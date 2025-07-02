import React, { useState } from 'react';
import {
  User,
  Bell,
  Lock,
  Shield,
  LogOutIcon,
  LogOut,
  Save,
  Users,
  FileText,
  Settings,
  Globe,
  ChevronRight,
  Upload,
  Trash2,
  Menu,
  X,
  ArrowLeft
} from 'lucide-react';

const ProfileSettings = ({goBack}) => {
  // State for mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // State for user profile data
  const [profile, setProfile] = useState({
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    jobTitle: 'Student',
    company: 'Acme Inc.',
    bio: 'Passionate about building great products and leading teams.',
    avatar: 'https://avatar.iran.liara.run/public/1'
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

  const handleLogout = () => {
    window.location.href = '/api/auth/logout';
  }

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
      setProfile(prev => ({ ...prev, avatar: URL.createObjectURL(file) }));
    }
  };

  const navItems = [
    { id: 'profile', label: 'Profile Information', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'projects', label: 'Collaborative Projects', icon: Users },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'privacy', label: 'Privacy & Data', icon: Shield },
    { id: 'logout', label: 'Logout', icon: LogOutIcon, danger: true },
  ];

  const NavItem = ({ item, isActive, onClick }) => (
    <button
      onClick={() => {
        onClick(item.id);
        setIsMobileMenuOpen(false);
      }}
      className={`flex items-center w-full px-4 py-3 rounded-xl text-left transition-all duration-200 ${
        isActive
          ? item.danger
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 shadow-sm'
          : item.danger
          ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <item.icon size={20} className="mr-3 flex-shrink-0" />
      <span className="font-medium">{item.label}</span>
    </button>
  );

  const ToggleSwitch = ({ checked, onChange, disabled = false }) => (
    <label className={`relative inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-blue-600 shadow-inner"></div>
    </label>
  );

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full h-full">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
          <div className="px-4 px-2">
            <div className="flex items-center justify-between h-16">
              {/* <BackButton label='Profile Settings' /> */}
              <div onClick={goBack} ><ArrowLeft/></div>
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row min-h-screen">
          {/* Sidebar Navigation */}
          <div className={`
            ${isMobileMenuOpen ? 'block' : 'hidden lg:block'}
            lg:w-80 bg-white/70 backdrop-blur-sm border-r border-gray-200/50
            absolute lg:relative z-40 w-full lg:w-auto h-full lg:h-auto
          `}>
            <div className="p-6 space-y-2">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Account Settings
              </h3>
              {navItems.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  isActive={activeTab === item.id}
                  onClick={setActiveTab}
                />
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
              {/* Profile Information Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Profile Information</h2>
                    <p className="text-gray-600">Update your personal details and profile picture.</p>
                  </div>

                  <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8 shadow-sm">
                    <div className="flex flex-col lg:flex-row gap-8">
                      {/* Avatar Section */}
                      <div className="flex flex-col items-center space-y-4 lg:w-1/3">
                        <div className="relative group">
                          <img
                            src={profile.avatar || '/api/placeholder/150/150'}
                            alt="Profile"
                            className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-lg"
                          />
                          <label
                            htmlFor="avatar-upload"
                            className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <Upload size={24} className="text-white" />
                            <input
                              id="avatar-upload"
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleAvatarChange}
                            />
                          </label>
                        </div>
                        <p className="text-sm text-gray-500 text-center">
                          Click to upload a new profile picture
                        </p>
                      </div>

                      {/* Form Section */}
                      <div className="flex-1 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                            <input
                              type="text"
                              name="fullName"
                              value={profile.fullName}
                              onChange={handleProfileChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                            <input
                              type="email"
                              name="email"
                              value={profile.email}
                              onChange={handleProfileChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                            <input
                              type="tel"
                              name="phone"
                              value={profile.phone}
                              onChange={handleProfileChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Designation</label>
                            <input
                              type="text"
                              name="jobTitle"
                              value={profile.jobTitle}
                              onChange={handleProfileChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Organization</label>
                            <input
                              type="text"
                              name="company"
                              value={profile.company}
                              onChange={handleProfileChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
                          <textarea
                            name="bio"
                            value={profile.bio}
                            onChange={handleProfileChange}
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                          />
                        </div>

                        <div className="flex justify-end pt-4">
                          <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 flex items-center font-semibold shadow-md transition-all transform hover:scale-105">
                            <Save size={18} className="mr-2" />
                            Save Changes
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Notification Preferences</h2>
                    <p className="text-gray-600">Choose how you want to be notified about important updates.</p>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8 shadow-sm">
                      <h3 className="text-xl font-semibold text-gray-800 mb-6">Communication Channels</h3>
                      <div className="space-y-6">
                        {[
                          { key: 'email', title: 'Email Notifications', desc: 'Receive updates via email' },
                          { key: 'push', title: 'Push Notifications', desc: 'Receive alerts on your device' },
                          { key: 'sms', title: 'SMS Notifications', desc: 'Receive text messages for important updates' }
                        ].map(({ key, title, desc }) => (
                          <div key={key} className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                            <div>
                              <p className="font-semibold text-gray-800">{title}</p>
                              <p className="text-sm text-gray-600">{desc}</p>
                            </div>
                            <ToggleSwitch
                              checked={notifications[key]}
                              onChange={() => handleNotificationChange(key)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8 shadow-sm">
                      <h3 className="text-xl font-semibold text-gray-800 mb-6">Notification Types</h3>
                      <div className="space-y-6">
                        {[
                          { key: 'projectUpdates', title: 'Project Updates', desc: 'Changes to your projects and collaborations' },
                          { key: 'securityAlerts', title: 'Security Alerts', desc: 'Important security-related notifications' },
                          { key: 'marketing', title: 'Marketing & Updates', desc: 'New features, tips, and promotional content' }
                        ].map(({ key, title, desc }) => (
                          <div key={key} className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                            <div>
                              <p className="font-semibold text-gray-800">{title}</p>
                              <p className="text-sm text-gray-600">{desc}</p>
                            </div>
                            <ToggleSwitch
                              checked={notifications[key]}
                              onChange={() => handleNotificationChange(key)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 flex items-center font-semibold shadow-md transition-all transform hover:scale-105">
                        <Save size={18} className="mr-2" />
                        Save Preferences
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Collaborative Projects Tab */}
              {activeTab === 'projects' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Collaborative Projects</h2>
                    <p className="text-gray-600">Manage your project collaborations and access levels.</p>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                      <p className="text-blue-800 font-medium">
                        You are participating in {collaborativeProjects.filter(p => p.active).length} active projects.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {collaborativeProjects.map(project => (
                      <div key={project.id} className={`bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 shadow-sm transition-all ${!project.active ? 'opacity-70' : ''}`}>
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                          <div>
                            <h3 className="font-semibold text-xl text-gray-800">{project.name}</h3>
                            <p className="text-gray-600">Owned by {project.owner}</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-medium text-gray-600">Active</span>
                            <ToggleSwitch
                              checked={project.active}
                              onChange={() => handleProjectActiveChange(project.id)}
                            />
                          </div>
                        </div>

                        {project.active && (
                          <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                              <span className="text-sm font-semibold text-gray-700">Your Role:</span>
                              <select
                                value={project.role}
                                onChange={(e) => handleProjectRoleChange(project.id, e.target.value)}
                                className="bg-white border border-gray-300 text-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent px-4 py-2 transition-all"
                              >
                                <option value="Viewer">Viewer</option>
                                <option value="Editor">Editor</option>
                                <option value="Contributor">Contributor</option>
                                <option value="Admin">Admin</option>
                              </select>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                              <button className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm flex items-center justify-center hover:bg-gray-50 transition-colors font-medium">
                                <FileText size={16} className="mr-2" />
                                View Project Details
                              </button>
                              <button className="flex-1 px-4 py-2 border border-red-200 rounded-xl text-sm flex items-center justify-center text-red-600 hover:bg-red-50 transition-colors font-medium">
                                <LogOut size={16} className="mr-2" />
                                Leave Project
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Security Settings</h2>
                    <p className="text-gray-600">Manage your account security and authentication methods.</p>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8 shadow-sm">
                      <h3 className="text-xl font-semibold mb-6">Password</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                          <input
                            type="password"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Enter your current password"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                          <input
                            type="password"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Enter new password"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                          <input
                            type="password"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Confirm new password"
                          />
                        </div>
                        <div className="pt-4">
                          <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-semibold shadow-md transition-all transform hover:scale-105">
                            Update Password
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8 shadow-sm">
                      <h3 className="text-xl font-semibold mb-4">Two-Factor Authentication</h3>
                      <p className="text-gray-600 mb-6">
                        Add an extra layer of security to your account by enabling two-factor authentication.
                      </p>
                      <button className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 font-semibold shadow-md transition-all transform hover:scale-105">
                        Enable 2FA
                      </button>
                    </div>

                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8 shadow-sm">
                      <h3 className="text-xl font-semibold mb-4">Active Sessions</h3>
                      <p className="text-gray-600 mb-6">
                        Devices and locations where you're currently logged in.
                      </p>

                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50/50 rounded-xl">
                          <div>
                            <p className="font-semibold text-gray-800">Chrome on Windows</p>
                            <p className="text-sm text-gray-600">New York, USA • Current Session</p>
                          </div>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2 sm:mt-0">
                            Active
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50/50 rounded-xl">
                          <div>
                            <p className="font-semibold text-gray-800">Safari on iPhone</p>
                            <p className="text-sm text-gray-600">New York, USA • Last active: 2 hours ago</p>
                          </div>
                          <button className="text-sm text-red-600 hover:text-red-800 font-medium mt-2 sm:mt-0 transition-colors">
                            Sign Out
                          </button>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <button className="text-red-600 font-semibold hover:text-red-800 transition-colors">
                          Sign Out From All Devices
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy & Data Tab */}
              {activeTab === 'privacy' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Privacy & Data Settings</h2>
                    <p className="text-gray-600">Control how your data is used and manage your privacy preferences.</p>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8 shadow-sm">
                      <h3 className="text-xl font-semibold mb-6">Data Privacy</h3>
                      <div className="space-y-4">
                        {[
                          'Make my profile visible to other users',
                          'Share my activity status with collaborators',
                          'Allow usage data collection to improve services'
                        ].map((label, index) => (
                          <div key={index} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50/50 transition-colors">
                            <input
                              id={`privacy-${index}`}
                              type="checkbox"
                              className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <label htmlFor={`privacy-${index}`} className="text-gray-700 font-medium">
                              {label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8 shadow-sm">
                      <h3 className="text-xl font-semibold mb-4">Data Export</h3>
                      <p className="text-gray-600 mb-6">
                        Request a copy of your personal data that we have stored.
                      </p>
                      <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 flex items-center font-semibold shadow-md transition-all transform hover:scale-105">
                        <FileText size={18} className="mr-2" />
                        Request Data Export
                      </button>
                    </div>

                    <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-8 shadow-sm">
                      <h3 className="text-xl font-semibold text-red-800 mb-4">Account Deletion</h3>
                      <p className="text-red-700 mb-6">
                        This action is irreversible. All your data will be permanently deleted.
                      </p>
                      <button className="px-6 py-3 bg-white border-2 border-red-600 text-red-600 rounded-xl hover:bg-red-50 flex items-center font-semibold shadow-md transition-all transform hover:scale-105">
                        <Trash2 size={18} className="mr-2" />
                        Request Account Deletion
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Logout Tab */}
              {activeTab === 'logout' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Logout</h2>
                    <p className="text-gray-600">Sign out of your account securely.</p>
                  </div>

                  <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-8 shadow-sm">
                    <h3 className="text-xl font-semibold text-red-800 mb-4">Ready to sign out?</h3>
                    <p className="text-red-700 mb-6">
                      All your data is saved. You can proceed with logout safely.
                    </p>
                    <button 
                      className="px-6 py-3 bg-white border-2 border-red-600 text-red-600 rounded-xl hover:bg-red-50 flex items-center font-semibold shadow-md transition-all transform hover:scale-105" 
                      onClick={handleLogout}
                    >
                      <LogOutIcon size={18} className="mr-2" />
                      Proceed to Logout
                    </button>
                  </div>
                </div>
              )}
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
    </div>
  );
};

export default ProfileSettings;