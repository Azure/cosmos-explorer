import * as InMemoryContentProviderUtils from "./ContentProviders/InMemoryContentProviderUtils";

describe("fromContentUri", () => {
  it("fromContentUri should return valid result", () => {
    const contentUri = "memory://resource/path";
    const result = "resource";

    expect(InMemoryContentProviderUtils.fromContentUri(contentUri)).toEqual(result);
  });

  it("fromContentUri should return undefined on invalid input", () => {
    const contentUri = "invalid";

    expect(InMemoryContentProviderUtils.fromContentUri(contentUri)).toEqual(undefined);
  });

  it("toContentUri should return valid result", () => {
    const path = "resource/path";
    const result = "memory://resource/path";

    expect(InMemoryContentProviderUtils.toContentUri(path)).toEqual(result);
  });
});
