import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Save,
  Upload,
  User,
  Globe,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToken } from '../../context/TokenContext';
import { generatePreSignUrl, getMyDetails, updateUserDetails } from '../../api/api.fetch';

const ProfileSettings = ({ goBack }) => {
  // State for user profile data matching the Drizzle schema
  const [profile, setProfile] = useState({
    displayName: '',
    email: '',
    firstname: '',
    lastname: '',
    bio: '',
    image: '',
    slug: '', // Read-only
    url: '',
    type: '',
    isPrivate: false
  });
  const [file, setFile] = useState(null)
  const { accessToken } = useToken()
  useEffect(() => {
    fetchUserDetails()
  }, [accessToken])

  const fetchUserDetails = async () => {
    const response = await getMyDetails(accessToken)
    if (response.statusCode === 200) {
      setProfile({ ...response.data })
    }
  }

  // Handle profile form changes
  const handleProfileChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle file upload for avatar
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFile(e.target.files[0])
      // In a real app, you'd upload this to your server and get a URL back
      setProfile(prev => ({ ...prev, image: URL.createObjectURL(file) }));
    }
  };


  const uploadViaAPI = async (selectedImage: File, uploadUrl: string) => {
    try {
      const formData = new FormData();
      formData.append('file', selectedImage);

      const response = await fetch(`/api/upload-image?uploadUrl=${encodeURIComponent(uploadUrl)}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };



  const uploadImage = async () => {
    try {
      if (!file) {
        throw 'Image Details not found'
      }
      // Get pre-signed URL
      const presignedResponse = await generatePreSignUrl(accessToken, {
        fileName: String(new Date().getMilliseconds()),
        fileType: file?.type,
        folder: 'profile'
      })

      if (presignedResponse.statusCode !== 200 && presignedResponse.statusCode !== 201) {
        throw new Error(presignedResponse.message || 'Failed to get upload URL');
      }

      const response = await uploadViaAPI(file, presignedResponse.data.data.uploadUrl)
      if (response.success) {
        return {
          fileName: presignedResponse.data.data.fileName,
          success: true
        }
      } else {
        throw 'Failed to upload image'
      }

    } catch (error) {
      console.error('Image upload error:', error);
      return {
        fileName: '',
        success: false
      }
    }
  };
  // Handle save
  const handleSave = async () => {
    // Here you would make an API call to update the user profile
    console.log('Saving profile:', profile);
    let fileName = ''
    if (file) {
      const uplaodResponse = await uploadImage()
      if (uplaodResponse.success) {
        fileName = uplaodResponse.fileName
      }
    }

    const payload = { ...profile }
    if (payload.image) {
      delete payload.image;
    }
    if (fileName) {
      payload['image'] = fileName
    }

    await updateUserDetails(accessToken, profile)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={goBack}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <h1 className="ml-4 text-xl font-semibold text-gray-900" style={{ marginTop: 10 }}>Profile Settings</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Profile Information Section */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8 shadow-sm">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Information</h2>
              <p className="text-gray-600">Update your personal details and profile picture.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Avatar Section */}
              <div className="flex flex-col items-center space-y-4 lg:w-1/3">
                <div className="relative group">
                  <img
                    src={profile.image || '/api/placeholder/150/150'}
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      name="firstname"
                      value={profile.firstname}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      name="lastname"
                      value={profile.lastname}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Display Name</label>
                    <input
                      type="text"
                      name="displayName"
                      value={profile.displayName}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={profile.email}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Website URL</label>
                    <input
                      type="url"
                      name="url"
                      value={profile.url}
                      onChange={handleProfileChange}
                      placeholder="https://yourwebsite.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Profile Slug</label>
                    <div className="relative">
                      <input
                        type="text"
                        name="slug"
                        value={profile.slug}
                        readOnly
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">Read-only</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Your unique profile identifier</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Account Type</label>
                    <select
                      name="type"
                      value={profile.type}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="individual">Individual</option>
                      <option value="organization">Organization</option>
                    </select>
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
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Settings Section */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Privacy Settings</h2>
              <p className="text-gray-600">Control who can see your profile information.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                <div className="flex items-center space-x-3">
                  {profile.isPrivate ? (
                    <EyeOff size={20} className="text-gray-600" />
                  ) : (
                    <Eye size={20} className="text-gray-600" />
                  )}
                  <div>
                    <p className="font-semibold text-gray-800">Private Profile</p>
                    <p className="text-sm text-gray-600">
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
                    onChange={handleProfileChange}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-blue-600 shadow-inner"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 flex items-center font-semibold shadow-md transition-all transform hover:scale-105"
            >
              <Save size={18} className="mr-2" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;