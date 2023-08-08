import * as React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

function PlotIcon(props) {
  return (
    <Svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}>
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4 1a3 3 0 00-3 3v16a3 3 0 003 3h16a3 3 0 003-3V4a3 3 0 00-3-3H4zm6.56 8.153l-1.413 1.414-3.705-3.71L4.01 8.29 4.013 4h4.285L6.855 5.443l3.704 3.71zm7.998-2.296L19.99 8.29V4h-4.284l1.439 1.443-11.703 11.71L4 15.713V20h4.288l-1.433-1.433 11.703-11.71zm-3.711 6.586l3.71 3.71L20 15.713V20h-4.284l1.432-1.433-3.714-3.713 1.413-1.41z"
        fill="#828282"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4 1a3 3 0 00-3 3v16a3 3 0 003 3h16a3 3 0 003-3V4a3 3 0 00-3-3H4zm6.56 8.153l-1.413 1.414-3.705-3.71L4.01 8.29 4.013 4h4.285L6.855 5.443l3.704 3.71zm7.998-2.296L19.99 8.29V4h-4.284l1.439 1.443-11.703 11.71L4 15.713V20h4.288l-1.433-1.433 11.703-11.71zm-3.711 6.586l3.71 3.71L20 15.713V20h-4.284l1.432-1.433-3.714-3.713 1.413-1.41z"
        fill="url(#paint0_linear_2404_97)"
      />
      <Defs>
        <LinearGradient
          id="paint0_linear_2404_97"
          x1={11.52}
          y1={-5.63297}
          x2={11.8809}
          y2={22.7895}
          gradientUnits="userSpaceOnUse">
          <Stop stopColor={props.color ? '#007A49' : '#828282'} />
          <Stop offset={1} stopColor={props.color ? '#68B030' : '#828282'} />
        </LinearGradient>
      </Defs>
    </Svg>
  );
}

export default PlotIcon;
