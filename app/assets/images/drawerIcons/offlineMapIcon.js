import * as React from 'react';
import Svg, { Rect, G, Path, Defs, ClipPath } from 'react-native-svg';

function OfflineMapIcon(props) {
  return (
    <Svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}>
      <Rect width={24} height={24} rx={12} fill="#007A49" />
      <G clipPath="url(#clip0_2060_11725)" fill="#fff">
        <Path d="M12 6C9.792 6 8 7.708 8 9.814c0 2.334 2.696 4.446 3.528 5.034.144.099.304.152.472.152a.826.826 0 00.472-.152C13.296 14.252 16 12.14 16 9.814 16 7.708 14.208 6 12 6zm0 5.484c-1 0-1.816-.778-1.816-1.731 0-.954.816-1.732 1.816-1.732s1.816.778 1.816 1.732c0 .953-.816 1.73-1.816 1.73z" />
        <Path d="M18.969 16.576l-1.003-3.193a1.13 1.13 0 00-1.097-.875h-1.003c-.856 1.528-2.24 2.729-2.987 3.302-.257.199-.56.302-.879.302-.319 0-.622-.103-.879-.302-.739-.573-2.131-1.767-2.987-3.302H7.131a1.13 1.13 0 00-1.097.875l-1.003 3.193c-.085.342 0 .708.21.986.218.279.537.438.887.438H17.88c.35 0 .669-.16.887-.438.218-.278.288-.636.21-.986h-.008z" />
      </G>
      <Defs>
        <ClipPath id="clip0_2060_11725">
          <Path fill="#fff" transform="translate(5 6)" d="M0 0H14V12H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  );
}

export default OfflineMapIcon;
