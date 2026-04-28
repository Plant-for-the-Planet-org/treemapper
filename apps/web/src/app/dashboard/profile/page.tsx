'use client'

import React, { useEffect, useState } from 'react';
import {
  Check,

} from 'lucide-react';
import { ActionButtons } from './components/ActionButtons';
import { AvatarUpload } from './components/AvatarUpload';
import { Header } from './components/Header';
import { InputField } from './components/InputField';
import { SelectField } from './components/SelectField';
import { TextareaField } from './components/TextareaField';
import { useToken } from '@/context/useTokenContext';
import { generatePreSignUrl, getMyDetails, updateUserAvatar, updateUserDetails } from '@shared-core/fetchApi/api.fetch';



// Generate animal avatar using the pattern you provided
const generateAnimalAvatar = (uid) => {
  // Using a simple hash to generate consistent avatar index
  const hash = uid ? uid.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0) & 0xffffffff, 0) : Math.random();
  const index = Math.abs(hash) % 50 + 1;
  return `https://avatar.iran.liara.run/public/${index}`;
};


interface ProfileState {
  displayName: string;
  email: string;
  firstName: string;
  lastName: string;
  bio: string;
  image: string;
  slug: string;
  url: string;
  type: string;
  isPrivate: boolean;
}

const ProfileSettings = ({ goBack }: { goBack?: () => void }) => {
  const [profile, setProfile] = useState<ProfileState>({
    displayName: '',
    email: '',
    firstName: '',
    lastName: '',
    bio: '',
    image: '',
    slug: '',
    url: '',
    type: '',
    isPrivate: false
  });

  const [file, setFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const { accessToken } = useToken();

  useEffect(() => {
    fetchUserDetails();
  }, [accessToken]);

  const fetchUserDetails = async () => {
    const response = await getMyDetails(accessToken);
    if (response.statusCode === 200) {
      console.log('Fetched user details:', response.data);
      setProfile({ ...response.data });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!profile.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!profile.lastName.trim()) {
      errors.lastName = 'Last name is required';
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
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', selectedImage);

      const response = await fetch(`/api/upload-image?uploadUrl=${encodeURIComponent(uploadUrl)}`, {
        method: 'PUT',
        body: formDataUpload,
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
        throw new Error('Image file not found');
      }
      
      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const presignedResponse = await generatePreSignUrl(accessToken, {
        fileName: `${timestamp}_${file.name}`,
        fileType: file.type,
        folder: 'profile'
      });

      if (presignedResponse.statusCode !== 200 && presignedResponse.statusCode !== 201) {
        throw new Error(presignedResponse.message || 'Failed to get upload URL');
      }

      // Upload file to presigned URL
      const uploadResponse = await uploadViaAPI(file, presignedResponse.data.data.uploadUrl);
      if (!uploadResponse.success) {
        throw new Error('Failed to upload image to storage');
      }

      // Update user avatar in database
      const avatarUrl = `${process.env.NEXT_PUBLIC_CDN}/profile/${presignedResponse.data.data.fileName}`;
      const avatarUpdateResponse = await updateUserAvatar(accessToken, {
        avatarUrl: avatarUrl
      });

      if (avatarUpdateResponse.statusCode !== 200 && avatarUpdateResponse.statusCode !== 201) {
        throw new Error(avatarUpdateResponse.message || 'Failed to update avatar in database');
      }

      // Update local profile state with new image URL
      setProfile(prev => ({ ...prev, image: avatarUrl }));

      return {
        fileName: presignedResponse.data.data.fileName,
        success: true
      };
    } catch (error) {
      console.error('Image upload error:', error);
      return {
        fileName: '',
        success: false,
        error: error.message || 'Image upload failed'
      };
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      // Upload image first if a new file was selected
      if (file) {
        const uploadResponse = await uploadImage();
        if (!uploadResponse.success) {
          throw new Error('Failed to upload profile picture');
        }
        // Image is already updated via updateUserAvatar in uploadImage
        // Clear the file state since upload is complete
        setFile(null);
      }

      // Prepare payload for profile update (excluding image if it's a blob URL)
      const payload = { ...profile };
      if (payload.image && payload.image.startsWith('blob:')) {
        delete payload.image;
      }
      // Don't include image in payload if it was just uploaded via updateUserAvatar
      // The image field should already be updated in the profile state

      // Update other profile details
      await updateUserDetails(accessToken, payload);
      
      // Refresh user details to get the latest data
      await fetchUserDetails();
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Save error:', error);
      // Show error message to user
      alert(error.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    window.location.href = '/api/auth/logout';
  };

  const handleCancel = () => {
    fetchUserDetails(); // Reset to original values
    setValidationErrors({});
    setFile(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 w-full">
      <Header onLogout={handleLogout} />

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
                isUploading={isUploading} generateAnimalAvatar={generateAnimalAvatar} />

              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField
                    label="First Name"
                    name="firstName"
                    value={profile.firstName}
                    onChange={handleProfileChange}
                    validation={validationErrors.firstName ? { error: validationErrors.firstName } : undefined} placeholder={undefined} readOnly={undefined} />

                  <InputField
                    label="Last Name"
                    name="lastName"
                    value={profile.lastName}
                    onChange={handleProfileChange}
                    validation={validationErrors.lastName ? { error: validationErrors.lastName } : undefined} placeholder={undefined} readOnly={undefined} />

                  <div className="md:col-span-2">
                    <InputField
                      label="Display Name"
                      name="displayName"
                      value={profile.displayName}
                      onChange={handleProfileChange}
                      validation={validationErrors.displayName ? { error: validationErrors.displayName } : undefined} placeholder={undefined} readOnly={undefined} />
                  </div>

                  <div className="md:col-span-2">
                    <InputField
                      label="Email"
                      name="email"
                      type="email"
                      value={profile.email}
                      onChange={handleProfileChange}
                      validation={validationErrors.email ? { error: validationErrors.email } : undefined} placeholder={undefined} readOnly={true} />
                  </div>

                  <div className="md:col-span-2">
                    <InputField
                      label="Website URL"
                      name="url"
                      type="url"
                      value={profile.url}
                      onChange={handleProfileChange}
                      placeholder="https://yourwebsite.com"
                      validation={validationErrors.url ? { error: validationErrors.url } : undefined} readOnly={undefined} />
                  </div>

                  <div className="md:col-span-2">
                    <InputField
                      label="Profile Slug"
                      name="slug"
                      value={profile.slug}
                      readOnly
                      validation={{ hint: "Your unique profile identifier" }} onChange={undefined} placeholder={undefined} />
                  </div>

                  {/* <div className="md:col-span-2">
                    <SelectField
                      label="Account Type"
                      name="type"
                      value={profile.type}
                      onChange={handleProfileChange}
                      options={[
                        { value: 'individual', label: 'Individual' },
                        { value: 'organization', label: 'Organization' }
                      ]} validation={undefined}                    />
                  </div> */}
                </div>

                <TextareaField
                  label="Bio"
                  name="bio"
                  value={profile.bio}
                  onChange={handleProfileChange}
                  placeholder="Tell us about yourself..." validation={undefined} />
              </div>
            </div>
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