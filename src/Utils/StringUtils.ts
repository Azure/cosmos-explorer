export class StringUtils {
  public static stripSpacesFromString(inputString: string): string {
    if (inputString == null || typeof inputString !== "string") {
      return inputString;
    }
    return inputString.replace(/ /g, "");
  }

  /**
   * Implementation of endsWith which works for IE
   * @param stringToTest
   * @param suffix
   */
  public static endsWith(stringToTest: string, suffix: string): boolean {
    return stringToTest.indexOf(suffix, stringToTest.length - suffix.length) !== -1;
  }

  public static startsWith(stringToTest: string, prefix: string): boolean {
    return stringToTest.indexOf(prefix) === 0;
  }
}
