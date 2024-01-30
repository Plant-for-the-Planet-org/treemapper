import React from 'react';
import { Image, View } from 'react-native';

import { Typography } from '../../../styles';
import { single_tree_png } from '../../../assets';
import GradientText from '../GradientText/GradientText';

const ComingSoon = () => {
  return (
    <View
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 18 }}>
      <Image resizeMode={'contain'} source={single_tree_png} style={{ width: 200, height: 300 }} />
      <GradientText
        style={{
          textAlign: 'center',
          fontSize: Typography.FONT_SIZE_22,
          fontFamily: Typography.FONT_FAMILY_BOLD,
        }}>
        We're working hard to bring you exciting new features. Stay tuned for updates !
      </GradientText>
    </View>
  );
};

export default ComingSoon;
