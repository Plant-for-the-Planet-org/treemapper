export const isWithin90Days = (timestamp: number) => {
  const timestampDate = new Date(timestamp)
  const ninetyDaysAgo = new Date(
    timestampDate.getTime() - 90 * 24 * 60 * 60 * 1000,
  )
  return timestampDate >= ninetyDaysAgo
}
