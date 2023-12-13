import { Dimensions, PixelRatio, Platform } from 'react-native';

const WINDOW_WIDTH = Dimensions.get('window').width;

// This is the base width Sagar uses for designs
const guidelineBaseWidth = 360;

// This will scale all the items acc to our base width and user's device
export const scaleSize = (size: number) => (WINDOW_WIDTH / guidelineBaseWidth) * size;

// This will scale the font acc to user's device
export const scaleFont = (size: number) => size * PixelRatio.getFontScale();

function dimensions(
  top: number | string,
  right = top,
  bottom = top,
  left = right,
  property: string,
) {
  let styles: any = {};

  styles[`${property}Top`] = top;
  styles[`${property}Right`] = right;
  styles[`${property}Bottom`] = bottom;
  styles[`${property}Left`] = left;

  return styles;
}

export function margin(
  top: number | string,
  right: number | string,
  bottom: number | string,
  left: number | string,
) {
  return dimensions(top, right, bottom, left, 'margin');
}

export function padding(
  top: number | string,
  right: number | string,
  bottom: number | string,
  left: number | string,
) {
  return dimensions(top, right, bottom, left, 'padding');
}

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
