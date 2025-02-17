import React, { useState } from 'react'
import {
  Button,
  Card,
  CardHeader,
  H6,
  YStack,
  XStack,
  Input,
  Text,
  Paragraph,
  Select,
  Adapt,
  Sheet,
  ScrollView,
} from 'tamagui'
import { Users, Mail, UserPlus } from '@tamagui/lucide-icons'

interface InviteMemberProps {
  onInvite?: (email: string, role: string) => void
}

export default function InviteMember({ onInvite }: InviteMemberProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  
  const handleInvite = () => {
    if (email && role) {
      onInvite?.(email, role)
      setEmail('')
    }
  }

  return (
    <Card size="$4" bordered>
      <CardHeader padded>
        <XStack space="$2" alignItems="center">
          <Users size={20} color="$gray11" />
          <H6>Invite Members to the Project</H6>
        </XStack>
        <Paragraph size="$2" color="$gray11" marginTop="$2">
          Add team members to collaborate on this project
        </Paragraph>
      </CardHeader>

      <YStack padding="$4" space="$4">
        <YStack space="$2">
          <Text color="$gray11" fontSize="$3">
            Email Address
          </Text>
          <XStack alignItems="center" space="$2">
            <Input
              flex={1}
              size="$4"
              placeholder="Enter email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              icon={Mail}
            />
          </XStack>
        </YStack>

        <YStack space="$2">
          <Text color="$gray11" fontSize="$3">
            Role
          </Text>
          <Select id="role" value={role} onValueChange={setRole}>
            <Select.Trigger width="100%" size="$4" iconAfter={Users}>
              <Select.Value placeholder="Select a role" />
            </Select.Trigger>

            <Adapt when="sm" platform="touch">
              <Sheet modal dismissOnSnapToBottom>
                <Sheet.Frame>
                  <Sheet.ScrollView>
                    <Adapt.Contents />
                  </Sheet.ScrollView>
                </Sheet.Frame>
                <Sheet.Overlay />
              </Sheet>
            </Adapt>

            <Select.Content>
              <Select.ScrollUpButton />
              <Select.Viewport minWidth={200}>
                <Select.Group>
                  <Select.Item index={0} value="admin">
                    <Select.ItemText>Admin</Select.ItemText>
                  </Select.Item>
                  <Select.Item index={1} value="member">
                    <Select.ItemText>Member</Select.ItemText>
                  </Select.Item>
                  <Select.Item index={2} value="viewer">
                    <Select.ItemText>Viewer</Select.ItemText>
                  </Select.Item>
                </Select.Group>
              </Select.Viewport>
              <Select.ScrollDownButton />
            </Select.Content>
          </Select>
        </YStack>

        <Button
          size="$4"
          themeInverse
          onPress={handleInvite}
          disabled={!email}
          pressStyle={{ scale: 0.97 }}
          icon={UserPlus}
        >
          Send Invitation
        </Button>
      </YStack>
    </Card>
  )
}