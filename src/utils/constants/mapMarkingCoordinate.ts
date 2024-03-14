function toLetters(num) {
  'use strict';
  const mod = num % 26;
  let pow = num / 26 | 0;
  const out = mod ? String.fromCharCode(64 + mod) : (pow--, 'Z');
  return pow ? toLetters(pow) + out : out;
}

function fromLetters(str) {
  'use strict';
  let out = 0
   const len = str.length
   let pos = len;
  while ((pos -= 1) > -1) {
    out += (str.charCodeAt(pos) - 64) * Math.pow(26, len - 1 - pos);
  }
  return out;
}

export {toLetters, fromLetters};