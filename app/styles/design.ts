import { Colors, Typography } from '_styles';

// Font styles used in PFP

// Used in the header in all the pages
// use StyleSheet.create()

export const FONT_NAVBAR_TITLE = {
  fontFamily: Typography.FONT_FAMILY_EXTRA_BOLD,
  fontSize: Typography.FONT_SIZE_27,
  lineHeight: Typography.LINE_HEIGHT_40,
  color: Colors.TEXT_COLOR,
};

const marginTop = (margin: number) => {
  return {
    marginTop: margin,
  };
};

export const marginTop30 = marginTop(30);
export const marginTop24 = marginTop(24);
export const marginTop20 = marginTop(20);
export const marginTop16 = marginTop(16);
