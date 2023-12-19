import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

function ArrowBack(props) {
  return (
    <Svg
      width={18}
      height={20}
      viewBox="0 0 18 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}>
      <Path
        d="M16.707 8.577H6.534a.681.681 0 01-.383-.119.706.706 0 01-.255-.316.725.725 0 01.144-.77L9.87 3.41c.238-.247.372-.58.372-.927 0-.347-.134-.68-.373-.927l-.168-.172a1.285 1.285 0 00-.91-.386 1.26 1.26 0 00-.91.386L.37 9.063c-.237.25-.37.584-.37.932 0 .348.133.682.37.932l7.51 7.688a1.283 1.283 0 00.91.387 1.26 1.26 0 00.911-.387l.168-.172c.239-.247.373-.58.373-.927 0-.347-.134-.68-.373-.927l-3.83-3.96a.714.714 0 01-.143-.771.706.706 0 01.255-.316.682.682 0 01.383-.119h10.173c.341 0 .668-.139.91-.386.241-.246.377-.581.377-.93v-.213c0-.35-.136-.684-.377-.931a1.271 1.271 0 00-.91-.386z"
        fill={props.color || '#000'}
        fillOpacity={0.87}
      />
    </Svg>
  );
}

export default ArrowBack;