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
describe("normalizeArmEndpoint", () => {
  it("should append '/' if not present", () => {
    expect(EnvironmentUtility.normalizeArmEndpoint("https://example.com")).toBe("https://example.com/");
  });

  it("should return the same uri if '/' is present at the end", () => {
    expect(EnvironmentUtility.normalizeArmEndpoint("https://example.com/")).toBe("https://example.com/");
  });

  it("should handle empty string", () => {
    expect(EnvironmentUtility.normalizeArmEndpoint("")).toBe("");
  });
});

describe("getEnvironment", () => {
  it("should return Prod environment", () => {
    updateConfigContext({
      PORTAL_BACKEND_ENDPOINT: PortalBackendEndpoints.Prod,
    });
    expect(EnvironmentUtility.getEnvironment()).toBe(EnvironmentUtility.Environment.Prod);
  });

  it("should return Fairfax environment", () => {
    updateConfigContext({
      PORTAL_BACKEND_ENDPOINT: PortalBackendEndpoints.Fairfax,
    });
    expect(EnvironmentUtility.getEnvironment()).toBe(EnvironmentUtility.Environment.Fairfax);
  });

  it("should return Mooncake environment", () => {
    updateConfigContext({
      PORTAL_BACKEND_ENDPOINT: PortalBackendEndpoints.Mooncake,
    });
    expect(EnvironmentUtility.getEnvironment()).toBe(EnvironmentUtility.Environment.Mooncake);
  });
});
