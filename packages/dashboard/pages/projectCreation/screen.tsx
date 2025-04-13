import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import {
  Input,
  Button,
  Select,
  TextArea,
  YStack,
  XStack,
  Text,
  Switch,
  Label,
  Separator,
  SizableText
} from 'tamagui';
import { ChevronDown, Info, ArrowLeft } from '@tamagui/lucide-icons';
import { useRouter } from 'solito/router';

const CreateProject = () => {
  const router = useRouter();
  
  // State for form fields
  const [formState, setFormState] = useState({
    projectName: '',
    ecosystem: '',
    projectType: '',
    unitType: '',
    target: '',
    projectUrl: 'pp.eco/',
    website: '',
    aboutProject: '',
    receivesDonations: false,
    providesLodging: false,
    location: {
      latitude: '',
      longitude: ''
    }
  });

  // Handle input changes
  const handleInputChange = (name, value) => {
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle location input changes
  const handleLocationChange = (name, value) => {
    setFormState(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [name]: value
      }
    }));
  };

  // Handle form submission
  const handleSaveAndContinue = () => {
    console.log('Form submitted with data:', formState);
    // Navigate to next screen or submit data to API
    // router.push('/next-screen');
  };

  // Mock options for select fields
  const ecosystemOptions = ['Forest', 'Ocean', 'Farmland', 'Urban'];
  const projectTypeOptions = ['Restoration', 'Conservation', 'Education'];
  const unitTypeOptions = ['Hectares', 'Acres', 'Square Kilometers'];

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text fontSize="$6" fontWeight="bold">New Project</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView style={styles.scrollContainer}>
        <YStack space="$4" padding="$4">
        {/* Project Name */}
        <Input
          size="$4"
          placeholder="Project Name"
          value={formState.projectName}
          onChangeText={(text) => handleInputChange('projectName', text)}
        />

        {/* Ecosystem and Project Type */}
        <XStack space="$3">
          <Select
            id="ecosystem"
            value={formState.ecosystem}
            onValueChange={(value) => handleInputChange('ecosystem', value)}
            size="$4"
            style={{ flex: 1 }}
          >
            <Select.Trigger iconAfter={ChevronDown}>
              <Select.Value placeholder="Ecosystem" />
            </Select.Trigger>
            <Select.Content>
              <Select.ScrollUpButton />
              <Select.Viewport>
                <Select.Group>
                  {ecosystemOptions.map((option) => (
                    <Select.Item key={option} value={option}>
                      <Select.ItemText>{option}</Select.ItemText>
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Group>
              </Select.Viewport>
              <Select.ScrollDownButton />
            </Select.Content>
          </Select>

          <Select
            id="projectType"
            value={formState.projectType}
            onValueChange={(value) => handleInputChange('projectType', value)}
            size="$4"
            style={{ flex: 1 }}
          >
            <Select.Trigger iconAfter={ChevronDown}>
              <Select.Value placeholder="Project Type" />
            </Select.Trigger>
            <Select.Content>
              <Select.ScrollUpButton />
              <Select.Viewport>
                <Select.Group>
                  {projectTypeOptions.map((option) => (
                    <Select.Item key={option} value={option}>
                      <Select.ItemText>{option}</Select.ItemText>
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Group>
              </Select.Viewport>
              <Select.ScrollDownButton />
            </Select.Content>
          </Select>
        </XStack>

        {/* Unit Type and Target */}
        <XStack space="$3">
          <Select
            id="unitType"
            value={formState.unitType}
            onValueChange={(value) => handleInputChange('unitType', value)}
            size="$4"
            style={{ flex: 1 }}
          >
            <Select.Trigger iconAfter={ChevronDown}>
              <Select.Value placeholder="Unit Type" />
            </Select.Trigger>
            <Select.Content>
              <Select.ScrollUpButton />
              <Select.Viewport>
                <Select.Group>
                  {unitTypeOptions.map((option) => (
                    <Select.Item key={option} value={option}>
                      <Select.ItemText>{option}</Select.ItemText>
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Group>
              </Select.Viewport>
              <Select.ScrollDownButton />
            </Select.Content>
          </Select>

          <Input
            size="$4"
            placeholder="Target"
            value={formState.target}
            onChangeText={(text) => handleInputChange('target', text)}
            style={{ flex: 1 }}
          />
        </XStack>

        {/* Project URL and Website */}
        <XStack space="$3">
          <YStack space="$1" style={{ flex: 1 }}>
            <SizableText size="$2" color="$gray10">Project URL</SizableText>
            <Input
              size="$4"
              value={formState.projectUrl}
              onChangeText={(text) => handleInputChange('projectUrl', text)}
            />
          </YStack>

          <YStack space="$1" style={{ flex: 1 }}>
            <SizableText size="$2" color="$gray10">Website</SizableText>
            <Input
              size="$4"
              value={formState.website}
              onChangeText={(text) => handleInputChange('website', text)}
            />
          </YStack>
        </XStack>

        {/* About Project */}
        <TextArea
          size="$4"
          placeholder="About Project"
          value={formState.aboutProject}
          onChangeText={(text) => handleInputChange('aboutProject', text)}
          numberOfLines={4}
          autoComplete="off"
        />

        {/* Receive Donations */}
        <XStack alignItems="center" space="$2">
          <Switch
            id="donations"
            size="$2"
            checked={formState.receivesDonations}
            onCheckedChange={(checked) => handleInputChange('receivesDonations', checked)}
          >
            <Switch.Thumb animation="quick" />
          </Switch>
          <Label htmlFor="donations" size="$3">
            Receive Donations
          </Label>
          <Info size={16} color="$gray10" />
        </XStack>

        {/* Project Location */}
        <YStack space="$3">
          <SizableText size="$3" color="$gray11">Project Location</SizableText>
          
          {/* Map Placeholder */}
          <View style={styles.mapPlaceholder}>
            {/* In a real app, you would integrate a map component here */}
          </View>

          {/* Latitude and Longitude */}
          <XStack space="$3">
            <Input
              size="$4"
              placeholder="Latitude"
              value={formState.location.latitude}
              onChangeText={(text) => handleLocationChange('latitude', text)}
              style={{ flex: 1 }}
            />
            <Input
              size="$4"
              placeholder="Longitude"
              value={formState.location.longitude}
              onChangeText={(text) => handleLocationChange('longitude', text)}
              style={{ flex: 1 }}
            />
          </XStack>
        </YStack>

        {/* Lodging Provision */}
        <XStack alignItems="center" space="$2">
          <Switch
            id="lodging"
            size="$2"
            checked={formState.providesLodging}
            onCheckedChange={(checked) => handleInputChange('providesLodging', checked)}
          >
            <Switch.Thumb animation="quick" />
          </Switch>
          <Label htmlFor="lodging" size="$3" style={{ flexShrink: 1, flex: 1 }}>
            I will provide lodging, site access and local transport if a reviewer is sent by Plant-for-the-Planet.
          </Label>
        </XStack>

        {/* Save & Continue Button */}
        <Button
          size="$5"
          theme="green"
          backgroundColor="#007A49"
          color="white"
          width={'100%'}
          onPress={handleSaveAndContinue}
          style={styles.saveButton}
        >
          Save & Continue
        </Button>
      </YStack>
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingBottom:20
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
  mapPlaceholder: {
    width: '100%',
    height: 300,
    backgroundColor: '#E5EEF1',
    borderRadius: 8,
  },
  saveButton: {
    marginTop: 20,
    alignSelf: 'flex-start',
    borderRadius: 25,
  }
});

export default CreateProject;