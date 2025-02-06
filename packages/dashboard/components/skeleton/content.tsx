import React, { useEffect } from 'react'
import { ScrollView, YStack } from 'tamagui'
import { ApiClient } from '../../../api/index'

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Initialize API client
const api = new ApiClient({
  baseUrl: "http://192.168.1.33:3000",
});

export function ContentSkeleton({ children }: { children?: React.ReactNode }) {
  useEffect(() => {
    fetchCall()
  }, [])

  const fetchCall = async () => {
      try {
        const response = await api.get<User>('/health');
        return response.data;
      } catch (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }
  }

  return <ScrollView>{children}</ScrollView>
}
