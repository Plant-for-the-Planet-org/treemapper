export type ElementType = 'INPUT' | 'GAP' | 'HEADING' | 'PAGE' | 'DROPDOWN' | 'FORMULA' | 'YES_NO';

export const elementsType = {
  INPUT: 'INPUT',
  GAP: 'GAP',
  HEADING: 'HEADING',
  PAGE: 'PAGE',
  DROPDOWN: 'DROPDOWN',
  FORMULA: 'FORMULA',
  YES_NO: 'YES_NO',
};

export const inputTypes = {
  TEXT: 'TEXT',
  NUMBER: 'NUMBER',
};

export const nonInputElementsTypes = [elementsType.GAP, elementsType.HEADING, elementsType.PAGE];

export const accessTypes = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  APP: 'app',
};

export const inputOptions = [
  { key: inputTypes.TEXT, value: 'label.text' },
  { key: inputTypes.NUMBER, value: 'label.number' },
];

export const numberRegex = new RegExp(/^[+-]?(?:\d*\.)?\d+$/);

export const theme = {
  scheme: 'monokai',
  author: 'wimer hazenberg (http://www.monokai.nl)',
  base00: '#272822',
  base01: '#383830',
  base02: '#49483e',
  base03: '#75715e',
  base04: '#a59f85',
  base05: '#f8f8f2',
  base06: '#f5f4f1',
  base07: '#f9f8f5',
  base08: '#f92672',
  base09: '#fd971f',
  base0A: '#f4bf75',
  base0B: '#a6e22e',
  base0C: '#a1efe4',
  base0D: '#66d9ef',
  base0E: '#ae81ff',
  base0F: '#cc6633',
};
