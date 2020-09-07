import { collection, container } from "./TestUtils";
import { getMaxRUs, getMinRUs } from "./SettingsUtils";

describe("SettingsUtils", () => {
  it("getMaxRUs", () => {
    expect(collection.offer().content.collectionThroughputInfo.numPhysicalPartitions).toEqual(4);
    expect(getMaxRUs(collection, container)).toEqual(40000);
  });

  it("getMinRUs", () => {
    expect(collection.offer().content.collectionThroughputInfo.numPhysicalPartitions).toEqual(4);
    expect(getMinRUs(collection, container)).toEqual(6000);
  });
});
