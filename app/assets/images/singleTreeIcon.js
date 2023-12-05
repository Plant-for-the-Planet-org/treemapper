import * as React from 'react';
import Svg, { Path, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';

function SingleTreeIcon(props) {
  return (
    <Svg
      width={props?.width || 36}
      height={props?.height || 36}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}>
      <Path
        d="M25.065 18.21C24.893 11.904 22.11 6 17.373 6c-4.735 0-7.548 5.905-7.548 12.21 0 6.305 6.544 6.305 7.548 6.305 1.005 0 7.864 0 7.692-6.305z"
        fill="url(#paint0_linear_2104_12314)"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.599 14.231a.918.918 0 011.837 0v5.171l.952-.777a1.07 1.07 0 011.299 0c.359.292.359.767 0 1.06l-2.251 1.839v7.726h-1.837V18.405l-1.762-1.439c-.358-.293-.358-.767 0-1.06a1.07 1.07 0 011.3 0l.462.377v-2.052z"
        fill="#68B030"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.599 14.231a.918.918 0 011.837 0v5.171l.952-.777a1.07 1.07 0 011.299 0c.359.292.359.767 0 1.06l-2.251 1.839v7.726h-1.837V18.405l-1.762-1.439c-.358-.293-.358-.767 0-1.06a1.07 1.07 0 011.3 0l.462.377v-2.052z"
        fill="#fff"
        fillOpacity={0.2}
      />
      <Rect
        x={27.2749}
        y={28.5}
        width={1.49996}
        height={19.5166}
        rx={0.749982}
        transform="rotate(90 27.275 28.5)"
        fill="#007A49"
      />
      <Defs>
        <LinearGradient
          id="paint0_linear_2104_12314"
          x1={17.4594}
          y1={6}
          x2={23.0071}
          y2={22.6688}
          gradientUnits="userSpaceOnUse">
          <Stop stopColor="#68B030" />
          <Stop offset={1} stopColor="#007A49" />
        </LinearGradient>
      </Defs>
    </Svg>
  );
}

export default SingleTreeIcon;
