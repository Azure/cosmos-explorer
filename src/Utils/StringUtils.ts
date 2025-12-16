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

    /*
    Unicode is utf encoded using 1, 2, 3, or 4 bytes
    In a byte array, we know how many bytes the character is encoded based on the first byte because it
    was developed such that the first byte's range never occurs in any other byte. Subsequent bytes are
    always within 128 and 191. So in binary it breaks down like this:
    1 byte:  0xxxxxxx
    2 bytes: 110xxxxx 10xxxxxx
    3 bytes: 1110xxxx 10xxxxxx 10xxxxxx
    4 bytes: 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
    */
    switch (true) {
      // The originall ASCII set is between 0 (00000000) and 127 (01111111) and those only take up one byte
      case encoded[currentByte] >= 0 && encoded[currentByte] <= 127:
        currentByte++;
        break;
      // But if the first byte is within 192 (11000000) and 223 (11011111) then we know the character is two bytes:
      case encoded[currentByte] >= 192 && encoded[currentByte] <= 223:
        currentByte = currentByte + 2;
        break;
      // If the first byte is anything within 224 (11100000) and 239 (11101111) then the character is three bytes
      case encoded[currentByte] >= 224 && encoded[currentByte] <= 239:
        currentByte = currentByte + 3;
        break;
      // If the first byte is anything within 240 (11110000) and 247 (11110111) then the character is four bytes
      case encoded[currentByte] >= 240 && encoded[currentByte] <= 247:
        currentByte = currentByte + 4;
        break;
      // Anything past is an error for now
      default:
        throw new Error("Unrecognized character");
    }
    currentChar++;
  }

  return new TextDecoder().decode(encoded.slice(startByte, currentByte));
};
