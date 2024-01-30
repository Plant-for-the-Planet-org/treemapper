import * as React from 'react';
import Svg, { Path, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';

function MultipleTreeIcon(props) {
  return (
    <Svg
      width={36}
      height={36}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}>
      <Path
        d="M28.674 18.201c-.128-5.744-2.2-11.123-5.722-11.123-3.523 0-5.616 5.38-5.616 11.124 0 5.744 4.869 5.744 5.616 5.744.747 0 5.85 0 5.722-5.745z"
        fill="#68B030"
      />
      <Path
        d="M28.674 18.201c-.128-5.744-2.2-11.123-5.722-11.123-3.523 0-5.616 5.38-5.616 11.124 0 5.744 4.869 5.744 5.616 5.744.747 0 5.85 0 5.722-5.745z"
        fill="#fff"
        fillOpacity={0.2}
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M22.375 14.424a.683.683 0 111.367 0v4.864l.709-.709a.683.683 0 01.966.966l-1.675 1.676v7.039h-1.367v-9.881l-1.31-1.31a.683.683 0 01.966-.967l.344.344v-2.023z"
        fill="url(#paint0_linear_2104_12328)"
      />
      <Rect
        x={30.3186}
        y={27.5764}
        width={1.36653}
        height={14.5194}
        rx={0.683264}
        transform="rotate(90 30.319 27.576)"
        fill="#007A49"
      />
      <Path
        d="M11.914 8.181c.603-1.499 2.725-1.499 3.328 0l5.296 13.163a1.794 1.794 0 01-1.664 2.463H8.282a1.794 1.794 0 01-1.664-2.463l5.296-13.163z"
        fill="url(#paint1_linear_2104_12328)"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.895 14.423a.683.683 0 011.367 0v4.864l.708-.708a.683.683 0 01.966.966l-1.674 1.675v7.04h-1.367v-9.881l-1.31-1.31a.683.683 0 11.966-.967l.344.344v-2.023z"
        fill="url(#paint2_linear_2104_12328)"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.895 14.423a.683.683 0 011.367 0v4.864l.708-.708a.683.683 0 01.966.966l-1.674 1.675v7.04h-1.367v-9.881l-1.31-1.31a.683.683 0 11.966-.967l.344.344v-2.023z"
        fill="#fff"
        fillOpacity={0.5}
      />
      <Rect
        x={20.838}
        y={27.5758}
        width={1.36653}
        height={14.5194}
        rx={0.683264}
        transform="rotate(90 20.838 27.576)"
        fill="#007A49"
      />
      <Defs>
        <LinearGradient
          id="paint0_linear_2104_12328"
          x1={22.952}
          y1={13.7402}
          x2={29.8456}
          y2={18.8567}
          gradientUnits="userSpaceOnUse">
          <Stop stopColor="#68B030" />
          <Stop offset={1} stopColor="#007A49" />
        </LinearGradient>
        <LinearGradient
          id="paint1_linear_2104_12328"
          x1={13.877}
          y1={7.16324}
          x2={18.9603}
          y2={21.75}
          gradientUnits="userSpaceOnUse">
          <Stop stopColor="#68B030" />
          <Stop offset={1} stopColor="#007A49" />
        </LinearGradient>
        <LinearGradient
          id="paint2_linear_2104_12328"
          x1={13.4713}
          y1={13.7397}
          x2={20.3649}
          y2={18.8562}
          gradientUnits="userSpaceOnUse">
          <Stop stopColor="#68B030" />
          <Stop offset={1} stopColor="#007A49" />
        </LinearGradient>
      </Defs>
    </Svg>
  );
}

export default MultipleTreeIcon;
