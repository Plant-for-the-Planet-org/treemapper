export function isValidEmailDomain(domain) {
  if (!domain || typeof domain !== 'string') {
    return false;
  }

  // Remove @ prefix if present
  const cleanDomain = domain.startsWith('@') ? domain.slice(1) : domain;
  
  // Check if domain is empty after cleaning
  if (!cleanDomain) {
    return false;
  }

  // Basic domain validation regex
  // - Must contain at least one dot
  // - Must not start or end with a dot or hyphen
  // - Must contain only valid characters (letters, numbers, dots, hyphens)
  // - Each part between dots must be 1-63 characters
  // - Total length must be <= 253 characters
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  // Check basic format
  if (!domainRegex.test(cleanDomain)) {
    return false;
  }
  
  // Check total length
  if (cleanDomain.length > 253) {
    return false;
  }
  
  // Must contain at least one dot
  if (!cleanDomain.includes('.')) {
    return false;
  }
  
  // Split by dots and validate each part
  const parts = cleanDomain.split('.');
  
  // Must have at least 2 parts (e.g., domain.com)
  if (parts.length < 2) {
    return false;
  }
  
  // Each part must be valid
  for (const part of parts) {
    if (!part || part.length === 0 || part.length > 63) {
      return false;
    }
    
    // Cannot start or end with hyphen
    if (part.startsWith('-') || part.endsWith('-')) {
      return false;
    }
  }
  
  // Top-level domain (last part) must be at least 2 characters and contain only letters
  const tld = parts[parts.length - 1];
  if (tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
    return false;
  }
  
  return true;
}

