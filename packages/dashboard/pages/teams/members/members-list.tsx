import React from 'react'
import { H3, View } from 'tamagui'
import { MembersTable } from '../../../components/tables/MembersTable'

const users = [
  {
    id: '1',
    name: 'John Doe',
    role: 'Admin',
    status: 'active',
    avatar: 'https://avatar.iran.liara.run/public/boy'
  },
  {
    id: '2',
    name: 'Jane Smith',
    role: 'User',
    status: 'suspended',
    avatar: 'https://avatar.iran.liara.run/public/girl'
  },
  {
    id: '3',
    name: 'Michael Johnson',
    role: 'Manager',
    status: 'active',
    avatar: 'https://avatar.iran.liara.run/public/boy?id=2'
  },
  {
    id: '4',
    name: 'Emily Williams',
    role: 'Editor',
    status: 'inactive',
    avatar: 'https://avatar.iran.liara.run/public/girl?id=3'
  },
  {
    id: '5',
    name: 'Robert Brown',
    role: 'User',
    status: 'active',
    avatar: 'https://avatar.iran.liara.run/public/boy?id=4'
  },
  {
    id: '6',
    name: 'Sarah Miller',
    role: 'Designer',
    status: 'active',
    avatar: 'https://avatar.iran.liara.run/public/girl?id=5'
  },
  {
    id: '7',
    name: 'David Wilson',
    role: 'Developer',
    status: 'suspended',
    avatar: 'https://avatar.iran.liara.run/public/boy?id=6'
  },
  {
    id: '8',
    name: 'Jennifer Taylor',
    role: 'Analyst',
    status: 'active',
    avatar: 'https://avatar.iran.liara.run/public/girl?id=7'
  },
  {
    id: '9',
    name: 'Thomas Anderson',
    role: 'Admin',
    status: 'inactive',
    avatar: 'https://avatar.iran.liara.run/public/boy?id=8'
  },
  {
    id: '10',
    name: 'Lisa Moore',
    role: 'Moderator',
    status: 'active',
    avatar: 'https://avatar.iran.liara.run/public/girl?id=9'
  },
  {
    id: '11',
    name: 'Kevin Martinez',
    role: 'Developer',
    status: 'active',
    avatar: 'https://avatar.iran.liara.run/public/boy?id=10'
  },
  {
    id: '12',
    name: 'Amanda Clark',
    role: 'User',
    status: 'suspended',
    avatar: 'https://avatar.iran.liara.run/public/girl?id=11'
  }
];
const handleViewUser = (user) => {
  console.log('View user:', user)
}


export default function MembersList() {
  return (
    <View>
      <MembersTable users={users} onViewUser={handleViewUser} />
    </View>
  )
}
