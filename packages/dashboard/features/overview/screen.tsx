// packages/dashboard/features/overview/screen.tsx
import React, { useEffect, useState } from 'react'
import { YStack, H1, Text, Spinner } from 'tamagui'
import { MembersTable } from '../../components/tables/MembersTable'
import { ApiClient } from '../../../api/index'

// Define your data interface
interface UserData {
  id: string
  name: string
  email: string
  // Add other fields as needed
}

// Initialize API client
const apiClient = new ApiClient({
  baseUrl: 'http://192.168.1.33:3000',
})

export default function OverviewScreen() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      console.log("LKJDC dd","KSDLC")
      setLoading(true)
      const response = await apiClient.get<UserData[]>('/api/health')
      console.log("LKJDC",response)
      if (response.status === 200) {
        setUsers(response.data)
        setError(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  return (
    <YStack space="$4">
      <H1>Overview</H1>
      {loading ? (
        <YStack alignItems="center" paddingVertical="$4">
          <Spinner size="large" />
        </YStack>
      ) : error ? (
        <YStack backgroundColor="$red2" padding="$4" borderRadius="$2">
          <Text color="$red11">{error}</Text>
        </YStack>
      ) : (
        <>

        </>
      )}
    </YStack>
  )
}