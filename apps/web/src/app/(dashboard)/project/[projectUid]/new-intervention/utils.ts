export function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function generateUID() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function validateTreeMeasurement(value: string, label: string) {
  const numValue = parseFloat(value);

  if (isNaN(numValue)) {
    return {
      isValid: false,
      error: `${label} must be a valid number`
    };
  }

  const decimalPlaces = (value.toString().split('.')[1] || '').length;
  if (decimalPlaces > 2) {
    return {
      isValid: false,
      error: `${label} can have maximum 2 decimal places`
    };
  }

  if (numValue <= 0) {
    return {
      isValid: false,
      error: `${label} must be greater than 0`
    };
  }

  if (numValue > 200) {
    return {
      isValid: false,
      error: `${label} cannot exceed 200 meters`
    };
  }

  return {
    isValid: true,
    value: numValue
  };
}
