import * as ko from "knockout";
import { Collection, Database } from "../Contracts/ViewModels";
import { getMaxThroughput } from "./AddCollectionUtility";
import Explorer from "../Explorer/Explorer";

describe("getMaxThroughput", () => {
  it("default unlimited throughput setting", () => {
    const defaults = {
      storage: "100",
      throughput: {
        fixed: 400,
        unlimited: 400,
        unlimitedmax: 1000000,
        unlimitedmin: 400,
        shared: 400
      }
    };

    expect(getMaxThroughput(defaults, {} as Explorer)).toEqual(defaults.throughput.unlimited);
  });

  describe("no unlimited throughput setting", () => {
    const defaults = {
      storage: "100",
      throughput: {
        fixed: 400,
        unlimited: {
          collectionThreshold: 3,
          lessThanOrEqualToThreshold: 400,
          greatThanThreshold: 500
        },
        unlimitedmax: 1000000,
        unlimitedmin: 400,
        shared: 400
      }
    };

    const mockCollection1 = { id: ko.observable("collection1") } as Collection;
    const mockCollection2 = { id: ko.observable("collection2") } as Collection;
    const mockCollection3 = { id: ko.observable("collection3") } as Collection;
    const mockCollection4 = { id: ko.observable("collection4") } as Collection;
    const mockDatabase = {} as Database;
    const mockContainer = {
      databases: ko.observableArray([mockDatabase])
    } as Explorer;

    it("less than or equal to collection threshold", () => {
      mockDatabase.collections = ko.observableArray([mockCollection1, mockCollection2]);
      expect(getMaxThroughput(defaults, mockContainer)).toEqual(
        defaults.throughput.unlimited.lessThanOrEqualToThreshold
      );
    });

    it("exceeds collection threshold", () => {
      mockDatabase.collections = ko.observableArray([
        mockCollection1,
        mockCollection2,
        mockCollection3,
        mockCollection4
      ]);
      expect(getMaxThroughput(defaults, mockContainer)).toEqual(defaults.throughput.unlimited.greatThanThreshold);
    });
  });
});
