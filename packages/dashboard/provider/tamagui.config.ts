import { config as defaultConfig } from '@tamagui/config/v3'
import { createTamagui, createFont } from 'tamagui'

const openSansFont = createFont({
  family: 'Open Sans',
  // You need to define sizes and lineheights for your fonts
  size: {
    1: 12,
    2: 14,
    3: 16,
    4: 18,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    // Add more as needed
  },
  lineHeight: {
    1: 16,
    2: 20,
    3: 24,
    4: 28,
    5: 30,
    6: 36,
    7: 40,
    8: 44,
    9: 48,
    10: 52,
    // Add more as needed
  },
  weight: {
    4: '400', // Regular
    6: '600', // SemiBold
    7: '700', // Bold
    8: '800', // ExtraBold
  },
  letterSpacing: {
    4: 0,
    8: -1,
  },
  // You can define face for platform-specific details
  face: {
    // Web specific paths
    400: { normal: 'Open Sans', italic: 'Open Sans' },
    600: { normal: 'Open Sans', italic: 'Open Sans' },
    700: { normal: 'Open Sans', italic: 'Open Sans' },
    800: { normal: 'Open Sans', italic: 'Open Sans' },
  },
})

export const config = createTamagui({...defaultConfig,fonts: {
  heading: openSansFont,
  body: openSansFont,
  // Make Open Sans the default font
  default: openSansFont,
},})

type AppConfig = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config
