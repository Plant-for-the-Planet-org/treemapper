import * as React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

function UploadSpecies(props) {
  return (
    <Svg
      width={57}
      height={49}
      viewBox="0 0 57 49"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}>
      <Path
        d="M29.81 12.112l.074.022.003-.004a.705.705 0 00.8-.494c.938-3.15 3.893-5.351 7.184-5.351a.706.706 0 000-1.412c-4.045 0-7.444 2.693-8.536 6.361a.705.705 0 00.475.878z"
        fill="url(#paint0_linear_2146_11741)"
        stroke="#F9FFF9"
        strokeWidth={0.240104}
      />
      <Path
        d="M46.07 34.275h-3.514a.586.586 0 010-1.171h3.513c4.844 0 8.785-3.94 8.785-8.785 0-4.843-3.941-8.784-8.785-8.784h-.084a.586.586 0 01-.58-.669c.052-.365.079-.731.079-1.088 0-4.198-3.416-7.613-7.614-7.613-1.633 0-3.19.51-4.504 1.476a.586.586 0 01-.865-.2C28.78.358 19.064-.594 14.027 5.57a11.095 11.095 0 00-2.288 9.264.586.586 0 01-.574.702h-.234c-4.844 0-8.785 3.941-8.785 8.785 0 4.843 3.94 8.785 8.785 8.785h3.513a.586.586 0 010 1.17H10.93c-5.489 0-9.955-4.466-9.955-9.955 0-5.336 4.219-9.705 9.496-9.946a12.256 12.256 0 012.649-9.547c5.393-6.598 15.73-5.858 20.098 1.5a8.708 8.708 0 014.652-1.333c5.086 0 9.116 4.329 8.763 9.386 5.229.293 9.392 4.639 9.392 9.94 0 5.49-4.466 9.955-9.956 9.955z"
        fill="url(#paint1_linear_2146_11741)"
      />
      <Path
        d="M13.66 33.359c0 8.14 6.622 14.761 14.761 14.761 8.14 0 14.761-6.622 14.761-14.761 0-8.14-6.621-14.761-14.76-14.761-8.14 0-14.762 6.622-14.762 14.76zm1.412 0c0-7.36 5.988-13.35 13.35-13.35 7.36 0 13.349 5.99 13.349 13.35 0 7.36-5.99 13.35-13.35 13.35-7.36 0-13.35-5.99-13.35-13.35z"
        fill="url(#paint2_linear_2146_11741)"
        stroke="#F9FFF9"
        strokeWidth={0.240104}
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M32.384 32.506l-3.188-3.189 3.188 3.189zm-3.712 7.266a.507.507 0 01-.49-.506v-9.949 9.949c0 .274.218.498.49.506zm-4.059-7.118a.505.505 0 01-.337-.865l3.108-3.108.925-.924-.924.924-3.109 3.108a.507.507 0 00.337.865zm-.636-1.164L28 27.465a.929.929 0 011.377.002L33.4 31.49a.93.93 0 11-1.315 1.315l-2.466-2.465v8.926a.93.93 0 11-1.86 0v-8.927l-2.467 2.466a.93.93 0 11-1.315-1.315z"
        fill="url(#paint3_linear_2146_11741)"
      />
      <Defs>
        <LinearGradient
          id="paint0_linear_2146_11741"
          x1={31.4577}
          y1={6.39877}
          x2={34.9631}
          y2={11.7029}
          gradientUnits="userSpaceOnUse">
          <Stop stopColor="#007A49" />
          <Stop offset={1} stopColor="#68B030" />
        </LinearGradient>
        <LinearGradient
          id="paint1_linear_2146_11741"
          x1={13.3609}
          y1={7.103}
          x2={28.5017}
          y2={36}
          gradientUnits="userSpaceOnUse">
          <Stop stopColor="#007A49" />
          <Stop offset={1} stopColor="#68B030" />
        </LinearGradient>
        <LinearGradient
          id="paint2_linear_2146_11741"
          x1={20.3686}
          y1={24.5742}
          x2={36.0346}
          y2={43.0221}
          gradientUnits="userSpaceOnUse">
          <Stop stopColor="#007A49" />
          <Stop offset={1} stopColor="#68B030" />
        </LinearGradient>
        <LinearGradient
          id="paint3_linear_2146_11741"
          x1={25.9471}
          y1={29.7687}
          x2={32.9752}
          y2={36.0983}
          gradientUnits="userSpaceOnUse">
          <Stop stopColor="#007A49" />
          <Stop offset={1} stopColor="#68B030" />
        </LinearGradient>
      </Defs>
    </Svg>
  );
}

export default UploadSpecies;
