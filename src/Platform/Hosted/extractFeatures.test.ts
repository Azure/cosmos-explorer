import { extractFeatures, hasFlag } from "./extractFeatures";

describe("extractFeatures", () => {
  it("correctly detects feature flags in a case insensitive manner", () => {
    const endpoint = "https://localhost:1234";
    const ttlEnabled = false;
    const params = new URLSearchParams({
      platform: "Hosted",
      "feature.MONGOPROXYENDPOINT": endpoint,
      "feature.NotAFeature": "nope",
      "feature.ENABLEttl": ttlEnabled.toString(),
    });

    const features = extractFeatures(params);
    expect(features.mongoProxyEndpoint).toBe(endpoint);
    expect(features.enableTtl).toBe(ttlEnabled);
  });
});

describe("hasFlag", () => {
  it("correctly determines if value has flag", () => {
    const desiredFlag = "readDocument";

    const singleFlagValue = "readDocument";
    const multipleFlagValues = "readDocument|createDocument";
    const differentFlagValue = "createDocument";

    expect(hasFlag(singleFlagValue, desiredFlag)).toBe(true);
    expect(hasFlag(multipleFlagValues, desiredFlag)).toBe(true);
    expect(hasFlag(differentFlagValue, desiredFlag)).toBe(false);
    expect(hasFlag(multipleFlagValues, undefined as unknown as string)).toBe(false);
    expect(hasFlag(undefined as unknown as string, desiredFlag)).toBe(false);
    expect(hasFlag(undefined as unknown as string, undefined as unknown as string)).toBe(false);
  });
});
