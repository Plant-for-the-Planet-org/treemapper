import * as React from 'react';
import Svg, { Rect, G, Path, Defs, ClipPath } from 'react-native-svg';

function LogoutSign(props) {
  return (
    <Svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}>
      <Rect width={24} height={24} rx={12} fill="#EB5757" />
      <G clipPath="url(#clip0_2060_11735)">
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M18 12a6 6 0 11-12 0 6 6 0 0112 0zm-3.544.458l-1.734 1.765c-.713.71-1.782-.355-1.07-1.065l.008-.007c.222-.219.149-.397-.165-.397h-1.387a.756.756 0 01-.755-.758v.008c0-.42.338-.758.755-.758h1.387c.313 0 .388-.178.165-.397l-.007-.007c-.713-.71.356-1.776 1.07-1.066l1.73 1.742c.257.258.258.68.003.94z"
          fill="#fff"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_2060_11735">
          <Path fill="#fff" transform="translate(6 6)" d="M0 0H12V12H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  );
}

export default LogoutSign;
