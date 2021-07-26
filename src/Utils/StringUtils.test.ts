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
  });
});
