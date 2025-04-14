// packages/dashboard/utils/platform.ts

/**
 * Utility functions to detect current platform
 */

/**
 * Determines if the code is running in a web environment
 */
export const isWeb = () => {
    return typeof document !== 'undefined';
  };
  
  /**
   * Determines if the code is running in a native environment
   */
  export const isNative = () => {
    return !isWeb();
  };
  
  /**
   * More specific platform detection
   */
  export const getPlatform = () => {
    if (isWeb()) {
      return 'web';
    }
    
    // For more specific native platform detection
    if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
      // We can further detect iOS vs Android if needed
      if (typeof navigator.userAgent === 'string') {
        if (navigator.userAgent.includes('Android')) return 'android';
        if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) return 'ios';
      }
      return 'native';
    }
    
    return 'unknown';
  };
  
  /**
   * React hook for platform detection
   */
  import { useMemo } from 'react';
  
  export const usePlatform = () => {
    const platform = useMemo(() => getPlatform(), []);
    
    return {
      isWeb: platform === 'web',
      isNative: platform === 'native' || platform === 'ios' || platform === 'android',
      isIOS: platform === 'ios',
      isAndroid: platform === 'android',
      platform
    };
  };