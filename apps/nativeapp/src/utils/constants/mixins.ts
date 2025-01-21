import { Dimensions, PixelRatio, Platform } from 'react-native';

export const WINDOW_WIDTH = Dimensions.get('window').width;
export const WINDOW_HEIGHT = Dimensions.get('window').height;

// This is the base width Sagar uses for designs
const guidelineBaseWidth = 360;

// This will scale all the items acc to our base width and user's device
export const scaleSize = (size: number) => (WINDOW_WIDTH / guidelineBaseWidth) * size;

// This will scale the font acc to user's device
export const scaleFont = (size: number) => size * PixelRatio.getFontScale();

export function boxShadow(
  color: string,
  offset = { height: 2, width: 2 },
  radius = 8,
  opacity = 0.2,
) {
  return {
    shadowColor: color,
    shadowOffset: offset,
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation: radius,
  };
}

export const IS_ANDROID = Platform.OS === 'android';
