import * as ViewModels from "../Contracts/ViewModels";
import ko from "knockout";
import { AddDbUtilities } from "../Shared/AddDatabaseUtility";
import {
  CollectionDefaults,
  CreateCollectionUtilities,
  CreateSqlCollectionUtilities,
  Utilities
} from "./AddCollectionUtility";
import { CollectionStub, DatabaseStub, ExplorerStub } from "../Explorer/OpenActionsStubs";
jest.mock("AddDatabaseUtility");

const armEndpoint = "https://management.azure.com";

describe("Add Collection Utitlity", () => {
  describe("createSqlCollection", () => {
    it("should invoke createSqlCollectionWithARM if create database is false", () => {
      const properties = {
        uniqueKeyPolicy: { uniqueKeys: [{ paths: [""] }] },
        cd: false,
        coll: "abc-collection",
        db: "a1-db",
        dba: "main",
        offerThroughput: 50000,
        pk: "state",
        sid: "a1",
        rg: "b1",
        st: true,
        defaultTtl: -1,
        partitionKeyVersion: 2
      };
      const additionalOptions = {};
      const createSqlCollectionWithARMSpy = jest.spyOn(CreateSqlCollectionUtilities, "createSqlCollectionWithARM");
      CreateSqlCollectionUtilities.createSqlCollection(
        armEndpoint,
        properties.db,
        properties.defaultTtl,
        properties.coll,
        properties.offerThroughput,
        properties.pk,
        properties.partitionKeyVersion,
        properties.cd,
        properties.st,
        properties.sid,
        properties.rg,
        properties.dba,
        properties.uniqueKeyPolicy,
        additionalOptions
      );
      expect(createSqlCollectionWithARMSpy).toHaveBeenCalled();
    });

    it("should invoke createSqlDatabase + createSqlCollectionWithARM if create database is true", () => {
      const properties = {
        uniqueKeyPolicy: { uniqueKeys: [{ paths: [""] }] },
        cd: true,
        coll: "abc-collection",
        db: "a1-db",
        dba: "main",
        offerThroughput: 50000,
        pk: "state",
        sid: "a1",
        rg: "b1",
        st: true,
        analyticalStorageTtl: -1,
        partitionKeyVersion: 2
      };
      const additionalOptions = {};
      const createSqlCollectionWithARMSpy = jest.spyOn(CreateSqlCollectionUtilities, "createSqlCollectionWithARM");
      const createSqlDatabaseSpy = jest.spyOn(AddDbUtilities, "createSqlDatabase");
      CreateSqlCollectionUtilities.createSqlCollection(
        armEndpoint,
        properties.db,
        properties.analyticalStorageTtl,
        properties.coll,
        properties.offerThroughput,
        properties.pk,
        properties.partitionKeyVersion,
        properties.cd,
        properties.st,
        properties.sid,
        properties.rg,
        properties.dba,
        properties.uniqueKeyPolicy,
        additionalOptions
      );
      expect(createSqlCollectionWithARMSpy).toHaveBeenCalled();
      expect(createSqlDatabaseSpy).toHaveBeenCalled();
    });
  });
});

describe("Add Collection Utitlity", () => {
  describe("createGremlinGraph", () => {
    it("should invoke createGremlinGraphWithARM if create database is false", () => {
      const properties = {
        cd: false,
        coll: "abc-collection",
        db: "a1-db",
        dba: "main",
        offerThroughput: 50000,
        pk: "state",
        sid: "a1",
        rg: "b1",
        st: true,
        partitionKeyVersion: 2
      };
      const additionalOptions = {};
      const createGremlinGraphWithARMSpy = jest.spyOn(CreateCollectionUtilities, "createGremlinGraphWithARM");
      CreateCollectionUtilities.createGremlinGraph(
        armEndpoint,
        properties.db,
        properties.coll,
        properties.offerThroughput,
        properties.pk,
        properties.partitionKeyVersion,
        properties.cd,
        properties.st,
        properties.sid,
        properties.rg,
        properties.dba,
        additionalOptions
      );
      expect(createGremlinGraphWithARMSpy).toHaveBeenCalled();
    });

    it("should invoke createGremlinDatabase + createGremlinGraphWithARM if create database is true", () => {
      const properties = {
        cd: true,
        coll: "abc-collection",
        db: "a1-db",
        dba: "main",
        offerThroughput: 50000,
        pk: "state",
        sid: "a1",
        rg: "b1",
        st: true,
        partitionKeyVersion: 2
      };
      const additionalOptions = {};
      const createGremlinGraphWithARMSpy = jest.spyOn(CreateCollectionUtilities, "createGremlinGraphWithARM");
      const createGremlinDatabaseSpy = jest.spyOn(AddDbUtilities, "createGremlinDatabase");
      CreateCollectionUtilities.createGremlinGraph(
        armEndpoint,
        properties.db,
        properties.coll,
        properties.offerThroughput,
        properties.pk,
        properties.partitionKeyVersion,
        properties.cd,
        properties.st,
        properties.sid,
        properties.rg,
        properties.dba,
        additionalOptions
      );
      expect(createGremlinDatabaseSpy).toHaveBeenCalled();
      expect(createGremlinGraphWithARMSpy).toHaveBeenCalled();
    });
  });
});

describe("Add Collection Utilility", () => {
  describe("_getDefaults()", () => {
    describe("default storage", () => {
      describe("for Benefits subscriptions", () => {
        it("should be '100' in flight '0'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("0", ViewModels.SubscriptionType.Benefits);
          expect(value.storage).toBe("100");
        });

        it("should be '100' in flight '1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("1", ViewModels.SubscriptionType.Benefits);
          expect(value.storage).toBe("100");
        });

        it("should be '100' in flight '2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("2", ViewModels.SubscriptionType.Benefits);
          expect(value.storage).toBe("100");
        });

        it("should be '100' in flight '3'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("3", ViewModels.SubscriptionType.Benefits);
          expect(value.storage).toBe("100");
        });
      });

      describe("for EA subscriptions", () => {
        it("should be '100' in flight '0'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("0", ViewModels.SubscriptionType.EA);
          expect(value.storage).toBe("100");
        });

        it("should be '100' in flight '1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("1", ViewModels.SubscriptionType.EA);
          expect(value.storage).toBe("100");
        });

        it("should be '100' in flight '2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("2", ViewModels.SubscriptionType.EA);
          expect(value.storage).toBe("100");
        });

        it("should be '100' in flight '3'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("3", ViewModels.SubscriptionType.EA);
          expect(value.storage).toBe("100");
        });
      });

      describe("for Free subscriptions", () => {
        it("should be '100' in flight '0'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("0", ViewModels.SubscriptionType.Free);
          expect(value.storage).toBe("100");
        });

        it("should be '100' in flight '1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("1", ViewModels.SubscriptionType.Free);
          expect(value.storage).toBe("100");
        });

        it("should be '100' in flight '2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("2", ViewModels.SubscriptionType.Free);
          expect(value.storage).toBe("100");
        });

        it("should be '100' in flight '3'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("3", ViewModels.SubscriptionType.Free);
          expect(value.storage).toBe("100");
        });
      });

      describe("for Internal subscriptions", () => {
        it("should be '100' in flight '0'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("0", ViewModels.SubscriptionType.Internal);
          expect(value.storage).toBe("100");
        });

        it("should be '100' in flight '1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("1", ViewModels.SubscriptionType.Internal);
          expect(value.storage).toBe("100");
        });

        it("should be '100' in flight '2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("2", ViewModels.SubscriptionType.Internal);
          expect(value.storage).toBe("100");
        });

        it("should be '100' in flight '3'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("3", ViewModels.SubscriptionType.Internal);
          expect(value.storage).toBe("100");
        });
      });

      describe("for PAYG subscriptions", () => {
        it("should be '100' in flight '0'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("0", ViewModels.SubscriptionType.PAYG);
          expect(value.storage).toBe("100");
        });

        it("should be '100' in flight '1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("1", ViewModels.SubscriptionType.PAYG);
          expect(value.storage).toBe("100");
        });

        it("should be '100' in flight '2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("2", ViewModels.SubscriptionType.PAYG);
          expect(value.storage).toBe("100");
        });

        it("should be '100' in flight '3'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("3", ViewModels.SubscriptionType.PAYG);
          expect(value.storage).toBe("100");
        });
      });
    });

    describe("default throughput for fixed collections", () => {
      describe("for Benefits subscriptions", () => {
        it("should be 400 in flight '0'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("0", ViewModels.SubscriptionType.Benefits);
          expect(value.throughput.fixed).toBe(400);
        });

        it("should be 400 in flight '1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("1", ViewModels.SubscriptionType.Benefits);
          expect(value.throughput.fixed).toBe(400);
        });

        it("should be 400 in flight '2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("2", ViewModels.SubscriptionType.Benefits);
          expect(value.throughput.fixed).toBe(400);
        });

        it("should be 400 in flight '3'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("3", ViewModels.SubscriptionType.Benefits);
          expect(value.throughput.fixed).toBe(400);
        });

        it("should be 400 in flight '20190618.1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.1", ViewModels.SubscriptionType.Benefits);
          expect(value.throughput.fixed).toBe(400);
        });

        it("should be 400 in flight '20190618.2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.2", ViewModels.SubscriptionType.Benefits);
          expect(value.throughput.fixed).toBe(400);
        });
      });

      describe("for EA subscriptions", () => {
        it("should be 400 in flight '0'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("0", ViewModels.SubscriptionType.EA);
          expect(value.throughput.fixed).toBe(400);
        });

        it("should be 400 in flight '1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("1", ViewModels.SubscriptionType.EA);
          expect(value.throughput.fixed).toBe(400);
        });

        it("should be 400 in flight '2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("2", ViewModels.SubscriptionType.EA);
          expect(value.throughput.fixed).toBe(400);
        });

        it("should be 400 in flight '3'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("3", ViewModels.SubscriptionType.EA);
          expect(value.throughput.fixed).toBe(400);
        });

        it("should be 400 in flight '20190618.1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.1", ViewModels.SubscriptionType.EA);
          expect(value.throughput.fixed).toBe(400);
        });

        it("should be 400 in flight '20190618.2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.2", ViewModels.SubscriptionType.EA);
          expect(value.throughput.fixed).toBe(400);
        });
      });

      describe("for Free subscriptions", () => {
        it("should be 400 in flight '0'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("0", ViewModels.SubscriptionType.Free);
          expect(value.throughput.fixed).toBe(400);
        });

        it("should be 400 in flight '1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("1", ViewModels.SubscriptionType.Free);
          expect(value.throughput.fixed).toBe(400);
        });

        it("should be 400 in flight '2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("2", ViewModels.SubscriptionType.Free);
          expect(value.throughput.fixed).toBe(400);
        });

        it("should be 400 in flight '3'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("3", ViewModels.SubscriptionType.Free);
          expect(value.throughput.fixed).toBe(400);
        });

        it("should be 400 in flight '20190618.1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.1", ViewModels.SubscriptionType.Free);
          expect(value.throughput.fixed).toBe(400);
        });

        it("should be 400 in flight '20190618.2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.2", ViewModels.SubscriptionType.Free);
          expect(value.throughput.fixed).toBe(400);
        });
      });

      describe("for Internal subscriptions", () => {
        it("should be 400 in flight '0'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("0", ViewModels.SubscriptionType.Internal);
          expect(value.throughput.fixed).toBe(400);
        });

        it("should be 400 in flight '1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("1", ViewModels.SubscriptionType.Internal);
          expect(value.throughput.fixed).toBe(400);
        });

        it("should be 400 in flight '2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("2", ViewModels.SubscriptionType.Internal);
          expect(value.throughput.fixed).toBe(400);
        });

        it("should be 400 in flight '3'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("3", ViewModels.SubscriptionType.Internal);
          expect(value.throughput.fixed).toBe(400);
        });

        it("should be 400 in flight '20190618.1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.1", ViewModels.SubscriptionType.Internal);
          expect(value.throughput.fixed).toBe(400);
        });

        it("should be 400 in flight '20190618.2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.2", ViewModels.SubscriptionType.Internal);
          expect(value.throughput.fixed).toBe(400);
        });
      });

      describe("for PAYG subscriptions", () => {
        it("should be 400 in flight '0'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("0", ViewModels.SubscriptionType.PAYG);
          expect(value.throughput.fixed).toBe(400);
        });

        it("should be 400 in flight '1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("1", ViewModels.SubscriptionType.PAYG);
          expect(value.throughput.fixed).toBe(400);
        });

        it("should be 400 in flight '2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("2", ViewModels.SubscriptionType.PAYG);
          expect(value.throughput.fixed).toBe(400);
        });

        it("should be 400 in flight '3'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("3", ViewModels.SubscriptionType.PAYG);
          expect(value.throughput.fixed).toBe(400);
        });

        it("should be 400 in flight '20190618.1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.1", ViewModels.SubscriptionType.PAYG);
          expect(value.throughput.fixed).toBe(400);
        });

        it("should be 400 in flight '20190618.2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.2", ViewModels.SubscriptionType.PAYG);
          expect(value.throughput.fixed).toBe(400);
        });
      });
    });

    describe("default throughput for unlimited collections", () => {
      describe("for Benefits subscriptions", () => {
        it("should be 400 in flight '0'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("0", ViewModels.SubscriptionType.Benefits);
          expect(value.throughput.unlimited(null)).toBe(400);
        });

        it("should be 400 in flight '1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("1", ViewModels.SubscriptionType.Benefits);
          expect(value.throughput.unlimited(null)).toBe(400);
        });

        it("should be 400 in flight '2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("2", ViewModels.SubscriptionType.Benefits);
          expect(value.throughput.unlimited(null)).toBe(400);
        });

        it("should be 400 in flight '3'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("3", ViewModels.SubscriptionType.Benefits);
          expect(value.throughput.unlimited(null)).toBe(400);
        });

        it("should be 400 in flight '20190618.1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.1", ViewModels.SubscriptionType.Benefits);
          expect(value.throughput.unlimited(null)).toBe(400);
        });

        it("should be 400 in flight '20190618.2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.2", ViewModels.SubscriptionType.Benefits);
          expect(value.throughput.unlimited(null)).toBe(400);
        });
      });

      describe("for EA subscriptions", () => {
        const explorer5 = new ExplorerStub();
        explorer5.databases = ko.observableArray([
          new DatabaseStub({
            id: ko.observable("db"),
            collections: ko.observableArray([
              new CollectionStub({
                id: ko.observable("1")
              }),
              new CollectionStub({
                id: ko.observable("2")
              }),
              new CollectionStub({
                id: ko.observable("3")
              }),
              new CollectionStub({
                id: ko.observable("4")
              }),
              new CollectionStub({
                id: ko.observable("5")
              })
            ])
          })
        ]);

        const explorer6 = new ExplorerStub();
        explorer6.databases = ko.observableArray([
          new DatabaseStub({
            id: ko.observable("db"),
            collections: ko.observableArray([
              new CollectionStub({
                id: ko.observable("1")
              }),
              new CollectionStub({
                id: ko.observable("2")
              }),
              new CollectionStub({
                id: ko.observable("3")
              }),
              new CollectionStub({
                id: ko.observable("4")
              }),
              new CollectionStub({
                id: ko.observable("5")
              }),
              new CollectionStub({
                id: ko.observable("6")
              })
            ])
          })
        ]);

        it("should be 400 in flight '0'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("0", ViewModels.SubscriptionType.EA);
          expect(value.throughput.unlimited(null)).toBe(400);
        });

        it("should be 400 in flight '1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("1", ViewModels.SubscriptionType.EA);
          expect(value.throughput.unlimited(null)).toBe(400);
        });

        it("should be 400 in flight '2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("2", ViewModels.SubscriptionType.EA);
          expect(value.throughput.unlimited(null)).toBe(400);
        });

        it("should be 400 in flight '3'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("3", ViewModels.SubscriptionType.EA);
          expect(value.throughput.unlimited(null)).toBe(400);
        });

        it("should be 10,000 in flight '20190618.1' and database with 5 collections or less", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.1", ViewModels.SubscriptionType.EA);
          expect(value.throughput.unlimited(explorer5)).toBe(10000);
        });

        it("should be 10,000 in flight '20190618.1' and database with more than 5 collections", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.1", ViewModels.SubscriptionType.EA);
          expect(value.throughput.unlimited(explorer6)).toBe(1000);
        });

        it("should be 1,000 in flight '20190618.2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.2", ViewModels.SubscriptionType.EA);
          expect(value.throughput.unlimited(null)).toBe(1000);
        });
      });

      describe("for Free subscriptions", () => {
        it("should be 400 in flight '0'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("0", ViewModels.SubscriptionType.Free);
          expect(value.throughput.unlimited(null)).toBe(400);
        });

        it("should be 400 in flight '1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("1", ViewModels.SubscriptionType.Free);
          expect(value.throughput.unlimited(null)).toBe(400);
        });

        it("should be 400 in flight '2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("2", ViewModels.SubscriptionType.Free);
          expect(value.throughput.unlimited(null)).toBe(400);
        });

        it("should be 400 in flight '3'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("3", ViewModels.SubscriptionType.Free);
          expect(value.throughput.unlimited(null)).toBe(400);
        });

        it("should be 400 in flight '20190618.1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.1", ViewModels.SubscriptionType.Free);
          expect(value.throughput.unlimited(null)).toBe(400);
        });

        it("should be 400 in flight '20190618.2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.2", ViewModels.SubscriptionType.Free);
          expect(value.throughput.unlimited(null)).toBe(400);
        });
      });

      describe("for Internal subscriptions", () => {
        it("should be 400 in flight '0'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("0", ViewModels.SubscriptionType.Internal);
          expect(value.throughput.unlimited(null)).toBe(400);
        });

        it("should be 400 in flight '1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("1", ViewModels.SubscriptionType.Internal);
          expect(value.throughput.unlimited(null)).toBe(400);
        });

        it("should be 400 in flight '2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("2", ViewModels.SubscriptionType.Internal);
          expect(value.throughput.unlimited(null)).toBe(400);
        });

        it("should be 400 in flight '3'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("3", ViewModels.SubscriptionType.Internal);
          expect(value.throughput.unlimited(null)).toBe(400);
        });

        it("should be 400 in flight '20190618.1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.1", ViewModels.SubscriptionType.Internal);
          expect(value.throughput.unlimited(null)).toBe(400);
        });

        it("should be 400 in flight '20190618.2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.2", ViewModels.SubscriptionType.Internal);
          expect(value.throughput.unlimited(null)).toBe(400);
        });
      });

      describe("for PAYG subscriptions", () => {
        it("should be 400 in flight '0'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("0", ViewModels.SubscriptionType.PAYG);
          expect(value.throughput.unlimited(null)).toBe(400);
        });

        it("should be 400 in flight '1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("1", ViewModels.SubscriptionType.PAYG);
          expect(value.throughput.unlimited(null)).toBe(400);
        });

        it("should be 400 in flight '2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("2", ViewModels.SubscriptionType.PAYG);
          expect(value.throughput.unlimited(null)).toBe(400);
        });

        it("should be 400 in flight '3'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("3", ViewModels.SubscriptionType.PAYG);
          expect(value.throughput.unlimited(null)).toBe(400);
        });

        it("should be 400 in flight '20190618.1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.1", ViewModels.SubscriptionType.PAYG);
          expect(value.throughput.unlimited(null)).toBe(400);
        });

        it("should be 400 in flight '20190618.2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.2", ViewModels.SubscriptionType.PAYG);
          expect(value.throughput.unlimited(null)).toBe(400);
        });
      });
    });

    describe("min throughput for unlimited collections", () => {
      describe("for Benefits subscriptions", () => {
        it("should be 400 in flight '0'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("0", ViewModels.SubscriptionType.Benefits);
          expect(value.throughput.unlimitedmin).toBe(400);
        });

        it("should be 400 in flight '1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("1", ViewModels.SubscriptionType.Benefits);
          expect(value.throughput.unlimitedmin).toBe(400);
        });

        it("should be 400 in flight '2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("2", ViewModels.SubscriptionType.Benefits);
          expect(value.throughput.unlimitedmin).toBe(400);
        });

        it("should be 400 in flight '3'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("3", ViewModels.SubscriptionType.Benefits);
          expect(value.throughput.unlimitedmin).toBe(400);
        });

        it("should be 400 in flight '20190618.1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.1", ViewModels.SubscriptionType.Benefits);
          expect(value.throughput.unlimitedmin).toBe(400);
        });

        it("should be 400 in flight '20190618.2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.2", ViewModels.SubscriptionType.Benefits);
          expect(value.throughput.unlimitedmin).toBe(400);
        });
      });

      describe("for EA subscriptions", () => {
        it("should be 400 in flight '0'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("0", ViewModels.SubscriptionType.EA);
          expect(value.throughput.unlimitedmin).toBe(400);
        });

        it("should be 400 in flight '1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("1", ViewModels.SubscriptionType.EA);
          expect(value.throughput.unlimitedmin).toBe(400);
        });

        it("should be 400 in flight '2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("2", ViewModels.SubscriptionType.EA);
          expect(value.throughput.unlimitedmin).toBe(400);
        });

        it("should be 400 in flight '3'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("3", ViewModels.SubscriptionType.EA);
          expect(value.throughput.unlimitedmin).toBe(400);
        });

        it("should be 400 in flight '20190618.1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.1", ViewModels.SubscriptionType.EA);
          expect(value.throughput.unlimitedmin).toBe(400);
        });

        it("should be 400 in flight '20190618.2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.2", ViewModels.SubscriptionType.EA);
          expect(value.throughput.unlimitedmin).toBe(400);
        });
      });

      describe("for Free subscriptions", () => {
        it("should be 400 in flight '0'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("0", ViewModels.SubscriptionType.Free);
          expect(value.throughput.unlimitedmin).toBe(400);
        });

        it("should be 400 in flight '1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("1", ViewModels.SubscriptionType.Free);
          expect(value.throughput.unlimitedmin).toBe(400);
        });

        it("should be 400 in flight '2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("2", ViewModels.SubscriptionType.Free);
          expect(value.throughput.unlimitedmin).toBe(400);
        });

        it("should be 400 in flight '3'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("3", ViewModels.SubscriptionType.Free);
          expect(value.throughput.unlimitedmin).toBe(400);
        });

        it("should be 400 in flight '20190618.1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.1", ViewModels.SubscriptionType.Free);
          expect(value.throughput.unlimitedmin).toBe(400);
        });

        it("should be 400 in flight '20190618.2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.2", ViewModels.SubscriptionType.Free);
          expect(value.throughput.unlimitedmin).toBe(400);
        });
      });

      describe("for Internal subscriptions", () => {
        it("should be 400 in flight '0'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("0", ViewModels.SubscriptionType.Internal);
          expect(value.throughput.unlimitedmin).toBe(400);
        });

        it("should be 400 in flight '1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("1", ViewModels.SubscriptionType.Internal);
          expect(value.throughput.unlimitedmin).toBe(400);
        });

        it("should be 400 in flight '2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("2", ViewModels.SubscriptionType.Internal);
          expect(value.throughput.unlimitedmin).toBe(400);
        });

        it("should be 400 in flight '3'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("3", ViewModels.SubscriptionType.Internal);
          expect(value.throughput.unlimitedmin).toBe(400);
        });

        it("should be 400 in flight '20190618.1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.1", ViewModels.SubscriptionType.Internal);
          expect(value.throughput.unlimitedmin).toBe(400);
        });

        it("should be 400 in flight '20190618.2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.2", ViewModels.SubscriptionType.Internal);
          expect(value.throughput.unlimitedmin).toBe(400);
        });
      });

      describe("for PAYG subscriptions", () => {
        it("should be 400 in flight '0'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("0", ViewModels.SubscriptionType.PAYG);
          expect(value.throughput.unlimitedmin).toBe(400);
        });

        it("should be 400 in flight '1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("1", ViewModels.SubscriptionType.PAYG);
          expect(value.throughput.unlimitedmin).toBe(400);
        });

        it("should be 400 in flight '2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("2", ViewModels.SubscriptionType.PAYG);
          expect(value.throughput.unlimitedmin).toBe(400);
        });

        it("should be 400 in flight '3'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("3", ViewModels.SubscriptionType.PAYG);
          expect(value.throughput.unlimitedmin).toBe(400);
        });

        it("should be 400 in flight '20190618.1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.1", ViewModels.SubscriptionType.PAYG);
          expect(value.throughput.unlimitedmin).toBe(400);
        });

        it("should be 400 in flight '20190618.2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.2", ViewModels.SubscriptionType.PAYG);
          expect(value.throughput.unlimitedmin).toBe(400);
        });
      });
    });

    describe("max throughput for unlimited collections", () => {
      describe("for Benefits subscriptions", () => {
        it("should be 100,000 in flight '0'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("0", ViewModels.SubscriptionType.Benefits);
          expect(value.throughput.unlimitedmax).toBe(100000);
        });

        it("should be 100,000 in flight '1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("1", ViewModels.SubscriptionType.Benefits);
          expect(value.throughput.unlimitedmax).toBe(100000);
        });

        it("should be 100,000 in flight '2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("2", ViewModels.SubscriptionType.Benefits);
          expect(value.throughput.unlimitedmax).toBe(100000);
        });

        it("should be 100,000 in flight '3'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("3", ViewModels.SubscriptionType.Benefits);
          expect(value.throughput.unlimitedmax).toBe(100000);
        });

        it("should be 100,000 in flight '20190618.1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.1", ViewModels.SubscriptionType.Benefits);
          expect(value.throughput.unlimitedmax).toBe(100000);
        });

        it("should be 100,000 in flight '20190618.2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.2", ViewModels.SubscriptionType.Benefits);
          expect(value.throughput.unlimitedmax).toBe(100000);
        });
      });

      describe("for EA subscriptions", () => {
        it("should be 1,000,000 in flight '0'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("0", ViewModels.SubscriptionType.EA);
          expect(value.throughput.unlimitedmax).toBe(1000000);
        });

        it("should be 1,000,000 in flight '1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("1", ViewModels.SubscriptionType.EA);
          expect(value.throughput.unlimitedmax).toBe(1000000);
        });

        it("should be 1,000,000 in flight '2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("2", ViewModels.SubscriptionType.EA);
          expect(value.throughput.unlimitedmax).toBe(1000000);
        });

        it("should be 1,000,000 in flight '3'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("3", ViewModels.SubscriptionType.EA);
          expect(value.throughput.unlimitedmax).toBe(1000000);
        });

        it("should be 1,000,000 in flight '20190618.1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.1", ViewModels.SubscriptionType.EA);
          expect(value.throughput.unlimitedmax).toBe(1000000);
        });

        it("should be 1,000,000 in flight '20190618.2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.2", ViewModels.SubscriptionType.EA);
          expect(value.throughput.unlimitedmax).toBe(1000000);
        });
      });

      describe("for Free subscriptions", () => {
        it("should be 100,000 in flight '0'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("0", ViewModels.SubscriptionType.Free);
          expect(value.throughput.unlimitedmax).toBe(100000);
        });

        it("should be 100,000 in flight '1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("1", ViewModels.SubscriptionType.Free);
          expect(value.throughput.unlimitedmax).toBe(100000);
        });

        it("should be 100,000 in flight '2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("2", ViewModels.SubscriptionType.Free);
          expect(value.throughput.unlimitedmax).toBe(100000);
        });

        it("should be 100,000 in flight '3'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("3", ViewModels.SubscriptionType.Free);
          expect(value.throughput.unlimitedmax).toBe(100000);
        });

        it("should be 100,000 in flight '20190618.1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.1", ViewModels.SubscriptionType.Free);
          expect(value.throughput.unlimitedmax).toBe(100000);
        });

        it("should be 100,000 in flight '20190618.2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.2", ViewModels.SubscriptionType.Free);
          expect(value.throughput.unlimitedmax).toBe(100000);
        });
      });

      describe("for Internal subscriptions", () => {
        it("should be 100,000 in flight '0'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("0", ViewModels.SubscriptionType.Internal);
          expect(value.throughput.unlimitedmax).toBe(100000);
        });

        it("should be 100,000 in flight '1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("1", ViewModels.SubscriptionType.Internal);
          expect(value.throughput.unlimitedmax).toBe(100000);
        });

        it("should be 100,000 in flight '2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("2", ViewModels.SubscriptionType.Internal);
          expect(value.throughput.unlimitedmax).toBe(100000);
        });

        it("should be 100,000 in flight '3'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("3", ViewModels.SubscriptionType.Internal);
          expect(value.throughput.unlimitedmax).toBe(100000);
        });

        it("should be 100,000 in flight '20190618.1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.1", ViewModels.SubscriptionType.Internal);
          expect(value.throughput.unlimitedmax).toBe(100000);
        });

        it("should be 100,000 in flight '20190618.2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.2", ViewModels.SubscriptionType.Internal);
          expect(value.throughput.unlimitedmax).toBe(100000);
        });
      });

      describe("for PAYG subscriptions", () => {
        it("should be 1,000,000 in flight '0'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("0", ViewModels.SubscriptionType.PAYG);
          expect(value.throughput.unlimitedmax).toBe(1000000);
        });

        it("should be 1,000,000 in flight '1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("1", ViewModels.SubscriptionType.PAYG);
          expect(value.throughput.unlimitedmax).toBe(1000000);
        });

        it("should be 1,000,000 in flight '2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("2", ViewModels.SubscriptionType.PAYG);
          expect(value.throughput.unlimitedmax).toBe(1000000);
        });

        it("should be 1,000,000 in flight '3'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("3", ViewModels.SubscriptionType.PAYG);
          expect(value.throughput.unlimitedmax).toBe(1000000);
        });

        it("should be 1,000,000 in flight '20190618.1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.1", ViewModels.SubscriptionType.PAYG);
          expect(value.throughput.unlimitedmax).toBe(1000000);
        });

        it("should be 1,000,000 in flight '20190618.2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.2", ViewModels.SubscriptionType.PAYG);
          expect(value.throughput.unlimitedmax).toBe(1000000);
        });
      });
    });

    describe("default throughput for shared offers", () => {
      describe("for Benefits subscriptions", () => {
        it("should be 400 in flight '0'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("0", ViewModels.SubscriptionType.Benefits);
          expect(value.throughput.shared).toBe(400);
        });

        it("should be 400 in flight '1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("1", ViewModels.SubscriptionType.Benefits);
          expect(value.throughput.shared).toBe(400);
        });

        it("should be 400 in flight '2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("2", ViewModels.SubscriptionType.Benefits);
          expect(value.throughput.shared).toBe(400);
        });

        it("should be 400 in flight '3'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("3", ViewModels.SubscriptionType.Benefits);
          expect(value.throughput.shared).toBe(400);
        });

        it("should be 400 in flight '20190618.1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.1", ViewModels.SubscriptionType.Benefits);
          expect(value.throughput.shared).toBe(400);
        });

        it("should be 400 in flight '20190618.2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.2", ViewModels.SubscriptionType.Benefits);
          expect(value.throughput.shared).toBe(400);
        });
      });

      describe("for EA subscriptions", () => {
        it("should be 400 in flight '0'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("0", ViewModels.SubscriptionType.EA);
          expect(value.throughput.shared).toBe(400);
        });

        it("should be 400 in flight '1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("1", ViewModels.SubscriptionType.EA);
          expect(value.throughput.shared).toBe(400);
        });

        it("should be 400 in flight '2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("2", ViewModels.SubscriptionType.EA);
          expect(value.throughput.shared).toBe(400);
        });

        it("should be 400 in flight '3'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("3", ViewModels.SubscriptionType.EA);
          expect(value.throughput.shared).toBe(400);
        });

        it("should be 20,000 in flight '20190618.1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.1", ViewModels.SubscriptionType.EA);
          expect(value.throughput.shared).toBe(20000);
        });

        it("should be 5,000 in flight '20190618.2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.2", ViewModels.SubscriptionType.EA);
          expect(value.throughput.shared).toBe(5000);
        });
      });

      describe("for Free subscriptions", () => {
        it("should be 400 in flight '0'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("0", ViewModels.SubscriptionType.Free);
          expect(value.throughput.shared).toBe(400);
        });

        it("should be 400 in flight '1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("1", ViewModels.SubscriptionType.Free);
          expect(value.throughput.shared).toBe(400);
        });

        it("should be 400 in flight '2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("2", ViewModels.SubscriptionType.Free);
          expect(value.throughput.shared).toBe(400);
        });

        it("should be 400 in flight '3'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("3", ViewModels.SubscriptionType.Free);
          expect(value.throughput.shared).toBe(400);
        });

        it("should be 400 in flight '20190618.1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.1", ViewModels.SubscriptionType.Free);
          expect(value.throughput.shared).toBe(400);
        });

        it("should be 400 in flight '20190618.2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.2", ViewModels.SubscriptionType.Free);
          expect(value.throughput.shared).toBe(400);
        });
      });

      describe("for Internal subscriptions", () => {
        it("should be 400 in flight '0'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("0", ViewModels.SubscriptionType.Internal);
          expect(value.throughput.shared).toBe(400);
        });

        it("should be 400 in flight '1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("1", ViewModels.SubscriptionType.Internal);
          expect(value.throughput.shared).toBe(400);
        });

        it("should be 400 in flight '2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("2", ViewModels.SubscriptionType.Internal);
          expect(value.throughput.shared).toBe(400);
        });

        it("should be 400 in flight '3'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("3", ViewModels.SubscriptionType.Internal);
          expect(value.throughput.shared).toBe(400);
        });

        it("should be 400 in flight '20190618.1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.1", ViewModels.SubscriptionType.Internal);
          expect(value.throughput.shared).toBe(400);
        });

        it("should be 400 in flight '20190618.2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.2", ViewModels.SubscriptionType.Internal);
          expect(value.throughput.shared).toBe(400);
        });
      });

      describe("for PAYG subscriptions", () => {
        it("should be 400 in flight '0'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("0", ViewModels.SubscriptionType.PAYG);
          expect(value.throughput.shared).toBe(400);
        });

        it("should be 400 in flight '1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("1", ViewModels.SubscriptionType.PAYG);
          expect(value.throughput.shared).toBe(400);
        });

        it("should be 400 in flight '2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("2", ViewModels.SubscriptionType.PAYG);
          expect(value.throughput.shared).toBe(400);
        });

        it("should be 400 in flight '3'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("3", ViewModels.SubscriptionType.PAYG);
          expect(value.throughput.shared).toBe(400);
        });

        it("should be 400 in flight '20190618.1'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.1", ViewModels.SubscriptionType.PAYG);
          expect(value.throughput.shared).toBe(400);
        });

        it("should be 400 in flight '20190618.2'", () => {
          const value: CollectionDefaults = Utilities._getDefaults("20190618.2", ViewModels.SubscriptionType.PAYG);
          expect(value.throughput.shared).toBe(400);
        });
      });
    });
  });
});
