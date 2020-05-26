import { AddDbUtilities } from "../Shared/AddDatabaseUtility";
import { CreateCollectionUtilities, CreateSqlCollectionUtilities, Utilities } from "./AddCollectionUtility";
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
