import React from 'react';
import Svg, { Circle, Ellipse, G, Text, Path } from 'react-native-svg';

function MarkerSVG({ point, color, opacity = 1 }) {
  return (
    <Svg xmlns="http://www.w3.org/2000/svg" width="38" height="91" viewBox="0 0 38 91">
      <G data-name="Group 2286" transform="translate(-101 -368)" opacity={opacity}>
        <G data-name="Group 1661" transform="translate(-38 -63.09)">
          <Path
            fill="none"
            d="M0 0H38V38H0z"
            data-name="Rectangle 906"
            transform="translate(139 448.09)"></Path>
          <G data-name="Group 1583" transform="translate(143.761 431.174)">
            <Ellipse
              cx="14"
              cy="14.5"
              fill={color}
              data-name="Ellipse 172"
              rx="14"
              ry="14.5"
              transform="translate(.239 -.084)"></Ellipse>
            <Text fill="white" fontSize="16" x="14.5" y="20" textAnchor="middle" fontWeight="bold">
              {point}
            </Text>
            <Path
              fill={color}
              d="M5 0l5 5H0z"
              data-name="Polygon 1"
              transform="rotate(180 9.62 15.958)"></Path>
          </G>
          <Path
            fill="none"
            stroke={color}
            strokeWidth="1"
            d="M0 0L0 17"
            data-name="Line 38"
            transform="translate(158 460.59)"></Path>
          <Circle
            cx="2"
            cy="2"
            r="2"
            fill={color}
            data-name="Ellipse 184"
            transform="translate(156 475)"></Circle>
        </G>
      </G>
    </Svg>
  );
}

export default MarkerSVG;
