import { createMockTransport } from './mockTransport'
import { createNativeTransport, hasNativeGarminLink } from './nativeTransport'
import { GarminTransport, GarminTransportOptions } from './transport'

export * from './protocol'
export * from './transport'
export {
  setMockScenario,
  getMockScenario,
  setMockDevice,
  getMockDevice,
} from './mockTransport'
export type { MockScenario } from './mockTransport'

/**
 * Whether to offer the Garmin at all.
 *
 * In a release build this is the native link and nothing else. The mock is
 * development scaffolding, and a fake coordinate dropped on a real tree would
 * be worse than no feature: the point would look exactly like a surveyed one
 * and nothing downstream could tell. So the button hides rather than lying.
 */
export const isGarminAvailable = (): boolean =>
  hasNativeGarminLink() || __DEV__

export const createGarminTransport = (
  options: GarminTransportOptions = {},
): GarminTransport | null => {
  const native = createNativeTransport()
  if (native) {
    return native
  }
  if (__DEV__) {
    return createMockTransport(options)
  }
  return null
}
