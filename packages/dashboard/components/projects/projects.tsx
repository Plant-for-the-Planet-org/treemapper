import React from 'react'
import { XStack, YStack } from 'tamagui'
import { ProjectDropDown } from './projectDropdown'

function ProjectDetails() {
  return (
    <YStack style={{ zIndex: 100 }}>
      <ProjectDropDown id="project-dropdown" />
    </YStack>
  )
}


export default ProjectDetails