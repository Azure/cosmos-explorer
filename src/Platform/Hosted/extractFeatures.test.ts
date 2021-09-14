import { extractFeatures, hasFlag } from "./extractFeatures";

describe("extractFeatures", () => {
  it("correctly detects feature flags in a case insensitive manner", () => {
    const url = "https://localhost:10001/12345/notebook";
    const token = "super secret";
    const notebooksEnabled = false;
    const params = new URLSearchParams({
      platform: "Hosted",
      "feature.NOTEBOOKSERVERURL": url,
      "feature.NoTeBooKServerToken": token,
      "feature.NotAFeature": "nope",
      "feature.ENABLEnotebooks": notebooksEnabled.toString(),
    });

    const features = extractFeatures(params);
    expect(features.notebookServerUrl).toBe(url);
    expect(features.notebookServerToken).toBe(token);
    expect(features.enableNotebooks).toBe(notebooksEnabled);
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
