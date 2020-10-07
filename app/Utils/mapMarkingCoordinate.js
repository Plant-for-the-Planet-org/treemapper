function toLetters(num) {
  'use strict';
  var mod = num % 26;
  var pow = num / 26 | 0;
  var out = mod ? String.fromCharCode(64 + mod) : (pow--, 'Z');
  return pow ? toLetters(pow) + out : out;
}

function fromLetters(str) {
  'use strict';
  var out = 0,
    len = str.length,
    pos = len;
  while ((pos -= 1) > -1) {
    out += (str.charCodeAt(pos) - 64) * Math.pow(26, len - 1 - pos);
  }
  return out;
}

export {toLetters, fromLetters};