export function sortJsonKeys(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sortJsonKeys);
  }
  
  const sortedObj = {};
  Object.keys(obj).sort().forEach(key => {
    sortedObj[key] = sortJsonKeys(obj[key]);
  });
  
  return sortedObj;
}

export async function generateJsonIdempotencyKey(jsonData) {
  const sortedData = sortJsonKeys(jsonData);
  const jsonString = JSON.stringify(sortedData);
  
  const encoder = new TextEncoder();
  const data = encoder.encode(jsonString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}