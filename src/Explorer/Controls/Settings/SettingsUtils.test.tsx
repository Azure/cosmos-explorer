import { collection, container } from "./TestUtils";
import { getMaxRUs, getMinRUs, isDirty, isDirtyTypes } from "./SettingsUtils";
import * as DataModels from "../../../Contracts/DataModels";

describe("SettingsUtils", () => {
  it("getMaxRUs", () => {
    expect(collection.offer().content.collectionThroughputInfo.numPhysicalPartitions).toEqual(4);
    expect(getMaxRUs(collection, container)).toEqual(40000);
  });

  it("getMinRUs", () => {
    expect(collection.offer().content.collectionThroughputInfo.numPhysicalPartitions).toEqual(4);
    expect(getMinRUs(collection, container)).toEqual(6000);
  });

  describe("isDirty", () => {
    const testStatefulValue = (baseline: isDirtyTypes, current: isDirtyTypes) => {
      expect(isDirty(baseline, baseline)).toEqual(false);
      expect(isDirty(baseline, current)).toEqual(true);
    };

    const indexingPolicy = {
      automatic: true,
      indexingMode: "consistent",
      includedPaths: [],
      excludedPaths: []
    } as DataModels.IndexingPolicy;

    it("string", () => {
      testStatefulValue("baseline", "current");
    });

    it("number", () => {
      testStatefulValue(0, 1);
    });

    it("boolean", () => {
      testStatefulValue(true, false);
    });

    it("undefined object", () => {
      testStatefulValue(undefined, indexingPolicy);
    });

    it("object", () => {
      testStatefulValue(indexingPolicy, { ...indexingPolicy, automatic: false });
    });
  });
});
