export const validateNumber = (value: string, label: string, key: string) => {
  try {
    if(value===''){
      return { hasError: true, errorMessage: `${label} can not be empty.`, key }
    }
    const n = Number(value)
    if (isNaN(n)) {
      return { hasError: true, errorMessage: `${label} is not a valid.`, key }
    }
    if (n === 0) {
      return { hasError: true, errorMessage: `${label} can not be zero.`, key }
    }
    if (n<=0) {
      return { hasError: true, errorMessage: `${label} can not have negative value.`, key }
    }
    return { hasError: false, errorMessage: '', label, key }
  } catch (err) {
    return { hasError: true, errorMessage: `Not a valid number`, key }
  }
}