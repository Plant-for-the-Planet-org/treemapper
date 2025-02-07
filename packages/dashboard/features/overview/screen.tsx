// packages/dashboard/features/overview/screen.tsx
import React, { useEffect, useState } from 'react'
import { YStack, H1, Text, Spinner, Button } from 'tamagui'
import { MembersTable } from '../../components/tables/MembersTable'
import { ApiClient } from '../../../api/index'
import ProjectDetails from '../../components/projects/projects'

interface HealthCheckResponse {
  status: string
  timestamp: string
  // Add other health check fields as needed
}

// Initialize API client
const apiClient = new ApiClient({
  baseUrl: 'http://192.168.1.33:3000',
})

export default function OverviewScreen() {
  const [healthStatus, setHealthStatus] = useState<HealthCheckResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkHealth()
  }, [])

  const checkHealth = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.get<HealthCheckResponse>('/api/users/me')
      if (response.status === 200) {
        setHealthStatus(response.data)
      } else {
        setError('Server returned unexpected status')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check server health'
      setError(errorMessage)
      console.error('Health check error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <YStack space="$4" padding="$4">
      <H1>System Overview</H1>
      {loading ? (
        <YStack alignItems="center" paddingVertical="$4">
          <Spinner size="large" />
          <Text>Checking system status...</Text>
        </YStack>
      ) : error ? (
        <YStack backgroundColor="$red2" padding="$4" borderRadius="$2">
          <Text color="$red11">Error: {error}</Text>
          <Button 
            onPress={checkHealth}
            marginTop="$2"
          >
            Retry Check
          </Button>
        </YStack>
      ) : (
        <YStack space="$4">
          <YStack 
            backgroundColor="$green2" 
            padding="$4" 
            borderRadius="$2"
          >
            <Text color="$green11">
              Status: {healthStatus?.status}
            </Text>
            {healthStatus?.timestamp && (
              <Text color="$green11">
                Last Updated: {new Date(healthStatus.timestamp).toLocaleString()}
              </Text>
            )}
          </YStack>
          
          <Button onPress={checkHealth}>
            Refresh Status
          </Button>
        </YStack>
      )}
    </YStack>
  )
}