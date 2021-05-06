import { Colors, Typography } from '_styles';

// Font styles used in PFP

// Used in the header in all the pages
// use StyleSheet.create()

export const bottomInputContainer = {
  flexDirection: 'row',
  height: 65,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: Colors.WHITE,
  borderTopWidth: 0.5,
  borderColor: Colors.TEXT_COLOR,
  paddingHorizontal: 20,
};

export const bottomInputLabel = {
  fontFamily: Typography.FONT_FAMILY_REGULAR,
  fontSize: Typography.FONT_SIZE_18,
  lineHeight: Typography.LINE_HEIGHT_30,
  color: Colors.TEXT_COLOR,
  marginRight: 10,
  paddingRight: 10,
};

export const bottomInputText = {
  fontFamily: Typography.FONT_FAMILY_REGULAR,
  fontSize: Typography.FONT_SIZE_20,
  color: Colors.TEXT_COLOR,
  fontWeight: Typography.FONT_WEIGHT_MEDIUM,
  flex: 1,
  paddingVertical: 10,
};
