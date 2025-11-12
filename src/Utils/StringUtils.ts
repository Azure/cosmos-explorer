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

/**
 * Returns the input number of characters from a desired string but takes into account characters encoded with different byte sizes.
 * @param text The text from which to return the subset
 * @param startChar The starting character from @param text (zero-based)
 * @param numChars The number of characters to return starting from @param startChar
 * @returns The resulting slice of characters
 */
export const substringUtf = (text: string, startChar: number, numChars: number) => {
  const encoded = new TextEncoder().encode(text);

  let currentChar = 0;
  let currentByte = 0;
  let startByte = 0;
  for (; currentChar < startChar + numChars; ) {
    if (currentChar === startChar) {
      startByte = currentByte;
    }
    switch (encoded[currentByte]) {
      case 196:
        currentByte = currentByte + 2;
        break;
      case 233:
        currentByte = currentByte + 3;
        break;
      case 240:
        currentByte = currentByte + 4;
        break;
      default:
        currentByte++;
    }
    currentChar++;
  }

  return new TextDecoder().decode(encoded.slice(startByte, currentByte));
};
