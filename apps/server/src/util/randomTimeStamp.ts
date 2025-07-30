export function randomPastTimestamp(daysBack = 1000) {
  const now = Date.now();
  const msInDay = 24 * 60 * 60 * 1000;
  const randomMs = Math.random() * (daysBack * msInDay);
  
  return String(Math.floor(now - randomMs));
}
