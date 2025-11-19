import * as StringUtils from "./StringUtils";

describe("StringUtils", () => {
  describe("stripSpacesFromString()", () => {
    it("should strip all spaces from input string", () => {
      const transformedString: string | undefined = StringUtils.stripSpacesFromString("a b c");
      expect(transformedString).toBe("abc");
    });

    it("should return original string if input string has no spaces", () => {
      const transformedString: string | undefined = StringUtils.stripSpacesFromString("abc");
      expect(transformedString).toBe("abc");
    });

    it("should return undefined if input is undefined", () => {
      const transformedString: string | undefined = StringUtils.stripSpacesFromString(undefined);
      expect(transformedString).toBeUndefined();
    });

    it("should return undefined if input is undefiend", () => {
      const transformedString: string | undefined = StringUtils.stripSpacesFromString(undefined);
      expect(transformedString).toBe(undefined);
    });

    it("should return empty string if input is an empty string", () => {
      const transformedString: string | undefined = StringUtils.stripSpacesFromString("");
      expect(transformedString).toBe("");
    });

    it("should return the right number of characters regardless of bytes used per character", () => {
      // Tried to use a sample of characters across the range for each of the individual byte lengths
      const ascii = "!,n~!,n~!,n~";
      const twoByteCharacters = "Āā߿܀Āā߿܀Āā߿܀";
      const threeByteCharacters = "ࠀ倀ꀀ￼ࠀ倀ꀀ￼ࠀ倀ꀀ￼";
      const fourByteCharacters = "𐀀𐔀𐨀𐿶𐀀𐔀𐨀𐿶𐀀𐔀𐨀𐿶";
      // Used a random character generator for each of the different byte-lengths of characters for the mixed tests
      const mixedByteSizes = "Yח䙶𫶾eԚ疿𱺿]߉ꗫ𢆤*ɉ貸𪡑";

      expect(StringUtils.substringUtf(ascii, 0, 5)).toBe("!,n~!");
      expect(StringUtils.substringUtf(twoByteCharacters, 0, 5)).toBe("Āā߿܀Ā");
      expect(StringUtils.substringUtf(threeByteCharacters, 0, 5)).toBe("ࠀ倀ꀀ￼ࠀ");
      expect(StringUtils.substringUtf(fourByteCharacters, 0, 5)).toBe("𐀀𐔀𐨀𐿶𐀀");
      expect(StringUtils.substringUtf(mixedByteSizes, 0, 5)).toBe("Yח䙶𫶾e");
      expect(StringUtils.substringUtf(mixedByteSizes, 4, 4)).toBe("eԚ疿𱺿");
    });
  });
});
