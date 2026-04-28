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
