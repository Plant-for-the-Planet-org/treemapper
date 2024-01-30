import * as React from 'react';
import Svg, { G, Rect, Path, Defs, ClipPath } from 'react-native-svg';
/* SVGR has dropped some elements not supported by react-native-svg: filter */

function HeartGray(props) {
  return (
    <Svg
      width={28}
      height={28}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}>
      <G filter="url(#filter0_b_2146_11870)">
        <Rect width={28} height={28} rx={4} fill="#E0E0E0" />
        <G clipPath="url(#clip0_2146_11870)">
          <Path
            d="M13.91 21S6 17.668 6 11.594C5.982 9.053 7.877 7 10.215 7c1.65 0 3.089 1.043 3.775 2.558C14.678 8.043 16.115 7 17.767 7c2.337 0 4.232 2.053 4.232 4.594C22 17.634 13.91 21 13.91 21z"
            fill="#828282"
          />
        </G>
      </G>
      <Defs>
        <ClipPath id="clip0_2146_11870">
          <Path fill="#fff" transform="translate(5.999 7)" d="M0 0H16V14H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  );
}

export default HeartGray;
