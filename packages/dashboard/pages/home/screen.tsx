import MobileHome from './MobileHome';
import WebHome from './WebHome'
import React from 'react'
import { usePlatform } from '../../utils/platformUtil';


const HomeScreen = () => {
  const { isWeb, isNative, isIOS, isAndroid, platform } = usePlatform();

  return isWeb? <WebHome /> : <MobileHome />
}

export default HomeScreen