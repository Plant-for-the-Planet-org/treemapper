import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'solito/router';
import {
  Button,
  Text,
  Switch,
  Input,
  Avatar,
  YStack,
  XStack,
  Separator
} from 'tamagui';
// Import icons individually to avoid potential undefined issues
import { Camera } from '@tamagui/lucide-icons';
import { Moon } from '@tamagui/lucide-icons';
import { Bell } from '@tamagui/lucide-icons';
import { Lock } from '@tamagui/lucide-icons';
import { Globe } from '@tamagui/lucide-icons';
import { ChevronRight } from '@tamagui/lucide-icons';
import { LogOut } from '@tamagui/lucide-icons';
import { ArrowLeft } from '@tamagui/lucide-icons';
// import * as ImagePicker from 'expo-image-picker';

const ProfileSettings = () => {
  const router = useRouter();

  // User data state
  const [userData, setUserData] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    bio: 'Software developer with a passion for mobile apps',
    profileImage: 'https://via.placeholder.com/150',
  });

  // Preferences state
  const [preferences, setPreferences] = useState({
    darkMode: false,
    notifications: true,
    emailUpdates: false,
    dataUsage: 'Wifi Only',
    language: 'English',
    privacy: 'Public',
  });

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [tempUserData, setTempUserData] = useState({ ...userData });

  // Toggle edit mode
  const toggleEditMode = () => {
    if (isEditing) {
      // Save changes
      setUserData({ ...tempUserData });
      Alert.alert('Success', 'Profile updated successfully!');
    } else {
      // Enter edit mode
      setTempUserData({ ...userData });
    }
    setIsEditing(!isEditing);
  };

  // Handle profile image selection
  const pickImage = async () => {
    // const result = await ImagePicker.launchImageLibraryAsync({
    //   mediaTypes: ImagePicker.MediaTypeOptions.Images,
    //   allowsEditing: true,
    //   aspect: [1, 1],
    //   quality: 0.8,
    // });

    // if (!result.canceled && result.assets && result.assets.length > 0) {
    //   const newUserData = isEditing ? 
    //     { ...tempUserData, profileImage: result.assets[0].uri } : 
    //     { ...userData, profileImage: result.assets[0].uri };
      
    //   isEditing ? setTempUserData(newUserData) : setUserData(newUserData);
    // }
  };

  // Handle preference toggle
  const togglePreference = (key) => {
    setPreferences({
      ...preferences,
      [key]: !preferences[key],
    });
  };

  // Custom divider component to avoid using Tamagui Divider which might be undefined
  const CustomDivider = () => (
    <View style={{ height: 1, backgroundColor: '#e0e0e0', marginVertical: 16 }} />
  );

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text fontSize="$6" fontWeight="bold">Profile Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Profile Header */}
        <YStack space="$4" paddingVertical="$6" alignItems="center">
          <TouchableOpacity onPress={pickImage}>
            <Avatar circular size="$12">
              <Avatar.Image src={isEditing ? tempUserData.profileImage : userData.profileImage} />
              <Avatar.Fallback backgroundColor="$gray5" />
            </Avatar>
            <View style={styles.cameraIconContainer}>
              <Camera size={20} color="#fff" />
            </View>
          </TouchableOpacity>

          <YStack alignItems="center" space="$2">
            <Text fontSize="$6" fontWeight="bold">{isEditing ? tempUserData.name : userData.name}</Text>
            <Text fontSize="$3" color="$gray10">{isEditing ? tempUserData.email : userData.email}</Text>
          </YStack>

          <Button 
            onPress={toggleEditMode} 
            size="$3"
            theme={isEditing ? "active" : "gray"}
          >
            {isEditing ? 'Save Changes' : 'Edit Profile'}
          </Button>
        </YStack>

        <CustomDivider />

        {/* Personal Information */}
        <YStack space="$4" padding="$4">
          <Text fontSize="$5" fontWeight="bold" paddingBottom="$2">Personal Information</Text>
          
          {isEditing ? (
            // Edit mode form
            <YStack space="$4">
              <Input 
                placeholder="Full Name"
                value={tempUserData.name}
                onChangeText={(text) => setTempUserData({ ...tempUserData, name: text })}
                size="$4"
              />
              <Input 
                placeholder="Email"
                value={tempUserData.email}
                onChangeText={(text) => setTempUserData({ ...tempUserData, email: text })}
                size="$4"
                keyboardType="email-address"
              />
              <Input 
                placeholder="Phone Number"
                value={tempUserData.phone}
                onChangeText={(text) => setTempUserData({ ...tempUserData, phone: text })}
                size="$4"
                keyboardType="phone-pad"
              />
              <Input 
                placeholder="Bio"
                value={tempUserData.bio}
                onChangeText={(text) => setTempUserData({ ...tempUserData, bio: text })}
                size="$4"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </YStack>
          ) : (
            // Display mode
            <YStack space="$4">
              <PreferenceItem 
                label="Full Name" 
                value={userData.name} 
              />
              <PreferenceItem 
                label="Email" 
                value={userData.email} 
              />
              <PreferenceItem 
                label="Phone" 
                value={userData.phone} 
              />
              <PreferenceItem 
                label="Bio" 
                value={userData.bio} 
                multiline
              />
            </YStack>
          )}
        </YStack>

        <CustomDivider />

        {/* Preferences */}
        <YStack space="$4" padding="$4">
          <Text fontSize="$5" fontWeight="bold" paddingBottom="$2">Preferences</Text>
          
          <YStack space="$4">
              <SwitchPreferenceItem 
                icon={Moon} 
                label="Dark Mode" 
                value={preferences.darkMode}
                onToggle={() => togglePreference('darkMode')}
              />
              
              <SwitchPreferenceItem 
                icon={Bell} 
                label="Push Notifications" 
                value={preferences.notifications}
                onToggle={() => togglePreference('notifications')}
              />
              
              <SwitchPreferenceItem 
                label="Email Updates" 
                value={preferences.emailUpdates}
                onToggle={() => togglePreference('emailUpdates')}
              />
            
            <OptionPreferenceItem 
              icon={Globe} 
              label="Language" 
              value={preferences.language}
              onPress={() => Alert.alert('Change Language', 'This would open a language selector')}
            />
            
            <OptionPreferenceItem 
              icon={Lock} 
              label="Privacy" 
              value={preferences.privacy}
              onPress={() => Alert.alert('Privacy Settings', 'This would open privacy options')}
            />
          </YStack>
        </YStack>

        <CustomDivider />

        {/* Account Actions */}
        <YStack space="$4" padding="$4" paddingBottom="$8">
          <Text fontSize="$5" fontWeight="bold" paddingBottom="$2">Account</Text>
          
          <Button 
            variant="outlined" 
            theme="red" 
            onPress={() => Alert.alert('Logout', 'Are you sure you want to logout?')}
            size="$4"
          >
            <LogOut size={18} color="$red10" />
            <Text>Logout</Text>
          </Button>
        </YStack>
      </ScrollView>
    </View>
  );
};

// Component for preference item (with value display)
const PreferenceItem = ({ label, value, multiline = false }) => (
  <YStack space="$1">
    <Text color="$gray11" fontSize="$3">{label}</Text>
    <Text 
      fontSize="$4" 
      numberOfLines={multiline ? 0 : 1} 
      style={multiline && { minHeight: 60 }}
    >
      {value}
    </Text>
  </YStack>
);

// Component for toggle preference items
const SwitchPreferenceItem = ({ icon: Icon, label, value, onToggle }) => {
  const id = `switch-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <XStack justifyContent="space-between" alignItems="center">
      <XStack space="$3" alignItems="center">
        {Icon && <Icon size={20} color="$gray10" />}
        <Text fontSize="$4">{label}</Text>
      </XStack>
      <Switch id={id} size="$3" checked={value} onCheckedChange={onToggle}>
        <Switch.Thumb />
      </Switch>
    </XStack>
  );
};

// Component for option preference items
const OptionPreferenceItem = ({ icon: Icon, label, value, onPress }) => (
  <TouchableOpacity onPress={onPress}>
    <XStack justifyContent="space-between" alignItems="center">
      <XStack space="$3" alignItems="center">
        {Icon && <Icon size={20} color="$gray10" />}
        <Text fontSize="$4">{label}</Text>
      </XStack>
      <XStack space="$2" alignItems="center">
        <Text fontSize="$3" color="$gray10">{value}</Text>
        <ChevronRight size={16} color="$gray10" />
      </XStack>
    </XStack>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerSpacer: {
    width: 40, // Match the width of the back button for balanced spacing
  },
  scrollContainer: {
    flex: 1,
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007bff',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileSettings;