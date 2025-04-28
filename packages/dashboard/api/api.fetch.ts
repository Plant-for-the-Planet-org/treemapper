import { getUrlApi, postUrlApi } from './api.url'
import {
  fetchDeleteCall,
  fetchGetCall,
  fetchPostCall,
  fetchPutCall,
} from './customFetch'

export const healthCheck = async () => {
  const uri = `${getUrlApi.health}`
  const result = await fetchGetCall(uri, false)
  return result
}
