import { extractFeatures } from "./extractFeatures";

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
