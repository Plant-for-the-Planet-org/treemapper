import * as React from 'react';
import Svg, { G, Path, Defs, LinearGradient, Stop, ClipPath } from 'react-native-svg';

function CrossArrow(props) {
  return (
    <Svg
      width={36}
      height={36}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}>
      <G clipPath="url(#clip0_2104_12289)">
        <Path
          d="M11.41 25.962h3.35v3.321a.719.719 0 01-.72.719h-1.913a.719.719 0 01-.718-.719v-3.321h.002z"
          fill="url(#paint0_linear_2104_12289)"
        />
        <Path
          d="M18.7 13.678l-1.403 1.307a.718.718 0 01-1.01-.03L14.76 13.35v8.392h-3.35v-8.368l-1.468 1.572a.721.721 0 01-1.015.035l-1.402-1.305a.718.718 0 01-.035-1.015l5.07-5.434a.72.72 0 011.048-.002l5.126 5.434a.717.717 0 01-.034 1.02z"
          fill="url(#paint1_linear_2104_12289)"
        />
        <Path
          d="M23.325 18.297l-1.306 1.401a.718.718 0 00.036 1.015l1.572 1.47H7.719A.719.719 0 007 22.9v1.912c0 .397.322.719.719.719H23.65l-1.605 1.528a.718.718 0 00-.03 1.01l1.308 1.405a.719.719 0 001.018.033l5.434-5.126a.72.72 0 00-.002-1.048l-5.432-5.069a.718.718 0 00-1.015.035l-.002-.003z"
          fill="#68B030"
        />
        <Path
          d="M23.325 18.297l-1.306 1.401a.718.718 0 00.036 1.015l1.572 1.47H7.719A.719.719 0 007 22.9v1.912c0 .397.322.719.719.719H23.65l-1.605 1.528a.718.718 0 00-.03 1.01l1.308 1.405a.719.719 0 001.018.033l5.434-5.126a.72.72 0 00-.002-1.048l-5.432-5.069a.718.718 0 00-1.015.035l-.002-.003z"
          fill="#fff"
          fillOpacity={0.2}
        />
      </G>
      <Defs>
        <LinearGradient
          id="paint0_linear_2104_12289"
          x1={12.1626}
          y1={26.7699}
          x2={14.3523}
          y2={28.9084}
          gradientUnits="userSpaceOnUse">
          <Stop stopColor="#007A49" />
          <Stop offset={1} stopColor="#68B030" />
        </LinearGradient>
        <LinearGradient
          id="paint1_linear_2104_12289"
          x1={9.91423}
          y1={9.94807}
          x2={17.8857}
          y2={17.3552}
          gradientUnits="userSpaceOnUse">
          <Stop stopColor="#007A49" />
          <Stop offset={1} stopColor="#68B030" />
        </LinearGradient>
        <ClipPath id="clip0_2104_12289">
          <Path fill="#fff" transform="translate(7 7)" d="M0 0H23V23H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  );
}

export default CrossArrow;
