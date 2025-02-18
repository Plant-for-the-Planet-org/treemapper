import React from "react";
import { View, Image } from "react-native";
import { Card, CardHeader, CardFooter, Text, YStack, XStack } from "tamagui";

type Site = {
  id: number;
  name: string;
  area: number;
  imageUrl: string;
  createdAt: string;
};

const siteData: Site[] = [
  {
    id: 1,
    name: "Greenfield Park",
    area: 120,
    imageUrl: "https://source.unsplash.com/400x300/?nature,park",
    createdAt: "2024-02-18",
  },
  {
    id: 2,
    name: "Blue Lake",
    area: 250,
    imageUrl: "https://source.unsplash.com/400x300/?lake,water",
    createdAt: "2023-11-10",
  },
];

function SiteCardList() {
  return (
    <YStack space="$4" padding="$1">
      {siteData.map((site) => (
        <Card key={site.id} bordered elevate size="$2" backgroundColor="$gray2">
          <CardHeader>
            <Image
              source={{ uri: site.imageUrl }}
              style={{ width: "100%", height: 100, borderRadius: 10 }}
              resizeMode="cover"
            />
          </CardHeader>
          <YStack padding="$3">
            <Text fontSize="$6" fontWeight="bold">
              {site.name}
            </Text>
            <XStack space="$2">
              <Text fontSize="$4" color="$gray10">
                Area: {site.area} ha
              </Text>
            </XStack>
            <Text fontSize="$4" color="$gray10">
              Created: {site.createdAt}
            </Text>
          </YStack>
        </Card>
      ))}
    </YStack>
  );
}

export default SiteCardList;