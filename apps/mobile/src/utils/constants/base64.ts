import { Buffer } from 'buffer';

export function toBase64(input) {
  return Buffer.from(input, 'utf-8').toString('base64');
}

export function fromBase64(encoded) {
  return Buffer.from(encoded, 'base64').toString('utf8');
}
