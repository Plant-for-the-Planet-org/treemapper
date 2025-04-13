import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import {
  Input,
  Button,
  Select,
  YStack,
  XStack,
  Text,
  Card,
  SizableText
} from 'tamagui';
import { ArrowLeft, ChevronDown, Trash2, Edit3, Plus, Minus } from '@tamagui/lucide-icons';
import { useRouter } from 'solito/navigation';

const ProjectSiteForm = () => {
  const router = useRouter();
  const [siteName, setSiteName] = useState('Research Forest PlanBe - Las Américas F5');
  const [siteStatus, setSiteStatus] = useState('Planting');
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [mapImage, setMapImage] = useState(null); // For demonstration. In real app, would connect to map API

  // Array of status options to display in dropdown
  const statusOptions = ['Planting', 'Planted', 'Barren', 'Reforestation'];

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  // Handle save and continue
  const handleSaveAndContinue = () => {
    console.log('Saving site data:', { siteName, siteStatus });
    // Navigate to next screen or submit data
  };

  // Handle skip
  const handleSkip = () => {
    console.log('Skipping site creation');
    // Navigate to next screen
  };

  // Handle save and add another site
  const handleSaveAndAddAnother = () => {
    console.log('Saving current site and adding another');
    // Logic to save current site and reset form for a new one
  };

  // Handle file drop (mock implementation)
  const handleFileDrop = () => {
    alert('File upload functionality would be implemented here');
    // In a real implementation, would handle file selection and upload
  };

  return (
    <View style={styles.container}>
      {/* Main content */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text fontSize="$6" fontWeight="bold">Create site</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Site Image/Map Preview Card */}


        {/* Form Fields */}
        <YStack space="$4" padding="$4">
          <View style={styles.selectContainer}>
            <SizableText size="$2" color="$gray10" style={styles.selectLabel}>
              Site Name
            </SizableText>
            <Input
              size="$4"
              placeholder="Site Name"
              value={siteName}
              onChangeText={setSiteName}
            />
          </View>
          {/* Site Name Input */}


          {/* Site Status Dropdown */}
          <View style={styles.selectContainer}>
            <SizableText size="$2" color="$gray10" style={styles.selectLabel}>
              Site Status
            </SizableText>
            <TouchableOpacity
              style={styles.customSelect}
              onPress={() => setIsStatusOpen(!isStatusOpen)}
            >
              <Text>{siteStatus}</Text>
              <ChevronDown size={20} color="#000" />
            </TouchableOpacity>

            {/* Dropdown options */}
            {isStatusOpen && (
              <Card style={styles.dropdownMenu}>
                {statusOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSiteStatus(option);
                      setIsStatusOpen(false);
                    }}
                  >
                    <Text>{option}</Text>
                  </TouchableOpacity>
                ))}
              </Card>
            )}
          </View>

          {/* Map Component */}
          <View style={styles.mapContainer}>
            {/* In a real app, you would integrate an actual map component here */}
            <View style={styles.mapPlaceholder} />

            {/* Map Controls */}
            <View style={styles.mapControls}>
              <TouchableOpacity style={styles.mapControlButton}>
                <Plus size={18} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.mapControlButton}>
                <Minus size={18} color="#000" />
              </TouchableOpacity>
            </View>
          </View>

          {/* File Drop Area */}
          <TouchableOpacity
            style={styles.fileDropArea}
            onPress={handleFileDrop}
          >
            <Text style={styles.fileDropText}>Upload .geojson or .kml</Text>
          </TouchableOpacity>
        </YStack>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.actionButtonsRow}>
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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContainer: {
    flex: 1,
  },
  mapPreviewCard: {
    width: '100%',
    height: 200,
    position: 'relative',
    overflow: 'hidden',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  badgeContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  actionButtonsContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
  },
  iconButton: {
    backgroundColor: 'white',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  siteTitleContainer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
  },
  siteTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  selectContainer: {
    position: 'relative',
    zIndex: 100
  },
  selectLabel: {
    marginBottom: 4,
  },
  customSelect: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  mapContainer: {
    height: 380,
    position: 'relative',
    marginTop: 20,
  },
  mapPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5EEF1',
    borderRadius: 8,
  },
  mapControls: {
    position: 'absolute',
    right: 10,
    bottom: 60,
    zIndex: 10,
  },
  mapControlButton: {
    width: 32,
    height: 32,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  fileDropArea: {
    width: '100%',
    height: 80,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#ccc',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
  fileDropText: {
    color: '#666',
  },
  addAnotherLink: {
    alignSelf: 'flex-start',
  },
  addAnotherText: {
    color: '#7BC043',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    marginBottom: 20,
    borderTopColor: '#eee',
  },
  saveButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  skipButton: {
    flex: 0.6,
    marginLeft: 8,
  },
});

export default ProjectSiteForm;