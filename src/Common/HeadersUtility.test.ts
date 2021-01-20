import * as HeadersUtility from "./HeadersUtility";
import { ExplorerSettings } from "../Shared/ExplorerSettings";
import { LocalStorageUtility, StorageKey } from "../Shared/StorageUtility";

describe("Headers Utility", () => {
  describe("shouldEnableCrossPartitionKeyForResourceWithPartitionKey()", () => {
    beforeEach(() => {
      ExplorerSettings.createDefaultSettings();
    });

    it("should return true by default", () => {
      expect(HeadersUtility.shouldEnableCrossPartitionKey()).toBe(true);
    });

    it("should return false if the enable cross partition key feed option is false", () => {
      LocalStorageUtility.setEntryString(StorageKey.IsCrossPartitionQueryEnabled, "false");
      expect(HeadersUtility.shouldEnableCrossPartitionKey()).toBe(false);
    });

    it("should return true if the enable cross partition key feed option is true", () => {
      LocalStorageUtility.setEntryString(StorageKey.IsCrossPartitionQueryEnabled, "true");
      expect(HeadersUtility.shouldEnableCrossPartitionKey()).toBe(true);
    });
  });
});
