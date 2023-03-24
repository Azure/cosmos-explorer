import * as EnvironmentUtility from "./EnvironmentUtility";

describe("Environment Utility Test", () => {
  it("Test sample URI with /", () => {
    const uri = "test/";
    expect(EnvironmentUtility.normalizeArmEndpoint(uri)).toEqual(uri);
  });

  it("Test sample URI without /", () => {
    const uri = "test";
    const expectedResult = "test/";
    expect(EnvironmentUtility.normalizeArmEndpoint(uri)).toEqual(expectedResult);
  });
});
