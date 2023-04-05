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
          "feature.enableLegacyMongoShellV1Dist": "false",
          "feature.enableLegacyMongoShellV2Dist": "false",
        })
      ),
    });
  });

  it("should return BACKEND_ENDPOINT by default", () => {
    expect(getMongoShellOrigin()).toBe(configContext.BACKEND_ENDPOINT);
  });

  it("should return /mongoshell/index.html when enableLegacyMongoShellV1", () => {
    updateUserContext({
      features: extractFeatures(
        new URLSearchParams({
          "feature.enableLegacyMongoShellV1": "true",
        })
      ),
    });

    expect(getMongoShellOrigin()).toBe(window.origin);
  });

  it("should return /mongoshell/index.html when enableLegacyMongoShellV2===true", () => {
    updateUserContext({
      features: extractFeatures(
        new URLSearchParams({
          "feature.enableLegacyMongoShellV2": "true",
        })
      ),
    });

    expect(getMongoShellOrigin()).toBe(window.origin);
  });

  it("should return /mongoshell/index.html when enableLegacyMongoShellV1Dist===true", () => {
    updateUserContext({
      features: extractFeatures(
        new URLSearchParams({
          "feature.enableLegacyMongoShellV1Dist": "true",
        })
      ),
    });

    expect(getMongoShellOrigin()).toBe(window.origin);
  });

  it("should return /mongoshell/index.html when enableLegacyMongoShellV2Dist===true", () => {
    updateUserContext({
      features: extractFeatures(
        new URLSearchParams({
          "feature.enableLegacyMongoShellV2Dist": "true",
        })
      ),
    });

    expect(getMongoShellOrigin()).toBe(window.origin);
  });
});
