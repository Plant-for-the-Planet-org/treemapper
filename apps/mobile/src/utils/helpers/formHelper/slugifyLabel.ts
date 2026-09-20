// Turns a human label into the key a metadata entry is stored under. One
// definition on purpose: form answers, manual metadata entries and the fields
// added on the review screen all have to slug the same way, or the same label
// lands under two different keys in the upload payload.
export const slugifyLabel = (label: string): string =>
  (label || '').trim().toLowerCase().replace(/\s+/g, '-')
