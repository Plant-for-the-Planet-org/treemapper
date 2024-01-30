import * as React from 'react';
import Svg, { Rect, G, Path, Defs, ClipPath } from 'react-native-svg';

function ProjectDoc(props) {
  return (
    <Svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}>
      <Rect width={24} height={24} rx={12} fill="#007A49" />
      <G clipPath="url(#clip0_2060_11707)">
        <Path
          d="M16.282 5H7.719c-.454 0-.891.171-1.216.473A1.568 1.568 0 006 6.615V16.85c-.046 1.843 2.864 2.78 4.44 1.681.173-.031 7.18-4.961 7.322-5.014a.603.603 0 00.235-.436V6.615c0-.43-.182-.84-.504-1.142A1.776 1.776 0 0016.278 5h.004zm-7.99 5.385c0-.144.06-.28.168-.38a.593.593 0 01.404-.159h6.305a.58.58 0 01.497.27.51.51 0 010 .54.586.586 0 01-.497.27H8.864a.579.579 0 01-.404-.159.524.524 0 01-.169-.38v-.002zm5.155-1.616h-2.864a.579.579 0 01-.497-.27.509.509 0 010-.539.579.579 0 01.497-.27h2.864a.58.58 0 01.497.27.51.51 0 010 .538.586.586 0 01-.497.271zm-1.96 7.722v-2.337c0-.143.06-.28.169-.38a.6.6 0 01.404-.159h3.609l-4.182 2.876z"
          fill="#fff"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_2060_11707">
          <Path fill="#fff" transform="translate(6 5)" d="M0 0H12V14H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  );
}

export default ProjectDoc;
