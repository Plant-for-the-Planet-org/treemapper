import React, { useState } from 'react'
import {
  XStack,
  YStack,
  Text,
  Button,
  ScrollView,
  Stack,
  Circle,
  Image,
  Avatar,
} from 'tamagui'

const Eye = require('../../../public/images/eye.png')
const ChevronUp = require('../../../public/images/chevron-up.png')
const ChevronDown = require('../../../public/images/chevron-down.png')


interface User {
  id: string
  name: string
  role: string
  status: 'active' | 'suspended'
  avatar?: string
}

interface UserTableProps {
  users: User[]
  onViewUser: (user: User) => void
}

export function MembersTable({ users, onViewUser }: UserTableProps) {
  const [sortField, setSortField] = useState<keyof User>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const sortedUsers = [...users].sort((a, b) => {
    if (sortDirection === 'asc') {
      return a[sortField] > b[sortField] ? 1 : -1
    }
    return a[sortField] < b[sortField] ? 1 : -1
  })

  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const TableHeader = ({ field, label }: { field: keyof User; label: string }) => (
    <XStack
      flex={1}
      padding="$3"
      backgroundColor="$gray2"
      borderBottomWidth={1}
      borderColor="$gray5"
      pressStyle={{ backgroundColor: '$gray3' }}
      onPress={() => handleSort(field)}
    >
      <Text flex={1} fontWeight="600" color="$gray11">
        {label}
      </Text>
      {sortField === field && sortDirection === 'asc' ? <Image
        src={ChevronUp}
        size={16}
      /> : <Image
        src={ChevronDown}
        size={16}
      />
      }
    </XStack>
  )

  const StatusBadge = ({ status }: { status: User['status'] }) => (
    <Stack
      backgroundColor={status === 'active' ? '$green2' : '$yellow2'}
      paddingHorizontal="$2"
      paddingVertical="$1"
      borderRadius="$4"
    >
      <Text
        color={status === 'active' ? '$green11' : '$yellow11'}
        fontSize="$2"
        textTransform="capitalize"
      >
        {status}
      </Text>
    </Stack>
  )

  return (
    <YStack flex={1}>
      <Text
        color="$gray12"
        fontSize="$8"        // Larger font size
        fontWeight="700"     // Bold weight
        letterSpacing={1}   // Tighter letter spacing for headings
        padding="$4"         // Add some padding
      >
        Members
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <YStack minWidth={500}>
          <XStack borderTopWidth={1} borderColor="$gray5">
            <TableHeader field="name" label="Name" />
            <TableHeader field="role" label="Role" />
            <TableHeader field="status" label="Status" />
            <XStack width={100} padding="$3" backgroundColor="$gray2" borderBottomWidth={1} borderColor="$gray5">
              <Text fontWeight="600" color="$gray11">Actions</Text>
            </XStack>
          </XStack>

          {/* Table Body */}
          {sortedUsers.map((user) => (
            <XStack
              key={user.id}
              borderBottomWidth={1}
              borderColor="$gray5"
              backgroundColor="$gray1"
              hoverStyle={{ backgroundColor: '$gray2' }}
            >
              {/* Name Column */}
              <XStack flex={1} padding="$3" alignItems="center" gap="$2">
                <Avatar circular size="$4" backgroundColor="$blue5">
                  {user.avatar ? (
                    <Avatar.Image src={user.avatar} />
                  ) : (
                    <Avatar.Fallback>
                      <Text>{user.name.charAt(0)}</Text>
                    </Avatar.Fallback>
                  )}
                </Avatar>
                <Text color="$gray12">{user.name}</Text>
              </XStack>

              {/* Role Column */}
              <XStack flex={1} padding="$3" alignItems="center">
                <Text color="$gray11">{user.role}</Text>
              </XStack>

              {/* Status Column */}
              <XStack flex={1} padding="$3" alignItems="center">
                <StatusBadge status={user.status} />
              </XStack>

              {/* Actions Column */}
              <XStack width={100} padding="$3" alignItems="center">
                <Button
                  size="$3"
                  variant="ghost"
                  onPress={() => onViewUser(user)}
                  pressStyle={{ scale: 0.97 }}
                  hoverStyle={{ backgroundColor: '$gray3' }}
                >
                  <Image
                    src={Eye}
                    width={16}
                    height={16}
                  />
                </Button>
              </XStack>
            </XStack>
          ))}
        </YStack>
      </ScrollView>
      <Text height="$5"/>
    </YStack>
  )
}