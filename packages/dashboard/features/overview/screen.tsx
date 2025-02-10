// packages/dashboard/features/overview/screen.tsx
import React, { useEffect, useState } from 'react'
import { Button, H1, Spinner, Text, YStack } from 'tamagui'
import { ApiClient } from '../../../api/index'
import ProjectDetails from '../../components/projects/projects'

interface HealthCheckResponse {
  status: string
  timestamp: string
  // Add other health check fields as needed
}

export default function OverviewScreen() {
  const [healthStatus, setHealthStatus] = useState<HealthCheckResponse | null>(
    null,
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const api = ApiClient.getInstance()
  useEffect(() => {
    checkHealth()
  }, [])

  const checkHealth = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await api.get('/api/projects')
      const transformedResponse = JSON.stringify(response, null, 2)
      if (transformedResponse.success) {
        setLoading(false)
      }
    } catch (err) {
      setError(err)
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
          <Button onPress={checkHealth} marginTop="$2">
            Retry Check
          </Button>
        </YStack>
      ) : (
        <YStack space="$4">
          <YStack backgroundColor="$green2" padding="$4" borderRadius="$2">
            <Text color="$green11">Status: {healthStatus?.status}</Text>
            {healthStatus?.timestamp && (
              <Text color="$green11">
                Last Updated:{' '}
                {new Date(healthStatus.timestamp).toLocaleString()}
              </Text>
            )}
          </YStack>

          <Button onPress={checkHealth}>Refresh Status</Button>
        </YStack>
      )}
    </YStack>
  )
}
