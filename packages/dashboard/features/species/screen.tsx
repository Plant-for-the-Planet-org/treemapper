import React from "react";
import { ScrollView, YStack } from "tamagui";
import CreateNewSiteButton from "../../components/sites/CreateSiteButton";
import SiteCardList from "../../components/sites/SiteCard";
import SpeciesList from "../../components/species/SpeciesList";

export default function SpeciesScreen() {
  return (
    <YStack f={1}>
      <SpeciesList />
    </YStack>
  );
}
