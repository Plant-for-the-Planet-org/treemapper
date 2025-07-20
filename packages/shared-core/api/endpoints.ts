export const API_ENDPOINTS = {
  TODOS: '/todos',
  TODO_BY_ID: (id: string) => `/todos/${id}`,
} as const;

export const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    // Web environment
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  } else {
    // React Native environment
    return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';
  }
};