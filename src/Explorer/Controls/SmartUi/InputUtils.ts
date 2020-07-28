/* Utilities for validation */

export const onValidateValueChange = (newValue: string, minValue?: number, maxValue?: number): number | undefined => {
  let numericValue = parseInt(newValue);
  if (!isNaN(numericValue) && isFinite(numericValue)) {
    if (minValue !== undefined && numericValue < minValue) {
      numericValue = minValue;
    }
    if (maxValue !== undefined && numericValue > maxValue) {
      numericValue = maxValue;
    }

    return Math.floor(numericValue);
  }

  return undefined;
};

export const onIncrementValue = (newValue: string, step: number, max?: number): number | undefined => {
  const numericValue = parseInt(newValue);
  if (!isNaN(numericValue) && isFinite(numericValue)) {
    const newValue = numericValue + step;
    return max !== undefined ? Math.min(max, newValue) : newValue;
  }
  return undefined;
};

export const onDecrementValue = (newValue: string, step: number, min?: number): number | undefined => {
  const numericValue = parseInt(newValue);
  if (!isNaN(numericValue) && isFinite(numericValue)) {
    const newValue = numericValue - step;
    return min !== undefined ? Math.max(min, newValue) : newValue;
  }
  return undefined;
};
