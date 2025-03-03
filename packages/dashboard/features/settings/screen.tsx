import React, { useState } from 'react';
import {
  YStack,
  XStack,
  Text,
  Input,
  Button,
  Separator,
  Card,
  Switch,
  ScrollView,
  Label,
  Select,
  Tag,
  Avatar,
  H2,
  H4,
  Paragraph,
  Dialog,
  Adapt,
  Sheet
} from 'tamagui';
import { 
  ChevronDown, 
  Edit3, 
  Save, 
  Trash2, 
  AlertTriangle,
  Image as ImageIcon,
  Check,
  X
} from '@tamagui/lucide-icons';

const sampleProject=    {
  "type": "Feature",
  "geometry": {
      "type": "Point",
      "coordinates": [
          -90.117655,
          18.639256
      ]
  },
  "properties": {
      "purpose": "trees",
      "id": "proj_k7iTUgJJ6tlA3XVVb0v4GEVP",
      "slug": "science-forest-planbe",
      "name": "Yucatan",
      "allowDonations": false,
      "country": "MX",
      "currency": "EUR",
      "image": "5ea184ca77735426645370.jpg",
      "unitCost": 9.0,
      "unit": "tree",
      "unitType": "tree",
      "unitsContributed": {
          "tree": 1804
      },
      "unitsTargeted": {
          "tree": 100000
      },
      "taxDeductionCountries": [
          "DE",
          "ES",
          "US"
      ],
      "isApproved": false,
      "isTopProject": false,
      "isFeatured": false,
      "metadata": {
          "acquisitionYear": 2020,
          "degradationCause": "Cattle grazing",
          "degradationYear": 0,
          "ecosystem": null,
          "employeesCount": 15,
          "enableInterventions": true,
          "firstTreePlanted": "2020-01-15 00:00:00",
          "location": "Yucatán, Mexico",
          "longTermPlan": null,
          "mainChallenge": "Survival of the tree, due to grazing of cows and sheep",
          "mainInterventions": null,
          "maxPlantingDensity": null,
          "motivation": "This ecosystem was chosen because of its high degradation conditions. It used to be grazing land with barely any trees. We wanted to establish a long-term experiment in order to test different methods to evaluate our restoration efforts.",
          "plantingDensity": null,
          "plantingSeasons": [
              6,
              7,
              8,
              9,
              10
          ],
          "siteOwnerName": "Ejido land of Constitucion",
          "siteOwnerType": [],
          "visitorAssistance": false,
          "yearAbandoned": 0
      },
      "tpo": {
          "id": "tpo_gEZeQNxNhxZZ54zvYzCofsCr",
          "name": "Plant-for-the-Planet",
          "email": "info@plant-for-the-planet.org",
          "address": {
              "address": "24658 Constitución",
              "city": "Campeche",
              "zipCode": "82449",
              "country": "MX"
          },
          "slug": "plant-for-the-planet"
      },
      "countTarget": 100000,
      "classification": "natural-regeneration",
      "countPlanted": 1804,
      "minTreeCount": 1,
      "location": "Yucatán, Mexico",
      "treeCost": 9.0,
      "paymentDefaults": {
          "fixedDefaultTreeCount": 1,
          "fixedTreeCountOptions": [
              1,
              1,
              1,
              1
          ]
      },
      "intensity": null,
      "revisionPeriodicityLevel": null
  }
}

// This component will display and let users edit project settings
const ProjectSettings = () => {

  // Initialize state with project data, ignoring the sites array as specified
  const project = sampleProject;
  const [formData, setFormData] = useState({
    name: project.properties.name,
    purpose: project.properties.purpose,
    country: project.properties.country,
    currency: project.properties.currency,
    unitCost: project.properties.unitCost,
    unit: project.properties.unit,
    unitType: project.properties.unitType,
    countTarget: project.properties.countTarget,
    countPlanted: project.properties.countPlanted,
    minTreeCount: project.properties.minTreeCount,
    location: project.properties.location,
    allowDonations: project.properties.allowDonations,
    classification: project.properties.classification,
    isApproved: project.properties.isApproved,
    isTopProject: project.properties.isTopProject,
    isFeatured: project.properties.isFeatured,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const onSave=()=>{}

  const onDelete=()=>{}
  // Handle input changes
  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = () => {
    // Create updated project data
    const updatedProject = {
      ...project,
      properties: {
        ...project.properties,
        ...formData,
      }
    };
    
    onSave(updatedProject);
    setIsEditing(false);
  };

  // Handle delete confirmation
  const handleDelete = () => {
    setShowDeleteConfirm(false);
    if (onDelete) {
      onDelete(project.properties.id);
    }
  };

  // Helper function to render read-only or editable field
  const renderField = (label, name, type = 'text', options = null) => {
    const value = formData[name];
    
    return (
      <YStack space="$2" marginBottom="$3">
        <Label htmlFor={name}>{label}</Label>
        {isEditing ? (
          type === 'switch' ? (
            <XStack alignItems="center" space="$2">
              <Switch
                id={name}
                checked={value}
                onCheckedChange={(checked) => handleChange(name, checked)}
                size="$4"
              >
                <Switch.Thumb animation="quick">
                  {value ? <Check size={16} color="white" /> : <X size={16} color="white" />}
                </Switch.Thumb>
              </Switch>
              <Text>{value ? 'Yes' : 'No'}</Text>
            </XStack>
          ) : type === 'select' && options ? (
            <Select
              id={name}
              value={value}
              onValueChange={(value) => handleChange(name, value)}
            >
              <Select.Trigger iconAfter={ChevronDown}>
                <Select.Value placeholder="Select option" />
              </Select.Trigger>
              <Select.Content>
                <Select.ScrollUpButton />
                <Select.Viewport>
                  {options.map((option) => (
                    <Select.Item key={option} value={option}>
                      <Select.ItemText>{option}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
                <Select.ScrollDownButton />
              </Select.Content>
            </Select>
          ) : type === 'number' ? (
            <Input
              id={name}
              value={value?.toString() || ''}
              keyboardType="numeric"
              onChangeText={(text) => handleChange(name, Number(text))}
            />
          ) : (
            <Input
              id={name}
              value={value?.toString() || ''}
              onChangeText={(text) => handleChange(name, text)}
            />
          )
        ) : (
          <Text>{type === 'switch' ? (value ? 'Yes' : 'No') : (value?.toString() || 'N/A')}</Text>
        )}
      </YStack>
    );
  };

  return (
    <ScrollView>
      <YStack padding="$4" space="$4">
        <XStack justifyContent="space-between" alignItems="center">
          <H2>{formData.name}</H2>
          <XStack space="$2">
            <Button
              icon={isEditing ? Save : Edit3}
              onPress={isEditing ? handleSubmit : () => setIsEditing(true)}
              theme={isEditing ? "green" : "blue"}
            >
              {isEditing ? 'Save' : 'Edit'}
            </Button>
          </XStack>
        </XStack>

        <YStack alignItems="center" marginVertical="$4">
          {true ? (
            <Avatar circular size="$12">
              <Avatar.Image src={'https://cdn.plant-for-the-planet.org/media/cache/project/medium/62e8de02a5211241832960.jpg'} />
              <Avatar.Fallback backgroundColor="$green8">
                <ImageIcon size={32} color="white" />
              </Avatar.Fallback>
            </Avatar>
          ) : (
            <Avatar circular size="$12" backgroundColor="$green8">
              <ImageIcon size={32} color="white" />
            </Avatar>
          )}
        </YStack>

        <Card>
          <Card.Header>
            <H4>Basic Information</H4>
          </Card.Header>
          <Card.Footer padding="$4">
            <YStack space="$4" width="100%">
              {renderField('Project Name', 'name')}
              {renderField('Purpose', 'purpose')}
              {renderField('Location', 'location')}
              {renderField('Country', 'country')}
              {renderField('Classification', 'classification')}
            </YStack>
          </Card.Footer>
        </Card>

        <Card>
          <Card.Header>
            <H4>Progress</H4>
          </Card.Header>
          <Card.Footer padding="$4">
            <YStack space="$4" width="100%">
              {renderField('Target Count', 'countTarget', 'number')}
              {renderField('Planted Count', 'countPlanted', 'number')}
              
              <YStack marginTop="$2">
                <Paragraph>Progress</Paragraph>
                <XStack height="$3" width="100%" backgroundColor="$gray5" borderRadius="$2">
                  <XStack 
                    height="100%" 
                    width={`${Math.min(100, (formData.countPlanted / formData.countTarget) * 100)}%`}
                    backgroundColor="$green9" 
                    borderRadius="$2"
                  />
                </XStack>
                <Text marginTop="$1" fontSize="$2">
                  {Math.round((formData.countPlanted / formData.countTarget) * 100)}% Complete
                </Text>
              </YStack>
            </YStack>
          </Card.Footer>
        </Card>

        <Card>
          <Card.Header>
            <H4>Location</H4>
          </Card.Header>
          <Card.Footer padding="$4">
            <YStack space="$2">
              <Paragraph>Coordinates:</Paragraph>
              <Text>Latitude: {project.geometry.coordinates[1]}</Text>
              <Text>Longitude: {project.geometry.coordinates[0]}</Text>
            </YStack>
          </Card.Footer>
        </Card>

        <Card theme="red">
          <Card.Header>
            <H4>Danger Zone</H4>
          </Card.Header>
          <Card.Footer padding="$4">
            <YStack space="$4" width="100%">
              <Paragraph>Permanently delete this project and all associated data. This action cannot be undone.</Paragraph>
              <Button 
                icon={Trash2} 
                theme="red" 
                onPress={() => setShowDeleteConfirm(true)}
              >
                Delete Project
              </Button>
            </YStack>
          </Card.Footer>
        </Card>
      </YStack>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <Adapt when="sm" platform="touch">
          <Sheet animation="quick" zIndex={200000} modal dismissOnSnapToBottom>
            <Sheet.Frame padding="$4">
              <Sheet.Handle />
              <Dialog.Title>
                <XStack alignItems="center" space="$2">
                  <AlertTriangle color="$red10" />
                  <Text fontSize="$6" fontWeight="bold">Delete Project</Text>
                </XStack>
              </Dialog.Title>
              <Dialog.Description>
                <Text>
                  Are you sure you want to delete "{project.properties.name}"? This action cannot be undone and all associated data will be permanently lost.
                </Text>
              </Dialog.Description>
              <XStack marginTop="$4" space="$3" justifyContent="flex-end">
                <Dialog.Close asChild>
                  <Button>Cancel</Button>
                </Dialog.Close>
                <Button theme="red" onPress={handleDelete}>
                  Delete
                </Button>
              </XStack>
            </Sheet.Frame>
            <Sheet.Overlay animation="quick" />
          </Sheet>
        </Adapt>

        <Dialog.Portal>
          <Dialog.Overlay
            key="overlay"
            animation="quick"
            opacity={0.5}
            backgroundColor="black"
          />
          <Dialog.Content
            bordered
            elevate
            key="content"
            animation={[
              'quick',
              {
                opacity: {
                  overshootClamping: true,
                },
              },
            ]}
            enterStyle={{ x: 0, y: -20, opacity: 0 }}
            exitStyle={{ x: 0, y: 10, opacity: 0 }}
            space
          >
            <Dialog.Title>
              <XStack alignItems="center" space="$2">
                <AlertTriangle color="$red10" />
                <Text fontSize="$6" fontWeight="bold">Delete Project</Text>
              </XStack>
            </Dialog.Title>
            <Dialog.Description>
              <Text>
                Are you sure you want to delete "{project.properties.name}"? This action cannot be undone and all associated data will be permanently lost.
              </Text>
            </Dialog.Description>
            <XStack marginTop="$4" space="$3" justifyContent="flex-end">
              <Dialog.Close asChild>
                <Button>Cancel</Button>
              </Dialog.Close>
              <Button theme="red" onPress={handleDelete}>
                Delete
              </Button>
            </XStack>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </ScrollView>
  );
};

export default ProjectSettings;