import * as StringUtils from "./StringUtils";

describe("StringUtils", () => {
  describe("stripSpacesFromString()", () => {
    it("should strip all spaces from input string", () => {
      const transformedString: string = StringUtils.stripSpacesFromString("a b c");
      expect(transformedString).toBe("abc");
    });

    it("should return original string if input string has no spaces", () => {
      const transformedString: string = StringUtils.stripSpacesFromString("abc");
      expect(transformedString).toBe("abc");
    });

    it("should return empty string if input is an empty string", () => {
      const transformedString: string = StringUtils.stripSpacesFromString("");
      expect(transformedString).toBe("");
    });
  });
});
