import { currentPlatform } from '@tamagui/core';
import MobileHome from './MobileHome';
import WebHome from './WebHome'
import React from 'react'

const HomeScreen = () => {
  return currentPlatform === 'web' ? <WebHome /> : <MobileHome />
}

export default HomeScreen