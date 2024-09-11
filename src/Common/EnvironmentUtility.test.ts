import { PortalBackendEndpoints } from "Common/Constants";
import { updateConfigContext } from "ConfigContext";
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

  it("Detect environment is Mpac", () => {
    updateConfigContext({
      PORTAL_BACKEND_ENDPOINT: PortalBackendEndpoints.Mpac,
    });
    expect(EnvironmentUtility.getEnvironment()).toBe(EnvironmentUtility.Environment.Mpac);
  });

  it("Detect environment is Development", () => {
    updateConfigContext({
      PORTAL_BACKEND_ENDPOINT: PortalBackendEndpoints.Development,
    });
    expect(EnvironmentUtility.getEnvironment()).toBe(EnvironmentUtility.Environment.Development);
  });
});
