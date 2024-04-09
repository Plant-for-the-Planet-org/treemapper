//Convert the timestamp to this format- 08 Apr 2024
export const timestampToBasicDate = (t: number) => {
  const date = new Date(t)
  const day = date.getDate().toString().padStart(2, '0')
  const month = date.toLocaleString('en-US', {month: 'short'})
  const year = date.getFullYear()
  return `${day} ${month} ${year}`
}
