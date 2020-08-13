import * as SharedConstants from "../Shared/Constants";
import { AddDbUtilities } from "../Shared/AddDatabaseUtility";
import { CreateCollectionUtilities, CreateSqlCollectionUtilities, Utilities } from "./AddCollectionUtility";
jest.mock("AddDatabaseUtility");

const armEndpoint = "https://management.azure.com";

describe("Add Collection Utitlity", () => {
  describe("createSqlCollection", () => {
    it("should invoke createSqlCollectionWithARM if create database is false", async () => {
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
        indexingPolicy: SharedConstants.IndexingPolicies.AllPropertiesIndexed,
        partitionKeyVersion: 2
      };
      const additionalOptions = {};
      CreateSqlCollectionUtilities.createSqlCollectionWithARM = jest.fn().mockResolvedValue(undefined);
      await CreateSqlCollectionUtilities.createSqlCollection(
        armEndpoint,
        properties.db,
        properties.defaultTtl,
        properties.coll,
        properties.indexingPolicy,
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
      expect(CreateSqlCollectionUtilities.createSqlCollectionWithARM).toHaveBeenCalled();
    });

    it("should invoke createSqlDatabase + createSqlCollectionWithARM if create database is true", async () => {
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
        indexingPolicy: SharedConstants.IndexingPolicies.AllPropertiesIndexed,
        partitionKeyVersion: 2
      };
      const additionalOptions = {};
      const createSqlCollectionWithARMSpy = (CreateSqlCollectionUtilities.createSqlCollectionWithARM = jest
        .fn()
        .mockResolvedValue(undefined));
      const createSqlDatabaseSpy = (AddDbUtilities.createSqlDatabase = jest.fn().mockResolvedValue(undefined));
      await CreateSqlCollectionUtilities.createSqlCollection(
        armEndpoint,
        properties.db,
        properties.analyticalStorageTtl,
        properties.coll,
        properties.indexingPolicy,
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
    it("should invoke createGremlinGraphWithARM if create database is false", async () => {
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
        indexingPolicy: SharedConstants.IndexingPolicies.AllPropertiesIndexed,
        partitionKeyVersion: 2
      };
      const additionalOptions = {};
      CreateCollectionUtilities.createGremlinGraphWithARM = jest.fn().mockResolvedValue(undefined);
      await CreateCollectionUtilities.createGremlinGraph(
        armEndpoint,
        properties.db,
        properties.coll,
        properties.indexingPolicy,
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
      expect(CreateCollectionUtilities.createGremlinGraphWithARM).toHaveBeenCalled();
    });

    it("should invoke createGremlinDatabase + createGremlinGraphWithARM if create database is true", async () => {
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
        indexingPolicy: SharedConstants.IndexingPolicies.AllPropertiesIndexed,
        partitionKeyVersion: 2
      };
      const additionalOptions = {};
      CreateCollectionUtilities.createGremlinGraphWithARM = jest.fn().mockResolvedValue(undefined);
      AddDbUtilities.createGremlinDatabase = jest.fn().mockResolvedValue(undefined);
      await CreateCollectionUtilities.createGremlinGraph(
        armEndpoint,
        properties.db,
        properties.coll,
        properties.indexingPolicy,
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
      expect(CreateCollectionUtilities.createGremlinGraphWithARM).toHaveBeenCalled();
      expect(AddDbUtilities.createGremlinDatabase).toHaveBeenCalled();
    });
  });
});
