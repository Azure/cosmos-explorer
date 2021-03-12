import * as StringUtility from "./StringUtility";

describe("String utility", () => {
  it("Convert to integer from string", () => {
    expect(StringUtility.toNumber("123")).toBe(123);
  });

  it("Convert to boolean from string (true)", () => {
    expect(StringUtility.toBoolean("true")).toBe(true);
  });

  it("Convert to boolean from string (false)", () => {
    expect(StringUtility.toBoolean("false")).toBe(false);
  });
});
