export function formatNumber(num) {
  // Handle negative numbers
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  
  // Handle numbers less than 1000
  if (absNum < 1000) {
    return num.toString();
  }
  
  // Define the suffixes and their thresholds
  const suffixes = [
    { threshold: 1e12, suffix: 't' },  // trillion
    { threshold: 1e9, suffix: 'b' },   // billion
    { threshold: 1e6, suffix: 'm' },   // million
    { threshold: 1e3, suffix: 'k' }    // thousand
  ];
  
  // Find the appropriate suffix
  for (const { threshold, suffix } of suffixes) {
    if (absNum >= threshold) {
      const formatted = absNum / threshold;
      
      // Format to remove unnecessary decimals
      let result;
      if (formatted >= 100) {
        result = Math.floor(formatted); // No decimals for 100k+
      } else if (formatted >= 10) {
        result = Math.round(formatted * 10) / 10; // 1 decimal for 10k-99k
      } else {
        result = Math.round(formatted * 100) / 100; // 2 decimals for 1k-9k
      }
      
      // Remove trailing zeros and decimal point if not needed
      const cleanResult = result % 1 === 0 ? result.toString() : result.toString().replace(/\.?0+$/, '');
      
      return (isNegative ? '-' : '') + cleanResult + suffix;
    }
  }
  
  return num.toString();
}
