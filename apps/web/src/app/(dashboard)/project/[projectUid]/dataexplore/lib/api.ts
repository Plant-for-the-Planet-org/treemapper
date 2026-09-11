// Shape the shared fetch layer wraps every response in. The server's global
// ResponseInterceptor adds statusCode/message around the controller's payload,
// so callers check statusCode and then read `data`.

export interface ApiResponse<T> {
  statusCode?: number
  message?: string
  error?: string
  data?: T
}

export interface FeatureCollectionOf<T> {
  type: 'FeatureCollection'
  features: T[]
}
