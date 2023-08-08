import * as React from 'react';
import Svg, { Rect, G, Path, Defs, ClipPath } from 'react-native-svg';

function PieAdditionalData(props) {
  return (
    <Svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}>
      <Rect width={24} height={24} rx={12} fill="#007A49" />
      <G clipPath="url(#clip0_2060_11716)">
        <Path
          d="M11.692 6A6.002 6.002 0 006 11.997c0 3.215 2.688 6.006 6.002 6.006 1.558 0 2.98-.59 4.046-1.566l-4.204-4.207a.281.281 0 01-.123-.233V6h-.03zm.59 0v5.499l4.764-2.752A5.99 5.99 0 0012.28 6h.003zm5.044 3.224l-4.875 2.818 3.99 3.993a5.98 5.98 0 001.562-4.041c0-.999-.244-1.941-.677-2.77z"
          fill="#fff"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_2060_11716">
          <Path fill="#fff" transform="translate(6 6)" d="M0 0H12V12H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  );
}

export default PieAdditionalData;
