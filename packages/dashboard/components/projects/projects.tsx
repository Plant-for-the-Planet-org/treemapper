import React from 'react'
import { XStack, YStack } from 'tamagui'
import { ProjectDropDown } from './projectDropdown'
import { SiteDropDown } from './siteDropwDown'

 function ProjectDetails() {
  return (
    <YStack space="$4" padding="$4" style={{ zIndex: 100 }}>
      <XStack 
        space="$4" 
        width="100%" 
        justifyContent="space-between"
      >
        <XStack f={1} maxWidth="48%">
          <ProjectDropDown id="project-dropdown" />
        </XStack>
        <XStack f={1} maxWidth="48%">
          <SiteDropDown id="site-dropdown" />
        </XStack>
      </XStack>
    </YStack>
  )
}


export default ProjectDetails