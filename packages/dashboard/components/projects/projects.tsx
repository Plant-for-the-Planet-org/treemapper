import React from 'react'
import { XStack, YStack } from 'tamagui'
import { ProjectDropDown } from './projectDropdown'

 function ProjectDetails() {
  return (
    <YStack space="$4" padding="$4" style={{ zIndex: 100 }}>
      <XStack 
        space="$4" 
        width="100%" 
        justifyContent="space-between"
      >
        <XStack f={1} maxWidth="60%">
          <ProjectDropDown id="project-dropdown" />
        </XStack>
      </XStack>
    </YStack>
  )
}


export default ProjectDetails