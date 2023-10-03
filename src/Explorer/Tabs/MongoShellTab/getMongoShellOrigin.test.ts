import { extractFeatures } from "Platform/Hosted/extractFeatures";
import { configContext } from "../../../ConfigContext";
import { updateUserContext } from "../../../UserContext";
import { getMongoShellOrigin } from "./getMongoShellOrigin";

describe("getMongoShellOrigin", () => {
  (window as { origin: string }).origin = "window_origin";

  beforeEach(() => {
    updateUserContext({
      features: extractFeatures(
        new URLSearchParams({
          "feature.enableLegacyMongoShellV1": "false",
          "feature.enableLegacyMongoShellV2": "false",
          "feature.enableLegacyMongoShellV1Debug": "false",
          "feature.enableLegacyMongoShellV2Debug": "false",
          "feature.loadLegacyMongoShellFromBE": "false",
        }),
      ),
    });
  });

  it("should return  by default", () => {
    expect(getMongoShellOrigin()).toBe(window.origin);
  });

  it("should return window.origin when enableLegacyMongoShellV1", () => {
    updateUserContext({
      features: extractFeatures(
        new URLSearchParams({
          "feature.enableLegacyMongoShellV1": "true",
        }),
      ),
    });

    expect(getMongoShellOrigin()).toBe(window.origin);
  });

  it("should return window.origin when enableLegacyMongoShellV2===true", () => {
    updateUserContext({
      features: extractFeatures(
        new URLSearchParams({
          "feature.enableLegacyMongoShellV2": "true",
        }),
      ),
    });

    expect(getMongoShellOrigin()).toBe(window.origin);
  });

  it("should return window.origin when enableLegacyMongoShellV1Debug===true", () => {
    updateUserContext({
      features: extractFeatures(
        new URLSearchParams({
          "feature.enableLegacyMongoShellV1Debug": "true",
        }),
      ),
    });

    expect(getMongoShellOrigin()).toBe(window.origin);
  });

  it("should return window.origin when enableLegacyMongoShellV2Debug===true", () => {
    updateUserContext({
      features: extractFeatures(
        new URLSearchParams({
          "feature.enableLegacyMongoShellV2Debug": "true",
        }),
      ),
    });

    expect(getMongoShellOrigin()).toBe(window.origin);
  });

  it("should return BACKEND_ENDPOINT when loadLegacyMongoShellFromBE===true", () => {
    updateUserContext({
      features: extractFeatures(
        new URLSearchParams({
          "feature.loadLegacyMongoShellFromBE": "true",
        }),
      ),
    });

    expect(getMongoShellOrigin()).toBe(configContext.BACKEND_ENDPOINT);
  });
});
