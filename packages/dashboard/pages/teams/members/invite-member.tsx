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
  Separator,
  Dialog,
  Spinner,
} from 'tamagui'
import { Users, Mail, UserPlus, Check, ChevronDown, AlertCircle, AlertTriangle, CheckCircle } from '@tamagui/lucide-icons'

interface InviteMemberProps {
  onInvite?: (email: string, role: string) => Promise<boolean> | boolean
}

export default function InviteMember({ onInvite }: InviteMemberProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [inviteStatus, setInviteStatus] = useState<'success' | 'error' | null>(null)
  
  const roleOptions = [
    {
      value: 'admin',
      label: 'Admin',
      description: 'Can edit projects and manage team members'
    },
    {
      value: 'member',
      label: 'Member',
      description: 'Can edit projects but not manage the team'
    },
    {
      value: 'viewer',
      label: 'Viewer',
      description: 'View-only access to projects'
    },
  ]

  const selectedRole = roleOptions.find(r => r.value === role) || roleOptions[1]

  const handleConfirmInvite = async () => {
    if (email && role) {
      setConfirmationOpen(false)
      setIsLoading(true)
      setStatusDialogOpen(true)
      
      try {
        // Call the onInvite function from props and wait for the response
        const success = await onInvite?.(email, role)
        setIsLoading(false)
        setInviteStatus(success ? 'success' : 'error')
        
        // Reset form if successful
        if (success) {
          setEmail('')
        }
      } catch (error) {
        setIsLoading(false)
        setInviteStatus('error')
      }
    }
  }

  const handleStatusDialogClose = () => {
    setStatusDialogOpen(false)
    setInviteStatus(null)
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
          <Select
            id="role"
            value={role}
            onValueChange={setRole}
            onOpenChange={(open) => {
              setSheetOpen(open)
            }}
          >
            {/* Display selected role value in trigger */}
            <Select.Trigger width="100%" size="$4" iconAfter={ChevronDown}>
              <Select.Value>
                <Text>{selectedRole.label}</Text>
              </Select.Value>
            </Select.Trigger>

            <Adapt when="sm" platform="touch">
              <Sheet
                modal
                open={sheetOpen}
                dismissOnSnapToBottom
                snapPoints={[45]}
                animation={{ type: 'timing', duration: 300 }}
                zIndex={200000}
                handlePosition="inside"
                onOpenChange={setSheetOpen}
              >
                <Sheet.Frame padding="$0">
                  <YStack padding="$4" paddingBottom="$2">
                    <H6>Select Role</H6>
                    <Paragraph size="$2" color="$gray11" marginTop="$1" marginBottom="$3">
                      Choose the appropriate access level
                    </Paragraph>
                    <Separator marginVertical="$2" />
                  </YStack>

                  <Sheet.ScrollView
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    contentContainerStyle={{ padding: 16 }}
                  >
                    <YStack gap="$3">
                      {roleOptions.map((option, i) => (
                        <Button
                          key={option.value}
                          size="$4"
                          theme={role === option.value ? 'green' : undefined}
                          backgroundColor={role === option.value ? '#E8F5F0' : 'transparent'}
                          borderColor={role === option.value ? '#007A49' : '$gray5'}
                          borderWidth={1}
                          borderRadius="$3"
                          pressStyle={{ scale: 0.98 }}
                          onPress={() => {
                            setSheetOpen(() => false)
                            setRole(option.value)
                            // Close the sheet after selection
                          }}
                        >
                          <XStack flex={1} alignItems="center" justifyContent="space-between">
                            <YStack>
                              <Text fontWeight={role === option.value ? '600' : '400'} color={role === option.value ? '#007A49' : '$gray12'}>
                                {option.label}
                              </Text>
                              <Text fontSize="$2" color={role === option.value ? '#007A49' : '$gray10'} opacity={0.9}>
                                {option.description}
                              </Text>
                            </YStack>
                            {role === option.value && (
                              <Check size={18} color="#007A49" />
                            )}
                          </XStack>
                        </Button>
                      ))}
                    </YStack>
                  </Sheet.ScrollView>
                </Sheet.Frame>
                <Sheet.Overlay
                  backgroundColor="$shadowColor"
                  opacity={0.6}
                  animation="medium"
                  enterStyle={{ opacity: 0 }}
                  exitStyle={{ opacity: 0 }}
                />
              </Sheet>
            </Adapt>

            <Select.Content>
              <Select.ScrollUpButton />
              <Select.Viewport minWidth={200}>
                <Select.Group>
                  {roleOptions.map((option, i) => (
                    <Select.Item index={i} key={option.value} value={option.value}>
                      <Select.ItemText>{option.label}</Select.ItemText>
                      <Select.ItemIndicator>
                        <Check size={16} />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Group>
              </Select.Viewport>
              <Select.ScrollDownButton />
            </Select.Content>
          </Select>
        </YStack>

        <Button
          size="$4"
          color={"#fff"}
          backgroundColor={email.length===0 ? "$gray5" : "#007A49"}
          onPress={() => setConfirmationOpen(true)}
          disabled={!email}
          pressStyle={{ scale: 0.97 }}
          icon={UserPlus}
        >
          Send Invitation
        </Button>
      </YStack>

      {/* Confirmation Dialog */}
      <Dialog modal open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <Dialog.Portal>
          <Dialog.Overlay
            key="overlay"
            animation="quick"
            opacity={0.5}
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />
          <Dialog.Content
            bordered
            elevate
            key="content"
            animateOnly={['transform', 'opacity']}
            animation={[
              'quick',
              {
                opacity: {
                  overshootClamping: true,
                },
              },
            ]}
            enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
            exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
            gap="$4"
          >
            <Dialog.Title>
              <XStack space="$2" alignItems="center">
                <AlertCircle size={20} color="#007A49" />
                <Text fontWeight="600">Confirm Invitation</Text>
              </XStack>
            </Dialog.Title>
            <Dialog.Description>
              <Paragraph size="$3">
                Are you sure you want to send an invitation to <Text fontWeight="600">{email}</Text> as a <Text fontWeight="600">{selectedRole.label}</Text>?
              </Paragraph>
            </Dialog.Description>

            <YStack gap="$2" marginTop="$2">
              <Separator />
            </YStack>

            <XStack space="$3" justifyContent="flex-end">
              <Button
                size="$3"
                backgroundColor="transparent"
                borderColor="$gray5"
                borderWidth={1}
                color="$gray11"
                onPress={() => setConfirmationOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="$3"
                backgroundColor="#007A49"
                color="#fff"
                onPress={handleConfirmInvite}
              >
                Confirm
              </Button>
            </XStack>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      {/* Status Dialog (Success/Failure) */}
      <Dialog modal open={statusDialogOpen} onOpenChange={handleStatusDialogClose}>
        <Dialog.Portal>
          <Dialog.Overlay
            key="overlay"
            animation="quick"
            opacity={0.5}
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />
          <Dialog.Content
            bordered
            elevate
            key="content"
            animateOnly={['transform', 'opacity']}
            animation={[
              'quick',
              {
                opacity: {
                  overshootClamping: true,
                },
              },
            ]}
            enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
            exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
            gap="$4"
          >
            {isLoading ? (
              <YStack alignItems="center" padding="$4" space="$4">
                <Spinner size="large" color="#007A49" />
                <Text fontSize="$4" fontWeight="500">
                  Sending invitation...
                </Text>
              </YStack>
            ) : inviteStatus === 'success' ? (
              <>
                <Dialog.Title>
                  <XStack space="$2" alignItems="center">
                    <CheckCircle size={20} color="#007A49" />
                    <Text fontWeight="600" color="#007A49">Invitation Sent Successfully</Text>
                  </XStack>
                </Dialog.Title>
                <Dialog.Description>
                  <Paragraph size="$3">
                    An invitation has been sent to <Text fontWeight="600">{email}</Text>. They will receive an email with instructions to join the project.
                  </Paragraph>
                </Dialog.Description>
                <YStack gap="$2" marginTop="$2">
                  <Separator />
                </YStack>
                <XStack justifyContent="center">
                  <Button
                    size="$3"
                    backgroundColor="#007A49"
                    color="#fff"
                    onPress={handleStatusDialogClose}
                  >
                    Done
                  </Button>
                </XStack>
              </>
            ) : (
              <>
                <Dialog.Title>
                  <XStack space="$2" alignItems="center">
                    <AlertTriangle size={20} color="#E53935" />
                    <Text fontWeight="600" color="#E53935">Failed to Send Invitation</Text>
                  </XStack>
                </Dialog.Title>
                <Dialog.Description>
                  <Paragraph size="$3">
                    We couldn't send an invitation to <Text fontWeight="600">{email}</Text>. Please check the email address and try again.
                  </Paragraph>
                </Dialog.Description>
                <YStack gap="$2" marginTop="$2">
                  <Separator />
                </YStack>
                <XStack justifyContent="center">
                  <Button
                    size="$3"
                    backgroundColor="#E53935"
                    color="#fff"
                    onPress={handleStatusDialogClose}
                  >
                    Try Again
                  </Button>
                </XStack>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </Card>
  )
}