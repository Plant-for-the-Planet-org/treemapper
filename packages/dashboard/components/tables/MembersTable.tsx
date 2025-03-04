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

  // Define fixed column widths
  const columnWidths = {
    name: 220,    // Width for name column
    role: 100,    // Width for role column
    status: 120,  // Width for status column
    actions: 100  // Width for actions column
  }

  const TableHeader = ({ field, label }: { field: keyof User; label: string }) => (
    <XStack
      width={field === 'name' ? columnWidths.name : 
             field === 'role' ? columnWidths.role : 
             field === 'status' ? columnWidths.status : undefined}
      padding="$3"
      backgroundColor="$gray2"
      borderBottomWidth={1}
      borderColor="$gray5"
      pressStyle={{ backgroundColor: '$gray3' }}
      onPress={() => handleSort(field)}
      justifyContent="space-between"
      alignItems="center"
    >
      <Text fontWeight="600" color="$gray11">
        {label}
      </Text>
      {sortField === field && (
        <Image
          src={sortDirection === 'asc' ? ChevronUp : ChevronDown}
          size={16}
        />
      )}
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
        fontSize="$8"
        fontWeight="700"
        letterSpacing={1}
        padding="$4"
      >
        Members
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <YStack minWidth={columnWidths.name + columnWidths.role + columnWidths.status + columnWidths.actions}>
          <XStack borderTopWidth={1} borderColor="$gray5">
            <TableHeader field="name" label="Name" />
            <TableHeader field="role" label="Role" />
            <TableHeader field="status" label="Status" />
            <XStack 
              width={columnWidths.actions} 
              padding="$3" 
              backgroundColor="$gray2" 
              borderBottomWidth={1} 
              borderColor="$gray5"
              alignItems="center"
            >
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
              <XStack width={columnWidths.name} padding="$3" alignItems="center" gap="$2">
                <Avatar circular size="$4" backgroundColor="$blue5">
                  {user.avatar ? (
                    <Avatar.Image src={user.avatar} />
                  ) : (
                    <Avatar.Fallback>
                      <Text>{user.name.charAt(0)}</Text>
                    </Avatar.Fallback>
                  )}
                </Avatar>
                <Text color="$gray12" numberOfLines={1} ellipsizeMode="tail">
                  {user.name}
                </Text>
              </XStack>

              {/* Role Column */}
              <XStack width={columnWidths.role} padding="$3" alignItems="center">
                <Text color="$gray11" numberOfLines={1} ellipsizeMode="tail">
                  {user.role}
                </Text>
              </XStack>

              {/* Status Column */}
              <XStack width={columnWidths.status} padding="$3" alignItems="center">
                <StatusBadge status={user.status} />
              </XStack>

              {/* Actions Column */}
              <XStack width={columnWidths.actions} padding="$3" alignItems="center" justifyContent="center">
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