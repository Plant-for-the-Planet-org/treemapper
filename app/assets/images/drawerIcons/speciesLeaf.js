import * as React from 'react';
import Svg, { Rect, Path } from 'react-native-svg';

function SpeciesLeaf(props) {
  return (
    <Svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}>
      <Rect width={24} height={24} rx={12} fill="#007A49" />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18.307 17.71c.213-.255.48-.461.693-.717-.48 0-1.012-.051-1.439-.154-.373-.103-.906-.308-1.225-.564l-.107-.051.053-.103c1.44-2.616 1.225-5.077-.959-7.18C13.46 7.146 8.877 6.633 6 7.249l1.012 5.436c.48 3.18 3.197 6.616 7.832 4.82-2.823-2.153-6.127-5.897-6.073-7.384l.426.564c1.492 2.205 6.446 7.077 9.11 7.026z"
        fill="#fff"
      />
    </Svg>
  );
}

export default SpeciesLeaf;
