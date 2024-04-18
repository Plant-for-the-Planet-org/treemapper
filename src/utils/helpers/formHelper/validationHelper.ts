export const validateNumber = (value: number | string, label: string) => {
  const n = Number(value)
  const result = {hasError: false, errorMessage: ''}
  if (n === 0) {
    return {hasError: true, errorMessage: `${label} can not be zero`}
  }
  return result;
}
