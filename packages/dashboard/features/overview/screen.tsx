// packages/dashboard/features/overview/screen.tsx
import React, { useEffect, useState } from 'react'
import { Button, H1, Spinner, Text, YStack } from 'tamagui'
import { ApiClient } from '../../../api/index'
import ProjectDetails from '../../components/projects/projects'
import { OverviewCardList } from '../../components/overview/OverviewCardList'
import RecentAdditions from '../../components/overview/RecentAdditions'

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
    <YStack width={"100%"}>
      <OverviewCardList />
      <RecentAdditions/>
    </YStack>
  )
}
