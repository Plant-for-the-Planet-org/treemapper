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

  }
]

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
