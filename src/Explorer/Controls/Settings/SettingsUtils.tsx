export interface StatefulValue<T> {
  baseline: T;
  current: T;
  isValid: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isDirty(value: StatefulValue<any>): boolean {
  let current = value.current;
  let baseline = value.baseline;
  switch (typeof current) {
    case "string":
    case "undefined":
    case "number":
    case "boolean":
      current = current && current.toString();
      break;

    default:
      current = JSON.stringify(current);
      break;
  }

  switch (typeof baseline) {
    case "string":
    case "undefined":
    case "number":
    case "boolean":
      baseline = baseline && baseline.toString();
      break;

    default:
      baseline = JSON.stringify(baseline);
      break;
  }

  if (current !== baseline) {
    return true;
  }

  return false;
}
