import { Dimensions, PixelRatio, Platform } from 'react-native';

export const WINDOW_WIDTH = Dimensions.get('window').width;
export const WINDOW_HEIGHT = Dimensions.get('window').height;

// The width our designs are drawn at.
const GUIDELINE_BASE_WIDTH = 360;

/**
 * How far `scaleSize` is allowed to move off the design.
 *
 * It used to be a bare `WINDOW_WIDTH / 360`, unbounded. `app.json` sets
 * `supportsTablet: true`, so an iPad at 768dp was multiplying every size and
 * gap by 2.13 -- padding, image heights, icon boxes, all of it. Clamping keeps
 * a narrow phone a little tighter and a tablet a little roomier without
 * letting anything become a fraction of the screen.
 */
export const MIN_SIZE_SCALE = 0.9;
export const MAX_SIZE_SCALE = 1.15;

/**
 * The largest OS text setting we honour.
 *
 * Nothing in the app sets `maxFontSizeMultiplier`, so before this the
 * accessibility text sizes ran unbounded and broke layouts. 1.3 is large
 * enough to help and small enough that rows, chips and the tab bar still fit.
 */
export const MAX_FONT_SCALE = 1.3;

/**
 * The widest a centred dialog card is allowed to get.
 *
 * The alert cards are written as `width: '90%'`, which on an 800dp tablet is a
 * 720dp dialog holding one line of text and two buttons. Every phone we
 * support is under this cap already, so it changes nothing below tablet size.
 *
 * Screens themselves are deliberately *not* capped: the app fills the window
 * on a tablet rather than drawing a centred column with gutters either side.
 */
export const MAX_DIALOG_WIDTH = 480;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/** Two decimals is plenty and keeps style objects readable. */
const round = (value: number) => Math.round(value * 100) / 100;

/** The clamped width ratio every size below is multiplied by. */
export const sizeRatio = (width: number = WINDOW_WIDTH) =>
  clamp(width / GUIDELINE_BASE_WIDTH, MIN_SIZE_SCALE, MAX_SIZE_SCALE);

/** Scales a size (padding, height, icon box) to the device width. */
export const scaleSize = (size: number, width: number = WINDOW_WIDTH) =>
  round(size * sizeRatio(width));

/**
 * The correction `scaleFont` applies, exported so a hook can recompute it
 * from a live font scale.
 *
 * React Native already multiplies `fontSize` by the OS text setting when it
 * draws (`allowFontScaling` defaults to true), so a font helper must not
 * multiply by it again -- the old `size * PixelRatio.getFontScale()` did, and
 * a user at 1.5x text was getting 2.25x on every `Typography.FONT_SIZE_*`.
 *
 * So this returns 1 for every setting we honour in full, and below 1 only
 * once the setting passes `MAX_FONT_SCALE`, cancelling out the part of React
 * Native's own multiplication we do not want. A user who asked for *smaller*
 * text still gets it: only the top is capped.
 */
export const fontScaleFactor = (
  osFontScale: number = PixelRatio.getFontScale(),
) => {
  const safe = Math.max(osFontScale, 0.01);
  return Math.min(safe, MAX_FONT_SCALE) / safe;
};

/**
 * Caps a font size at `MAX_FONT_SCALE`, and otherwise leaves it alone.
 *
 * The number this returns is not what the user sees -- React Native still
 * multiplies it by the OS setting. What the user sees is
 * `size * min(osFontScale, MAX_FONT_SCALE)`.
 *
 * This only works while `allowFontScaling` is left at its default. Setting it
 * to false on a Text would make that text undersized for a large-text user,
 * so do not turn it off; pass `maxFontSizeMultiplier` if one Text needs a
 * different ceiling.
 */
export const scaleFont = (
  size: number,
  osFontScale: number = PixelRatio.getFontScale(),
) => round(size * fontScaleFactor(osFontScale));

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
