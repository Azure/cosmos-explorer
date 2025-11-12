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
      const ascii = "aaaaaaaaaa";
      const twoByteCharacters = "ĀĀĀĀĀĀĀĀĀĀ";
      const threeByteCharacters = "麥麥麥麥麥麥麥麥麥麥";
      const fourByteCharacters = "𮮐𮮐𮮐𮮐𮮐𮮐𮮐𮮐𮮐𮮐";
      const mixedByteSizes = "1Ā麥𮮐2Ā麥𮮐3Ā麥𮮐4Ā麥𮮐5Ā麥𮮐";

      expect(StringUtils.substringUtf(ascii, 0, 5)).toBe("aaaaa");
      expect(StringUtils.substringUtf(twoByteCharacters, 0, 5)).toBe("ĀĀĀĀĀ");
      expect(StringUtils.substringUtf(threeByteCharacters, 0, 5)).toBe("麥麥麥麥麥");
      expect(StringUtils.substringUtf(fourByteCharacters, 0, 5)).toBe("𮮐𮮐𮮐𮮐𮮐");
      expect(StringUtils.substringUtf(mixedByteSizes, 0, 5)).toBe("1Ā麥𮮐2");
      expect(StringUtils.substringUtf(mixedByteSizes, 4, 4)).toBe("2Ā麥𮮐");
    });
  });
});
