import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

function Exclamation(props) {
  return (
    <Svg
      width={5}
      height={18}
      viewBox="0 0 5 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}>
      <Path
        opacity={0.2}
        d="M3.457 11.296H.636L.046 0h4l-.589 11.296zM0 15.252c0-.725.197-1.233.59-1.526.4-.293.882-.44 1.445-.44.547 0 1.017.147 1.41.44.401.293.602.801.602 1.526 0 .694-.2 1.195-.601 1.503-.394.308-.864.462-1.411.462-.563 0-1.044-.154-1.445-.462-.393-.308-.59-.81-.59-1.503z"
        fill="#000"
      />
    </Svg>
  );
}

export default Exclamation;
