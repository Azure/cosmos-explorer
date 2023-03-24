import * as EnvironmentUtility from "./EnvironmentUtility";

describe("Environment Utility Test", () => {
  it("Test sample URI with /", () => {
    let uri: string = "test/";
    expect(EnvironmentUtility.normalizeArmEndpoint(uri)).toEqual(uri);
  });

  it("Test sample URI without /", () => {
    let uri: string = "test";
    let expectedResult: string = "test/";
    expect(EnvironmentUtility.normalizeArmEndpoint(uri)).toEqual(expectedResult);
  });
});
