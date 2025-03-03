import React, { useState } from "react";
import { View, Image, TouchableOpacity, StyleSheet } from "react-native";
import { 
  Card, 
  CardHeader, 
  CardFooter, 
  Text, 
  YStack, 
  XStack, 
  Button,
  Avatar,
  Separator,
  ScrollView,
  H4,
  Paragraph,
  Theme
} from "tamagui";
import { MapPin, Calendar, Layers, ArrowRight, Plus, Trees } from "@tamagui/lucide-icons";

// Using the structure from your sample data but adding fields from the document
type Site = {
  id: string | number;
  name: string;
  description?: string;
  area?: number;
  status?: string;
  imageUrl?: string;
  createdAt?: string;
};

// Function to format date strings nicely
const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

// Default image to use when no image URL is provided
const DEFAULT_SITE_IMAGE = "https://plus.unsplash.com/premium_photo-1664123873245-bd178d77ca19?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

// Sample data combining your structure with fields from the document
const siteData: Site[] = [
  {
    id: "site_aufcHOggZ6setis",
    name: "Research Forest PlanBe - Las Américas F5",
    description: "This new planting area, newly established in 2020, is not only intended to mitigate the effects of the climate crisis...",
    area: 15.8,
    status: "planting",
    imageUrl: "https://source.unsplash.com/400x300/?forest,research",
    createdAt: "2020-01-15",
  },
  {
    id: 2,
    name: "Blue Lake Conservation Area",
    description: "A protected wetland ecosystem with diverse flora and fauna...",
    area: 250,
    status: "active",
    imageUrl: "https://source.unsplash.com/400x300/?lake,conservation",
    createdAt: "2023-11-10",
  },
];

function SiteCardList() {
  return (
    <Theme name="light">
      <YStack f={1} padding="$1" space="$4">
        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          <YStack space="$4" pb="$20">
            {siteData.map((site) => (
              <Card 
                key={site.id} 
                elevation="$4"
                scale={0.97}
                hoverStyle={{ scale: 0.99 }}
                pressStyle={{ scale: 0.96 }}
                animation="bouncy" 
                backgroundColor="$background"
                borderRadius="$4"
                overflow="hidden"
                bordered
              >
                {false ? (
                  <Image
                    source={{ uri: site.imageUrl }}
                    style={{ width: "100%", height: 160, borderTopLeftRadius: 10, borderTopRightRadius: 10 }}
                    resizeMode="cover"
                    onError={(e) => console.log("Image failed to load:", e.nativeEvent.error)}
                  />
                ) : (
                  <XStack
                    backgroundColor="$gray4"
                    width="100%"
                    height={160}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Trees size={48} color="$gray9" />
                    <Image
                      source={{ uri: DEFAULT_SITE_IMAGE }}
                      style={{ 
                        position: "absolute", 
                        width: "100%", 
                        height: "100%",
                        opacity: 0.7,
                        borderTopLeftRadius: 10, 
                        borderTopRightRadius: 10
                      }}
                      resizeMode="cover"
                    />
                  </XStack>
                )}
                
                {site.status && (
                  <XStack 
                    backgroundColor={site.status === "planting" ? "$green8" : "$blue8"}
                    position="absolute"
                    top="$3"
                    right="$3"
                    borderRadius="$4"
                    paddingHorizontal="$2"
                    paddingVertical="$1"
                    opacity={0.9}
                  >
                    <Text color="white" fontWeight="bold" fontSize="$2" textTransform="capitalize">
                      {site.status}
                    </Text>
                  </XStack>
                )}
                
                <YStack padding="$4" space="$2">
                  <Text fontSize="$6" fontWeight="bold" numberOfLines={1} ellipsizeMode="tail">
                    {site.name}
                  </Text>
                  
                  {site.description && (
                    <Paragraph 
                      color="$gray11" 
                      numberOfLines={2} 
                      ellipsizeMode="tail"
                      marginTop="$1"
                      marginBottom="$2"
                    >
                      {site.description}
                    </Paragraph>
                  )}
                  
                  <Separator marginVertical="$2" />
                  
                  <XStack justifyContent="space-between" alignItems="center">
                    <XStack space="$4">
                      {site.area && (
                        <XStack space="$1" alignItems="center">
                          <Layers size={16} color="$gray10" />
                          <Text fontSize="$3" color="$gray10">
                            {site.area} ha
                          </Text>
                        </XStack>
                      )}
                      
                      {site.createdAt && (
                        <XStack space="$1" alignItems="center">
                          <Calendar size={16} color="$gray10" />
                          <Text fontSize="$3" color="$gray10">
                            {formatDate(site.createdAt)}
                          </Text>
                        </XStack>
                      )}
                    </XStack>
                    
                    <Button 
                      size="$2" 
                      backgroundColor="$gray2" 
                      borderColor="$gray5"
                      borderWidth={1}
                      icon={ArrowRight}
                    >
                      Details
                    </Button>
                  </XStack>
                </YStack>
              </Card>
            ))}
          </YStack>
        </ScrollView>
      </YStack>
    </Theme>
  );
}

export default SiteCardList;