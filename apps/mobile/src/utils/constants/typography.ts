import { scaleFont } from './mixins';

// FONT FAMILY
export const FONT_FAMILY_REGULAR = 'OpenSans-Regular';
export const FONT_FAMILY_BOLD = 'OpenSans-Bold';
export const FONT_FAMILY_SEMI_BOLD = 'OpenSans-SemiBold';
export const FONT_FAMILY_EXTRA_BOLD = 'OpenSans-ExtraBold';
export const FONT_FAMILY_ITALIC = 'OpenSans-Italic';
export const FONT_FAMILY_ITALIC_BOLD = 'OpenSans-BoldItalic';
export const FONT_FAMILY_ITALIC_SEMI_BOLD = 'OpenSans-SemiBoldItalic';

// FONT WEIGHT
export const FONT_WEIGHT_REGULAR = '400';
export const FONT_WEIGHT_MEDIUM = '500';
export const FONT_WEIGHT_BOLD = '700';

// FONT SIZE
//
// `scaleFont` caps the OS text setting at Mixins.MAX_FONT_SCALE; it does not
// multiply by it. React Native does that itself when it draws the text.
// Every size the app actually uses has an entry, so a screen never needs a
// bare number.
export const FONT_SIZE_30 = scaleFont(30);
export const FONT_SIZE_28 = scaleFont(28);
export const FONT_SIZE_27 = scaleFont(27);
export const FONT_SIZE_26 = scaleFont(26);
export const FONT_SIZE_24 = scaleFont(24);
export const FONT_SIZE_22 = scaleFont(22);
export const FONT_SIZE_21 = scaleFont(21);
export const FONT_SIZE_20 = scaleFont(20);
export const FONT_SIZE_18 = scaleFont(18);
export const FONT_SIZE_17 = scaleFont(17);
export const FONT_SIZE_16 = scaleFont(16);
export const FONT_SIZE_15 = scaleFont(15);
export const FONT_SIZE_14 = scaleFont(14);
export const FONT_SIZE_13 = scaleFont(13);
export const FONT_SIZE_12_5 = scaleFont(12.5);
export const FONT_SIZE_12 = scaleFont(12);
export const FONT_SIZE_11 = scaleFont(11);
export const FONT_SIZE_10 = scaleFont(10);
export const FONT_SIZE_9 = scaleFont(9);
export const FONT_SIZE_8 = scaleFont(8);

// LINE HEIGHT
export const LINE_HEIGHT_40 = scaleFont(40);
export const LINE_HEIGHT_30 = scaleFont(30);
export const LINE_HEIGHT_24 = scaleFont(24);
export const LINE_HEIGHT_22 = scaleFont(22);
export const LINE_HEIGHT_20 = scaleFont(20);
export const LINE_HEIGHT_19 = scaleFont(19);
export const LINE_HEIGHT_18 = scaleFont(18);
export const LINE_HEIGHT_17 = scaleFont(17);
export const LINE_HEIGHT_16 = scaleFont(16);
export const LINE_HEIGHT_15 = scaleFont(15);

// FONT STYLE
export const FONT_REGULAR = {
  fontFamily: FONT_FAMILY_REGULAR,
  fontWeight: FONT_WEIGHT_REGULAR,
};

export const FONT_BOLD = {
  fontFamily: FONT_FAMILY_BOLD,
  fontWeight: FONT_WEIGHT_BOLD,
};
