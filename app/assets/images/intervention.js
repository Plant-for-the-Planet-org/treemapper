import * as React from 'react';
import Svg, { G, Path, Defs, LinearGradient, Stop, ClipPath } from 'react-native-svg';

function Intervention(props) {
  return (
    <Svg
      width={36}
      height={36}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}>
      <G clipPath="url(#clip0_2104_12301)">
        <Path
          d="M19.957 14.78h2.183v-2.082h-2.183v2.083zm7.953 0h2.186v-2.082H27.91v2.083zm-15.906 0h2.183v-2.082h-2.183v2.083zm-7.48 0h1.71v-2.082h-1.71v2.083z"
          fill="#68B030"
        />
        <Path
          d="M19.957 14.78h2.183v-2.082h-2.183v2.083zm7.953 0h2.186v-2.082H27.91v2.083zm-15.906 0h2.183v-2.082h-2.183v2.083zm-7.48 0h1.71v-2.082h-1.71v2.083z"
          fill="#fff"
          fillOpacity={0.2}
        />
        <Path
          d="M19.957 25.751h2.183v-2.083h-2.183v2.083zm7.953 0h2.186v-2.083H27.91v2.083zm-15.906 0h2.183v-2.083h-2.183v2.083zm-7.48 0h1.71v-2.083h-1.71v2.083z"
          fill="#68B030"
        />
        <Path
          d="M19.957 25.751h2.183v-2.083h-2.183v2.083zm7.953 0h2.186v-2.083H27.91v2.083zm-15.906 0h2.183v-2.083h-2.183v2.083zm-7.48 0h1.71v-2.083h-1.71v2.083z"
          fill="#fff"
          fillOpacity={0.2}
        />
        <Path
          d="M25.032 7.089l-2.619 2.615V29.12h5.22V9.704l-2.601-2.615zm0 17.999c-.227 0-.412-.156-.412-.346 0-.19.185-.347.412-.347.227 0 .412.156.412.347 0 .19-.185.346-.412.346zm0-10.97c-.227 0-.412-.156-.412-.347 0-.19.185-.346.412-.346.227 0 .412.156.412.346 0 .19-.185.347-.412.347z"
          fill="url(#paint0_linear_2104_12301)"
        />
        <Path
          d="M17.08 7.089l-2.62 2.615V29.12h5.22V9.704l-2.6-2.615zm0 17.999c-.227 0-.413-.156-.413-.346 0-.19.186-.347.412-.347.227 0 .412.156.412.347 0 .19-.185.346-.412.346zm0-10.97c-.227 0-.413-.156-.413-.347 0-.19.186-.346.412-.346.227 0 .412.156.412.346 0 .19-.185.347-.412.347z"
          fill="url(#paint1_linear_2104_12301)"
        />
        <Path
          d="M9.126 7.089L6.507 9.704V29.12h5.223V9.704L9.126 7.089zm0 17.999c-.227 0-.412-.156-.412-.346 0-.19.185-.347.412-.347.226 0 .412.156.412.347 0 .19-.186.346-.412.346zm0-10.97c-.227 0-.412-.156-.412-.347 0-.19.185-.346.412-.346.226 0 .412.156.412.346 0 .19-.186.347-.412.347z"
          fill="url(#paint2_linear_2104_12301)"
        />
      </G>
      <Defs>
        <LinearGradient
          id="paint0_linear_2104_12301"
          x1={23.5878}
          y1={11.4951}
          x2={29.7714}
          y2={13.2202}
          gradientUnits="userSpaceOnUse">
          <Stop stopColor="#007A49" />
          <Stop offset={1} stopColor="#68B030" />
        </LinearGradient>
        <LinearGradient
          id="paint1_linear_2104_12301"
          x1={15.6349}
          y1={11.4951}
          x2={21.8185}
          y2={13.2202}
          gradientUnits="userSpaceOnUse">
          <Stop stopColor="#007A49" />
          <Stop offset={1} stopColor="#68B030" />
        </LinearGradient>
        <LinearGradient
          id="paint2_linear_2104_12301"
          x1={7.68218}
          y1={11.4951}
          x2={13.8688}
          y2={13.222}
          gradientUnits="userSpaceOnUse">
          <Stop stopColor="#007A49" />
          <Stop offset={1} stopColor="#68B030" />
        </LinearGradient>
        <ClipPath id="clip0_2104_12301">
          <Path fill="#fff" transform="translate(4 7)" d="M0 0H27V22H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  );
}

export default Intervention;
