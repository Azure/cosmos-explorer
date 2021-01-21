import { extractFeatures } from "./extractFeatures";

describe("extractFeatures", () => {
  it("correctly detects feature flags", () => {
    // Search containing non-features, with Camelcase keys and uri encoded values
    const params = new URLSearchParams(
      "?platform=Hosted&feature.notebookserverurl=https%3A%2F%2Flocalhost%3A10001%2F12345%2Fnotebook&feature.notebookServerToken=token&feature.enablenotebooks=true&key=mykey"
    );
    const features = extractFeatures(params);

    expect(features).toEqual({
      notebookserverurl: "https://localhost:10001/12345/notebook",
      notebookservertoken: "token",
      enablenotebooks: "true"
    });
  });
});
