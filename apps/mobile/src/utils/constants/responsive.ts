import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import { fontScaleFactor, scaleSize, sizeRatio } from './mixins';

export interface Responsive {
  width: number;
  height: number;
  /** The clamped width ratio. */
  ratio: number;
  /** Scale a size (padding, height, icon box) to this device. */
  size: (value: number) => number;
  /**
   * Cap a font size at `MAX_FONT_SCALE`. As with `Mixins.scaleFont`, the
   * number returned is not what the user sees -- React Native still
   * multiplies it by the OS text setting.
   */
  font: (value: number) => number;
  /** The raw OS text setting, before the cap. */
  fontScale: number;
}

/**
 * The live version of `Mixins.scaleSize` / `Mixins.scaleFont`.
 *
 * The constants in `spacing.ts` and `typography.ts` are computed once at
 * module load from `Dimensions.get('window')`, which is fine for the great
 * majority of the app: `app.json` locks orientation to portrait, so the width
 * does not change under us.
 *
 * It is not fine for a component that has to react to the window itself -- a
 * foldable opening, a split-screen pane resizing, or an Android user changing
 * the text size while the app is running. Those read this hook instead, which
 * recomputes from `useWindowDimensions`. The tab bar does the same thing for
 * its own geometry.
 */
export function useResponsive(): Responsive {
  const { width, height, fontScale } = useWindowDimensions();

  return useMemo(() => {
    const factor = fontScaleFactor(fontScale);
    return {
      width,
      height,
      ratio: sizeRatio(width),
      size: (value: number) => scaleSize(value, width),
      font: (value: number) => Math.round(value * factor * 100) / 100,
      fontScale,
    };
  }, [width, height, fontScale]);
}
