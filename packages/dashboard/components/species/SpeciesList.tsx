import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import {
  Text,
  YStack,
  XStack,
  ScrollView,
  Button,
  Image as TamaguiImage,
  Theme
} from "tamagui";
import { Leaf, Plus, Grid, List } from "@tamagui/lucide-icons";

// Get screen width for responsive grid
const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // Two columns with padding

// Type for species data
type Species = {
  id: string;
  scientificName: string;
  scientificSpecies: string;
  aliases?: string;
  image?: string | null;
  description?: string | null;
};

const speciesData: Species[] = [{
  "id": "spec_85e7wrxpacKX",
  "scientificName": "Leucaena leucocephala",
  "scientificSpecies": "sspec_dReK4W4J0eg2Y51tJo",
  "aliases": "Waaxiin R",
  "image": null,
  "description": null
},
{
  "id": "spec_y8SFXXL8P64a",
  "scientificName": "Tabebuia rosea",
  "scientificSpecies": "sspec_H5XCfaAK83gZUB1ShS",
  "aliases": "Maculis R",
  "image": null,
  "description": null
},
{
  "id": "spec_2yRlC36CDXsW",
  "scientificName": "Gliricidia sepium",
  "scientificSpecies": "sspec_hheb78YuYGRd13kt3m",
  "aliases": "Madre cacao R",
  "image": null,
  "description": null
},
{
  "id": "spec_1hjwvlawC9ZH",
  "scientificName": "Swietenia macrophylla",
  "scientificSpecies": "sspec_84RXrzCCl2wn6YpqIK",
  "aliases": "Caoba",
  "image": null,
  "description": null
},
{
  "id": "spec_eWMwB8Y0tSqp",
  "scientificName": "Cedrela odorata",
  "scientificSpecies": "sspec_JniRsiRPL6rLO76P8F",
  "aliases": "Cedro",
  "image": null,
  "description": null
},
{
  "id": "spec_HUV8bBYxMHwD",
  "scientificName": "Lonchocarpus longistylus",
  "scientificSpecies": "sspec_Qtuc2SkVJ2XKImsflA",
  "aliases": "Balché",
  "image": null,
  "description": null
},
{
  "id": "spec_K2bFG0YQDkil",
  "scientificName": "Brosimum alicastrum",
  "scientificSpecies": "sspec_65LFSPmB75NPOdFF7S",
  "aliases": "Ramón",
  "image": null,
  "description": null
},
{
  "id": "spec_8PohWxX5BABn",
  "scientificName": "Enterolobium cyclocarpum",
  "scientificSpecies": "sspec_3lK3GNaIbWrBpdlTzZ",
  "aliases": "Pich",
  "image": null,
  "description": null
},
{
  "id": "spec_Q4WR2D6h0wV4",
  "scientificName": "Caesalpinia mollis",
  "scientificSpecies": "sspec_0l6j7n9IoqzkbcQ457",
  "aliases": "Chacté viga",
  "image": null,
  "description": null
},
{
  "id": "spec_ktiSoCxfQBfJ",
  "scientificName": "Bursera simaruba",
  "scientificSpecies": "sspec_JCaCgWEehFnSExUBrF",
  "aliases": "Chakaj",
  "image": null,
  "description": null
},
{
  "id": "spec_L2Q2K9wHw4B3",
  "scientificName": "Havardia albicans",
  "scientificSpecies": "sspec_260wwkfFePGAI3mpq6",
  "aliases": "Chukum R",
  "image": null,
  "description": null
},
{
  "id": "spec_t4jasMthawQA",
  "scientificName": "Crescentia cujete",
  "scientificSpecies": "sspec_EyoXO8j6ABRVkRIc8Q",
  "aliases": "Jicara R",
  "image": null,
  "description": null
},
{
  "id": "spec_qySQNE7UMTSy",
  "scientificName": "Haematoxylum campechianum",
  "scientificSpecies": "sspec_cyNdj1GkQPDzpHtMDe",
  "aliases": "Tinto R",
  "image": null,
  "description": null
},
{
  "id": "spec_0JDPo4LKP4UF",
  "scientificName": "Simarouba glauca",
  "scientificSpecies": "sspec_4eZh9gUX1uDyxcfIn2",
  "aliases": "Negrito",
  "image": null,
  "description": null
},
{
  "id": "spec_BGNH8F4kOCyg",
  "scientificName": "Luehea speciosa",
  "scientificSpecies": "sspec_s5UnMi47HtWF3e1h8p",
  "aliases": "Algodoncillo",
  "image": null,
  "description": null
},
{
  "id": "spec_zqVTsH0XBco1",
  "scientificName": "Manilkara zapota",
  "scientificSpecies": "sspec_cG2XYlQWjiHOPKwOYq",
  "aliases": "Zapote R",
  "image": null,
  "description": null
},
{
  "id": "spec_npw1Ra8q6ZUM",
  "scientificName": "Ceiba pentandra",
  "scientificSpecies": "sspec_bjIm5cWyNqEmEkx0Ru",
  "aliases": "Ceiba pentandra R",
  "image": null,
  "description": null
},
{
  "id": "spec_PVxNxMONrgmG",
  "scientificName": "Guazuma ulmifolia",
  "scientificSpecies": "sspec_sB8hEN129P1OTKPQMh",
  "aliases": "Pixoy R",
  "image": null,
  "description": "Pixoy R"
},
{
  "id": "spec_GhPGYMFf307y",
  "scientificName": "Cordia dodecandra",
  "scientificSpecies": "sspec_0js3CX7f970bwh05mT",
  "aliases": "Ciricote R",
  "image": null,
  "description": null
},
{
  "id": "spec_cNvbhHlgfyKd",
  "scientificName": "Pinus patula",
  "scientificSpecies": "sspec_P4rUatwzm0UDqhVuXt",
  "aliases": "Pinus patula",
  "image": null,
  "description": null
},
{
  "id": "spec_t0TZeEcHZm1Z",
  "scientificName": "Handroanthus chrysanthus",
  "scientificSpecies": "sspec_sjSSY7pV1EHhnH8vIF",
  "aliases": "Guayacán",
  "image": null,
  "description": "Guayacán"
},
{
  "id": "spec_EYvU1xXa19rS",
  "scientificName": "Trichilia hirta",
  "scientificSpecies": "sspec_A4BiIbrRj1PL00HH9o",
  "aliases": "Quiebra hacha",
  "image": null,
  "description": null
},
{
  "id": "spec_vOANxrgLBDIO",
  "scientificName": "Handroanthus serratifolius",
  "scientificSpecies": "sspec_TXLobcLHQNtD4LLLaN",
  "aliases": "Handroanthus serratifolius",
  "image": null,
  "description": null
},
{
  "id": "spec_uKpDA8Qzhz5V",
  "scientificName": "Senna racemosa",
  "scientificSpecies": "sspec_ipl1vnpNVv01L2xhjW",
  "aliases": "K'aan Jabin",
  "image": null,
  "description": null
},
{
  "id": "spec_SF2qJo5cxbqN",
  "scientificName": "Capsicum caatingae",
  "scientificSpecies": "sspec_Hx62Z0VlTgxT31TChZ",
  "aliases": "Capsicum caatingae",
  "image": null,
  "description": null
},
{
  "id": "spec_r79A0Pi1dOAe",
  "scientificName": "Pinus hartwegii",
  "scientificSpecies": "sspec_l0fAevrpwb042IDnRb",
  "aliases": "Ocoto",
  "image": null,
  "description": null
},
{
  "id": "spec_qpD0ILo3bIkO",
  "scientificName": "Ceiba acuminata",
  "scientificSpecies": "sspec_bMX7Tib4gf3o43QrTD",
  "aliases": "Ceiba acuminata",
  "image": null,
  "description": null
},
{
  "id": "spec_yZ0S0brAeRqB",
  "scientificName": "Lonchocarpus rugosus",
  "scientificSpecies": "sspec_t63hidPTQs4DQkd8J4",
  "aliases": "Kanasin",
  "image": null,
  "description": null
},
{
  "id": "spec_W6E8jHRogkAk",
  "scientificName": "Cedrela balansae",
  "scientificSpecies": "sspec_P5PeBBRTlXsWasdazw",
  "aliases": "Cedrela balansae",
  "image": null,
  "description": null
},
{
  "id": "spec_WYRt5GAyZsO1",
  "scientificName": "Piscidia piscipula",
  "scientificSpecies": "sspec_uZ3yclQltn3eUYh1ZG",
  "aliases": "Piscidia piscipula",
  "image": null,
  "description": null
},
{
  "id": "spec_AuRtdtLLJAZ9",
  "scientificName": "Swietenia humilis",
  "scientificSpecies": "sspec_Q0E5yvyIs4esFrNvTC",
  "aliases": "Caobilla",
  "image": null,
  "description": null
},
{
  "id": "spec_5gwesLwWPasf",
  "scientificName": "Pinus montezumae",
  "scientificSpecies": "sspec_6hClF79lscmjyCj59X",
  "aliases": "Ya áx kin ché",
  "image": null,
  "description": null
},
{
  "id": "spec_VsbjtoIXHSyt",
  "scientificName": "Pinus pseudostrobus",
  "scientificSpecies": "sspec_hSdFJPWM6u63O6jPWL",
  "aliases": "Pinus pseudostrobus",
  "image": null,
  "description": null
},
{
  "id": "spec_TehoWg0PXsmO",
  "scientificName": "Pinus rudis",
  "scientificSpecies": "sspec_ds8bU9JmNSIUuhQyi7",
  "aliases": "Pinus rudis",
  "image": null,
  "description": null
},
{
  "id": "spec_8bL6zXQ78i6D",
  "scientificName": "Abies religiosa",
  "scientificSpecies": "sspec_Eu6gRe0UTMr65PbC45",
  "aliases": "Abies religiosa",
  "image": null,
  "description": null
},
{
  "id": "spec_HavKlFtI5myo",
  "scientificName": "Annona acuminata",
  "scientificSpecies": "sspec_PaBt0EVAx3QbVTSGdp",
  "aliases": "Annona acuminata",
  "image": null,
  "description": null
},
{
  "id": "spec_t06RVQTKjifB",
  "scientificName": "Annona reticulata",
  "scientificSpecies": "sspec_MNzAaVN5x04s4OYeWe",
  "aliases": "Annona reticulata",
  "image": null,
  "description": null
},
{
  "id": "spec_W0u1CisizyTl",
  "scientificName": "Caesalpinia vesicaria",
  "scientificSpecies": "sspec_N7Fj1uRzEfXbsSY3B9",
  "aliases": "Fierrillo",
  "image": null,
  "description": null
},
{
  "id": "spec_AtACUvOwXFlO",
  "scientificName": "Pinus pinea",
  "scientificSpecies": "sspec_7P2REhC3lpCX10q0F4",
  "aliases": "Pinus pinea",
  "image": null,
  "description": null
},
{
  "id": "spec_JzXtTZgi3o1g",
  "scientificName": "Pinus attenuata",
  "scientificSpecies": "sspec_1VpYRFNmSZccnzfQS2",
  "aliases": "Pinus attenuata",
  "image": null,
  "description": null
}
];

function SpeciesGridList() {
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');

  return (
    <YStack f={1}>
      {/* View toggle buttons at the top */}
      <XStack justifyContent="flex-end" marginBottom="$4" space="$2">
        <Button
          size="$2"
          variant="outlined"
          borderColor="$gray6"
          backgroundColor={viewMode === 'grid' ? '$gray1' : 'transparent'}
          icon={<Grid size={16} color={viewMode === 'grid' ? '$green9' : '$gray10'} />}
          onPress={() => setViewMode('grid')}
          pressStyle={{ backgroundColor: '$gray2' }}
        />

        <Button
          size="$2"
          variant="outlined"
          borderColor="$gray6"
          backgroundColor={viewMode === 'list' ? '$gray1' : 'transparent'}
          icon={<List size={16} color={viewMode === 'list' ? '$green9' : '$gray10'} />}
          onPress={() => setViewMode('list')}
          pressStyle={{ backgroundColor: '$gray2' }}
        />
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {viewMode === 'grid' ? (
          // Grid View
          <View style={styles.gridContainer}>
            {speciesData.map((species) => (
              <TouchableOpacity
                key={species.id}
                style={styles.gridCard}
                activeOpacity={0.7}
              >
                <View style={styles.gridImageContainer}>
                  {species.image ? (
                    <TamaguiImage
                      source={{ uri: species.image }}
                      width="100%"
                      height={110}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.gridPlaceholder}>
                      <Leaf size={32} color="#006838" />
                    </View>
                  )}
                </View>

                <YStack padding="$3" space="$1">
                  <Text
                    fontSize="$3"
                    fontWeight="bold"
                    color="$gray12"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {species.scientificName}
                  </Text>

                  {species.aliases && (
                    <Text
                      fontSize="$2"
                      color="$gray11"
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {species.aliases}
                    </Text>
                  )}
                </YStack>
              </TouchableOpacity>
            ))}

            {/* If odd number of items, add an empty view to maintain grid layout */}
            {speciesData.length % 2 !== 0 && (
              <View style={[styles.gridCard, { backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0 }]} />
            )}
          </View>
        ) : (
          // List View
          <YStack space="$3" pb="$6">
            {speciesData.map((species) => (
              <TouchableOpacity
                key={species.id}
                style={styles.listCard}
                activeOpacity={0.7}
              >
                <XStack alignItems="center" space="$3">
                  <View style={styles.listImageContainer}>
                    {species.image ? (
                      <TamaguiImage
                        source={{ uri: species.image }}
                        width={50}
                        height={50}
                        borderRadius={25}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.listPlaceholder}>
                        <Leaf size={20} color="#006838" />
                      </View>
                    )}
                  </View>

                  <YStack flex={1}>
                    <Text fontSize="$4" fontWeight="bold" color="$gray12">
                      {species.scientificName}
                    </Text>

                    {species.aliases && (
                      <Text fontSize="$2" color="$gray11">
                        {species.aliases}
                      </Text>
                    )}
                  </YStack>
                </XStack>
              </TouchableOpacity>
            ))}
          </YStack>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
      <View style={styles.fabContainer}>
          <TouchableOpacity 
            style={styles.fab}
            activeOpacity={0.8}
          >
            <Plus size={24} color="white" />
          </TouchableOpacity>
        </View>
    </YStack>
  );
}

// Styles using React Native StyleSheet
const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: cardWidth,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  gridImageContainer: {
    width: '100%',
    height: 110,
    backgroundColor: '#E8F5E9',
  },
  gridPlaceholder: {
    width: '100%',
    height: 110,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  listImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  listPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabContainer: {
    position: 'absolute',
    right: 50,
    top: '12%',
  },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007A49',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 999,
  }
});

export default SpeciesGridList;