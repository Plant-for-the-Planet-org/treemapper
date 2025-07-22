'use client'

import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Save,
  Upload,
  User,
  Globe,
  Eye,
  EyeOff,
  LogOut,
  Check,
  X,
  Loader
} from 'lucide-react';

// Mock context and API functions for demonstration
const useToken = () => ({ accessToken: 'mock-token' });
const generatePreSignUrl = async () => ({ statusCode: 200, data: { data: { uploadUrl: '', fileName: 'test.jpg' } } });
const getMyDetails = async () => ({ statusCode: 200, data: { displayName: 'John Doe', email: 'john@example.com', firstname: 'John', lastname: 'Doe', bio: '', image: '', slug: 'john-doe', url: '', type: 'individual', isPrivate: false } });
const updateUserDetails = async () => ({ statusCode: 200 });

// Generate animal avatar using the pattern you provided
const generateAnimalAvatar = (uid) => {
  // Using a simple hash to generate consistent avatar index
  const hash = uid ? uid.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0) & 0xffffffff, 0) : Math.random();
  const index = Math.abs(hash) % 50 + 1;
  return `https://avatar.iran.liara.run/public/${index}`;
};

// Avatar Component
const AvatarUpload = ({ profile, onAvatarChange, isUploading }) => {
  const avatarSrc = profile.image || generateAnimalAvatar(profile.email || 'default');
  
  return (
    <div className="flex flex-col items-center space-y-4 lg:w-1/3">
      <div className="relative group">
        <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-stone-100 shadow-lg bg-stone-50">
          <img
            src={avatarSrc}
            alt="Profile"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            onError={(e) => {
              e.target.src = generateAnimalAvatar(profile.email || 'fallback');
            }}
          />
        </div>
        <label
          htmlFor="avatar-upload"
          className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer backdrop-blur-sm"
        >
          {isUploading ? (
            <Loader size={24} className="text-white animate-spin" />
          ) : (
            <Upload size={24} className="text-white" />
          )}
          <input
            id="avatar-upload"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={onAvatarChange}
            disabled={isUploading}
          />
        </label>
      </div>
      <p className="text-sm text-stone-500 text-center max-w-[180px]">
        {isUploading ? 'Uploading...' : 'Click to upload a new profile picture'}
      </p>
    </div>
  );
};

// Input Field Component
const InputField = ({ label, name, value, onChange, type = 'text', placeholder, readOnly, validation, ...props }) => {
  const hasError = validation?.error;
  const hasSuccess = validation?.success;
  
  return (
    <div>
      <label className="block text-sm font-semibold text-stone-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`w-full px-4 py-3 border rounded-xl transition-all duration-300 ${
            readOnly
              ? 'bg-stone-50 text-stone-500 cursor-not-allowed border-stone-200'
              : hasError
              ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
              : hasSuccess
              ? 'border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200'
              : 'border-stone-300 focus:border-[#007A49] focus:ring-2 focus:ring-[#007A49]/20'
          } focus:outline-none`}
          {...props}
        />
        {readOnly && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-xs text-stone-400 bg-stone-200 px-2 py-1 rounded">Read-only</span>
          </div>
        )}
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
        <p className="text-xs text-red-600 mt-1 animate-in slide-in-from-top-1 duration-200">
          {validation.error}
        </p>
      )}
      {validation?.hint && !hasError && (
        <p className="text-xs text-stone-500 mt-1">{validation.hint}</p>
      )}
    </div>
  );
};

// Textarea Component
const TextareaField = ({ label, name, value, onChange, rows = 4, placeholder, validation }) => {
  const hasError = validation?.error;
  
  return (
    <div>
      <label className="block text-sm font-semibold text-stone-700 mb-2">
        {label}
      </label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className={`w-full px-4 py-3 border rounded-xl resize-none transition-all duration-300 ${
          hasError
            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
            : 'border-stone-300 focus:border-[#007A49] focus:ring-2 focus:ring-[#007A49]/20'
        } focus:outline-none`}
      />
      {hasError && (
        <p className="text-xs text-red-600 mt-1 animate-in slide-in-from-top-1 duration-200">
          {validation.error}
        </p>
      )}
    </div>
  );
};

// Select Component
const SelectField = ({ label, name, value, onChange, options, validation }) => {
  const hasError = validation?.error;
  
  return (
    <div>
      <label className="block text-sm font-semibold text-stone-700 mb-2">
        {label}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-3 border rounded-xl transition-all duration-300 ${
          hasError
            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
            : 'border-stone-300 focus:border-[#007A49] focus:ring-2 focus:ring-[#007A49]/20'
        } focus:outline-none bg-white`}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

// Privacy Toggle Component
const PrivacyToggle = ({ profile, onChange }) => {
  return (
    <div className="flex items-center justify-between p-6 rounded-2xl bg-stone-50/50 hover:bg-stone-100/50 transition-all duration-300 border border-stone-200/50">
      <div className="flex items-center space-x-4">
        <div className={`p-2 rounded-xl transition-colors duration-300 ${
          profile.isPrivate ? 'bg-stone-200' : 'bg-[#007A49]/10'
        }`}>
          {profile.isPrivate ? (
            <EyeOff size={20} className="text-stone-600" />
          ) : (
            <Eye size={20} className="text-[#007A49]" />
          )}
        </div>
        <div>
          <p className="font-semibold text-stone-800">Private Profile</p>
          <p className="text-sm text-stone-600">
            {profile.isPrivate
              ? "Your profile is private and only visible to you"
              : "Your profile is public and visible to everyone"
            }
          </p>
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          name="isPrivate"
          checked={profile.isPrivate}
          onChange={onChange}
          className="sr-only peer"
        />
        <div className={`w-12 h-6 rounded-full transition-all duration-300 peer-focus:ring-4 peer-focus:ring-[#007A49]/20 ${
          profile.isPrivate ? 'bg-[#007A49]' : 'bg-stone-300'
        } peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm`}></div>
      </label>
    </div>
  );
};

// Header Component
const Header = ({ goBack, onLogout }) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-stone-200/50 sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={goBack}
              className="p-2 rounded-lg text-stone-600 hover:bg-stone-100 transition-all duration-200 hover:scale-105"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="ml-4 text-xl font-semibold text-stone-900">Profile Settings</h1>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Action Buttons Component
const ActionButtons = ({ onSave, isSaving, onCancel }) => {
  return (
    <div className="flex justify-end space-x-4 pt-6">
      <button
        onClick={onCancel}
        className="px-6 py-3 text-stone-600 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-all duration-200 font-medium"
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={isSaving}
        className="px-8 py-3 bg-[#007A49] text-white rounded-xl hover:bg-[#006841] disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-semibold shadow-md transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
      >
        {isSaving ? (
          <>
            <Loader size={18} className="mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save size={18} className="mr-2" />
            Save Changes
          </>
        )}
      </button>
    </div>
  );
};

// Main Component
const ProfileSettings = ({ goBack }) => {
  const [profile, setProfile] = useState({
    displayName: '',
    email: '',
    firstname: '',
    lastname: '',
    bio: '',
    image: '',
    slug: '',
    url: '',
    type: '',
    isPrivate: false
  });
  
  const [file, setFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { accessToken } = useToken();

  useEffect(() => {
    fetchUserDetails();
  }, [accessToken]);

  const fetchUserDetails = async () => {
    const response = await getMyDetails(accessToken);
    if (response.statusCode === 200) {
      setProfile({ ...response.data });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!profile.firstname.trim()) {
      errors.firstname = 'First name is required';
    }
    
    if (!profile.lastname.trim()) {
      errors.lastname = 'Last name is required';
    }
    
    if (!profile.displayName.trim()) {
      errors.displayName = 'Display name is required';
    }
    
    if (!profile.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(profile.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (profile.url && !/^https?:\/\/.+/.test(profile.url)) {
      errors.url = 'Please enter a valid URL starting with http:// or https://';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfile(prev => ({
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

  const handleAvatarChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setIsUploading(true);
      setFile(selectedFile);
      
      // Create preview
      const previewUrl = URL.createObjectURL(selectedFile);
      setProfile(prev => ({ ...prev, image: previewUrl }));
      
      // Simulate upload delay
      setTimeout(() => {
        setIsUploading(false);
      }, 1500);
    }
  };

  const uploadViaAPI = async (selectedImage, uploadUrl) => {
    // Mock upload function
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 1000);
    });
  };

  const uploadImage = async () => {
    try {
      if (!file) {
        throw 'Image Details not found';
      }
      
      const presignedResponse = await generatePreSignUrl(accessToken, {
        fileName: String(new Date().getMilliseconds()),
        fileType: file?.type,
        folder: 'profile'
      });

      if (presignedResponse.statusCode !== 200 && presignedResponse.statusCode !== 201) {
        throw new Error(presignedResponse.message || 'Failed to get upload URL');
      }

      const response = await uploadViaAPI(file, presignedResponse.data.data.uploadUrl);
      if (response.success) {
        return {
          fileName: presignedResponse.data.data.fileName,
          success: true
        };
      } else {
        throw 'Failed to upload image';
      }
    } catch (error) {
      console.error('Image upload error:', error);
      return {
        fileName: '',
        success: false
      };
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      let fileName = '';
      if (file) {
        const uploadResponse = await uploadImage();
        if (uploadResponse.success) {
          fileName = uploadResponse.fileName;
        }
      }

      const payload = { ...profile };
      if (payload.image && payload.image.startsWith('blob:')) {
        delete payload.image;
      }
      if (fileName) {
        payload['image'] = fileName;
      }

      await updateUserDetails(accessToken, payload);
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('orgId');
    window.location.href = '/api/auth/logout';
  };

  const handleCancel = () => {
    fetchUserDetails(); // Reset to original values
    setValidationErrors({});
    setFile(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 w-full">
      <Header goBack={goBack} onLogout={handleLogout} />

      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-in slide-in-from-right-full duration-300 z-50">
          <div className="flex items-center space-x-2">
            <Check size={18} />
            <span>Profile updated successfully!</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Profile Information Section */}
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-stone-200/50 p-8 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-stone-900 mb-2">Profile Information</h2>
              <p className="text-stone-600">Update your personal details and profile picture.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
              <AvatarUpload 
                profile={profile} 
                onAvatarChange={handleAvatarChange}
                isUploading={isUploading}
              />

              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField
                    label="First Name"
                    name="firstname"
                    value={profile.firstname}
                    onChange={handleProfileChange}
                    validation={{ error: validationErrors.firstname }}
                  />
                  
                  <InputField
                    label="Last Name"
                    name="lastname"
                    value={profile.lastname}
                    onChange={handleProfileChange}
                    validation={{ error: validationErrors.lastname }}
                  />
                  
                  <div className="md:col-span-2">
                    <InputField
                      label="Display Name"
                      name="displayName"
                      value={profile.displayName}
                      onChange={handleProfileChange}
                      validation={{ error: validationErrors.displayName }}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <InputField
                      label="Email"
                      name="email"
                      type="email"
                      value={profile.email}
                      onChange={handleProfileChange}
                      validation={{ error: validationErrors.email }}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <InputField
                      label="Website URL"
                      name="url"
                      type="url"
                      value={profile.url}
                      onChange={handleProfileChange}
                      placeholder="https://yourwebsite.com"
                      validation={{ error: validationErrors.url }}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <InputField
                      label="Profile Slug"
                      name="slug"
                      value={profile.slug}
                      readOnly
                      validation={{ hint: "Your unique profile identifier" }}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <SelectField
                      label="Account Type"
                      name="type"
                      value={profile.type}
                      onChange={handleProfileChange}
                      options={[
                        { value: 'individual', label: 'Individual' },
                        { value: 'organization', label: 'Organization' }
                      ]}
                    />
                  </div>
                </div>

                <TextareaField
                  label="Bio"
                  name="bio"
                  value={profile.bio}
                  onChange={handleProfileChange}
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>
          </div>

          {/* Privacy Settings Section */}
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-stone-200/50 p-8 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-stone-900 mb-2">Privacy Settings</h2>
              <p className="text-stone-600">Control who can see your profile information.</p>
            </div>

            <PrivacyToggle profile={profile} onChange={handleProfileChange} />
          </div>

          <ActionButtons 
            onSave={handleSave}
            isSaving={isSaving}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;