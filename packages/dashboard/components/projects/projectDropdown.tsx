import React, { useEffect, useState } from 'react'
import type { SelectProps } from 'tamagui'
import { Adapt, Label, Select, Sheet, XStack, YStack, Image, Separator, View } from 'tamagui'
import { LinearGradient } from 'tamagui/linear-gradient'
import { styled } from 'tamagui'
import CreateNewProject from './CreateNewProject'

const Check = require('../../../public/images/check.png')
const ChevronUp = require('../../../public/images/chevron-up.png')
const ChevronDown = require('../../../public/images/chevron-down.png')

// Custom styled components
const StyledTrigger = styled(Select.Trigger, {
  backgroundColor: '$background',
  borderWidth: 1,
  borderColor: '$borderColor',
  borderRadius: '$8',
  paddingVertical: '$3',
  paddingHorizontal: '$4',
  shadowColor: '$shadowColor',
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 4,
  hoverStyle: {
    backgroundColor: '$backgroundHover',
    borderColor: '$borderColorHover',
  },
})

const StyledItem = styled(Select.Item, {
  paddingVertical: '$3',
  paddingHorizontal: '$4',
  marginVertical: '$1',
  borderRadius: '$4',
  backgroundColor: 'transparent',
  hoverStyle: {
    backgroundColor: '$backgroundHover',
  },
})

const StyledLabel = styled(Label, {
  color: '$textSecondary',
  fontSize: '$3',
  fontWeight: '500',
})

export function SelectDemo() {
  return (
    <YStack gap="$6" padding="$4">
      <XStack ai="center" gap="$4">
        <StyledLabel htmlFor="select-demo-1" f={1} miw={80}>
          Custom Select
        </StyledLabel>
        <ProjectDropDown id="select-demo-1" />
      </XStack>

      <XStack ai="center" gap="$4">
        <StyledLabel htmlFor="select-demo-2" f={1} miw={80}>
          Native Select
        </StyledLabel>
        <ProjectDropDown id="select-demo-2" native />
      </XStack>
    </YStack>
  )
}

export function ProjectDropDown(props: SelectProps) {
  const [val, setVal] = React.useState('yucatan-restoration')
  
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    // Your data fetching logic here
  }
  
  return (
    <Select 
      value={val} 
      onValueChange={setVal} 
      disablePreventBodyScroll 
      {...props}
    >
      <StyledTrigger 
        width={220} 
        elevation={2}
        iconAfter={() => (
          <Image 
            src={ChevronDown} 
            size={16} 
            opacity={0.6}
            enterStyle={{ rotate: '0deg' }}
            exitStyle={{ rotate: '180deg' }}
          />
        )}
      >
        <Select.Value 
          placeholder="Select a project" 
          fontSize="$4"
          color="$text"
        />
      </StyledTrigger>

      <Adapt when="sm" platform="touch">
        <Sheet 
          native={!!props.native} 
          modal 
          dismissOnSnapToBottom 
          animation="quick"
          zIndex={200000}
          handlePosition="inside"
          snapPoints={[40]} // 40% of the screen height
        >
          <Sheet.Frame>
            <YStack height="100%" padding="$0">
              {/* Project list in ScrollView */}
              <Sheet.ScrollView>
                <YStack padding="$3">
                  <Adapt.Contents />
                </YStack>
              </Sheet.ScrollView>
              
              {/* Button fixed at bottom */}
              <YStack padding="$3" marginBottom="$5">
                <CreateNewProject />
              </YStack>
            </YStack>
          </Sheet.Frame>
          <Sheet.Overlay 
            backgroundColor="$shadowColor" 
            opacity={0.5}
            animation="quick"
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />
        </Sheet>
      </Adapt>

      <Select.Content 
        zIndex={200000}
        backgroundColor="$background"
        borderRadius="$4"
        elevation={6}
        bordered
        animation="quick"
        maxHeight="40vh"
      >
        <Select.ScrollUpButton
          alignItems="center"
          justifyContent="center"
          position="relative"
          width="100%"
          height="$3"
        >
          <YStack zIndex={10}>
            <Image 
              src={ChevronUp} 
              size={16}
              opacity={0.6} 
            />
          </YStack>
          <LinearGradient
            start={[0, 0]}
            end={[0, 1]}
            fullscreen
            colors={['$background', 'transparent']}
            borderRadius="$4"
          />
        </Select.ScrollUpButton>

        <Select.Viewport
          animation="quick"
          animateOnly={['transform', 'opacity']}
          enterStyle={{ opacity: 0, y: -10 }}
          exitStyle={{ opacity: 0, y: 10 }}
        >
          {/* Regular items first */}
          <Select.Group>
            {React.useMemo(
              () =>
                items.map((item, i) => (
                  <StyledItem
                    index={i}
                    key={item.name}
                    value={item.value}
                  >
                    <Select.ItemText>{item.name}</Select.ItemText>
                    <Select.ItemIndicator marginLeft="auto">
                      <Image 
                        src={Check} 
                        size={16}
                      />
                    </Select.ItemIndicator>
                  </StyledItem>
                )),
              [items]
            )}
          </Select.Group>
          
          <Separator marginVertical="$3" />
          

          {props.native && (
            <YStack
              position="absolute"
              right={0}
              top={0}
              bottom={0}
              alignItems="center"
              justifyContent="center"
              width="$4"
              pointerEvents="none"
            >
              <Image 
                src={ChevronDown} 
                size={16}
                opacity={0.6}
              />
            </YStack>
          )}
        </Select.Viewport>

        <Select.ScrollDownButton
          alignItems="center"
          justifyContent="center"
          position="relative"
          width="100%"
          height="$3"
          opacity={0.8}
        >
          <YStack zIndex={10}>
            <Image 
              src={ChevronDown} 
              size={16}
              opacity={0.6}
            />
          </YStack>
          <LinearGradient
            start={[0, 0]}
            end={[0, 1]}
            fullscreen
            colors={['transparent', '$background']}
            borderRadius="$4"
          />
        </Select.ScrollDownButton>
      </Select.Content>
    </Select>
  )
}

// Updated sample items
const items = [
  { name: 'Yucatan Restoration', value: 'yucatan-restoration' },
  { name: 'Amazon Rainforest', value: 'amazon-rainforest' },
  { name: 'Congo Basin', value: 'congo-basin' },
  { name: 'Great Bear Rainforest', value: 'great-bear-rainforest' },
  { name: 'Borneo Rainforest', value: 'borneo-rainforest' },
]