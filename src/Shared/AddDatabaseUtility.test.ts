import { AddDbUtilities } from "./AddDatabaseUtility";
import { ResourceProviderClient } from "../ResourceProvider/ResourceProviderClient";
jest.mock("../ResourceProvider/ResourceProviderClient.ts");

describe("Add Database Utitlity", () => {
  const armEndpoint = "https://management.azure.com";
  const properties = {
    pk: "state",
    coll: "abc-collection",
    cd: true,
    db: "a1-db",
    offerThroughput: 50000,
    st: true,
    sid: "a1",
    rg: "b1",
    dba: "main"
  };

  describe("getRpClient", () => {
    it("should return an instance of ResourceProviderClient", () => {
      expect(AddDbUtilities.getRpClient()).not.toBeFalsy();
      expect(AddDbUtilities.getRpClient()).toBeInstanceOf(ResourceProviderClient);
    });
  });

  describe("getGremlinDatabaseUri", () => {
    it("should return a uri in the correct format", () => {
      expect(AddDbUtilities.getGremlinDatabaseUri(properties)).toEqual(
        "subscriptions/a1/resourceGroups/b1/providers/Microsoft.DocumentDB/databaseAccounts/main/gremlinDatabases/a1-db"
      );
    });
  });

  describe("createGremlinDatabase", () => {
    it("should utilize resource provider client", () => {
      const resourceProviderClientSpy = spyOn<any>(AddDbUtilities, "getRpClient");
      AddDbUtilities.createGremlinDatabase(armEndpoint, properties, undefined);
      expect(resourceProviderClientSpy).toHaveBeenCalled();
    });

    it("should invoke getGremlinDatabaseUri", () => {
      const getGremlinDatabaseUriSpy = spyOn<any>(AddDbUtilities, "getGremlinDatabaseUri");
      AddDbUtilities.createGremlinDatabase(armEndpoint, properties, undefined);
      expect(getGremlinDatabaseUriSpy).toHaveBeenCalled();
    });

    it("should invoke a put call via resource provider client to create a database and set throughput if shared throughtput is true", () => {
      const resourceProviderClientPutAsyncSpy = jest.spyOn(ResourceProviderClient.prototype, "putAsync");
      AddDbUtilities.createGremlinDatabase(armEndpoint, properties, undefined);
      expect(
        resourceProviderClientPutAsyncSpy
      ).toHaveBeenCalledWith(
        "subscriptions/a1/resourceGroups/b1/providers/Microsoft.DocumentDB/databaseAccounts/main/gremlinDatabases/a1-db",
        "2020-03-01",
        { properties: { options: { throughput: "50000" }, resource: { id: "a1-db" } } }
      );
    });

    it("should invoke a put call via resource provider client to create a database and set autopilot if shared throughtput is true and autopilot settings are passed", () => {
      const resourceProviderClientPutAsyncSpy = jest.spyOn(ResourceProviderClient.prototype, "putAsync");
      AddDbUtilities.createGremlinDatabase(armEndpoint, properties, { "x-ms-cosmos-offer-autopilot-tier": "1" });
      expect(
        resourceProviderClientPutAsyncSpy
      ).toHaveBeenCalledWith(
        "subscriptions/a1/resourceGroups/b1/providers/Microsoft.DocumentDB/databaseAccounts/main/gremlinDatabases/a1-db",
        "2020-03-01",
        { properties: { options: { "x-ms-cosmos-offer-autopilot-tier": "1" }, resource: { id: "a1-db" } } }
      );
    });

    it("should invoke a put call via resource provider client to create a database and not set throughput if shared throughtput is false", () => {
      const properties = {
        pk: "state",
        coll: "abc-collection",
        cd: true,
        db: "a2-db",
        st: false,
        sid: "a2",
        rg: "c1",
        dba: "main"
      };
      const resourceProviderClientPutAsyncSpy = jest.spyOn(ResourceProviderClient.prototype, "putAsync");
      AddDbUtilities.createGremlinDatabase(armEndpoint, properties, undefined);
      expect(
        resourceProviderClientPutAsyncSpy
      ).toHaveBeenCalledWith(
        "subscriptions/a2/resourceGroups/c1/providers/Microsoft.DocumentDB/databaseAccounts/main/gremlinDatabases/a2-db",
        "2020-03-01",
        { properties: { options: {}, resource: { id: "a2-db" } } }
      );
    });
  });

  describe("createSqlDatabase", () => {
    it("should utilize resource provider client", () => {
      const resourceProviderClientSpy = spyOn<any>(AddDbUtilities, "getRpClient");
      AddDbUtilities.createSqlDatabase(armEndpoint, properties, undefined);
      expect(resourceProviderClientSpy).toHaveBeenCalled();
    });

    it("should invoke getSqlDatabaseUri", () => {
      const getSqlDatabaseUriSpy = spyOn<any>(AddDbUtilities, "getSqlDatabaseUri");
      AddDbUtilities.createSqlDatabase(armEndpoint, properties, undefined);
      expect(getSqlDatabaseUriSpy).toHaveBeenCalled();
    });

    it("should invoke a put call via resource provider client to create a database and set throughput if shared throughtput is true", () => {
      const resourceProviderClientPutAsyncSpy = jest.spyOn(ResourceProviderClient.prototype, "putAsync");
      AddDbUtilities.createSqlDatabase(armEndpoint, properties, undefined);
      expect(
        resourceProviderClientPutAsyncSpy
      ).toHaveBeenCalledWith(
        "subscriptions/a1/resourceGroups/b1/providers/Microsoft.DocumentDB/databaseAccounts/main/sqlDatabases/a1-db",
        "2020-03-01",
        { properties: { options: { throughput: "50000" }, resource: { id: "a1-db" } } }
      );
    });

    it("should invoke a put call via resource provider client to create a database and set autopilot if shared throughtput is true and autopilot settings are passed", () => {
      const resourceProviderClientPutAsyncSpy = jest.spyOn(ResourceProviderClient.prototype, "putAsync");
      AddDbUtilities.createSqlDatabase(armEndpoint, properties, { "x-ms-cosmos-offer-autopilot-tier": "1" });
      expect(
        resourceProviderClientPutAsyncSpy
      ).toHaveBeenCalledWith(
        "subscriptions/a1/resourceGroups/b1/providers/Microsoft.DocumentDB/databaseAccounts/main/sqlDatabases/a1-db",
        "2020-03-01",
        { properties: { options: { "x-ms-cosmos-offer-autopilot-tier": "1" }, resource: { id: "a1-db" } } }
      );
    });

    it("should invoke a put call via resource provider client to create a database and not set throughput if shared throughtput is false", () => {
      const properties = {
        pk: "state",
        coll: "abc-collection",
        cd: true,
        db: "a2-db",
        st: false,
        sid: "a2",
        rg: "c1",
        dba: "main"
      };
      const resourceProviderClientPutAsyncSpy = jest.spyOn(ResourceProviderClient.prototype, "putAsync");
      AddDbUtilities.createSqlDatabase(armEndpoint, properties, undefined);
      expect(
        resourceProviderClientPutAsyncSpy
      ).toHaveBeenCalledWith(
        "subscriptions/a2/resourceGroups/c1/providers/Microsoft.DocumentDB/databaseAccounts/main/sqlDatabases/a2-db",
        "2020-03-01",
        { properties: { options: {}, resource: { id: "a2-db" } } }
      );
    });
  });
});
