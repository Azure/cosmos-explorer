export function stripSpacesFromString(inputString?: string): string | undefined {
  if (inputString === undefined || typeof inputString !== "string") {
    return inputString;
  }
  return inputString.replace(/ /g, "");
}

/**
 * Implementation of endsWith which works for IE
 * @param stringToTest
 * @param suffix
 */
export function endsWith(stringToTest: string, suffix: string): boolean {
  return stringToTest.indexOf(suffix, stringToTest.length - suffix.length) !== -1;
}

export function startsWith(stringToTest: string, prefix: string): boolean {
  return stringToTest.indexOf(prefix) === 0;
}
