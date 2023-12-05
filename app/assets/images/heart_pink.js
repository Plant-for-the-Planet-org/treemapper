import * as React from 'react';
import Svg, { G, Rect, Path, Defs, ClipPath } from 'react-native-svg';
/* SVGR has dropped some elements not supported by react-native-svg: filter */

function HeartPink(props) {
  return (
    <Svg
      width={28}
      height={28}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}>
      <G filter="url(#filter0_b_2146_11928)">
        <Rect width={28} height={28} rx={4} fill="#EB5757" fillOpacity={0.2} />
        <G clipPath="url(#clip0_2146_11928)">
          <Path
            d="M13.91 21s-7.911-3.332-7.911-9.406C5.983 9.053 7.879 7 10.215 7c1.65 0 3.09 1.043 3.776 2.558C14.677 8.043 16.115 7 17.766 7 20.103 7 22 9.053 22 11.594c0 6.04-8.09 9.406-8.09 9.406z"
            fill="#EB5757"
          />
        </G>
      </G>
      <Defs>
        <ClipPath id="clip0_2146_11928">
          <Path fill="#fff" transform="translate(5.999 7)" d="M0 0H16V14H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  );
}

export default HeartPink;
