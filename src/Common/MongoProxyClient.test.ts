import {
  _createMongoCollectionWithARM,
  deleteDocument,
  getEndpoint,
  queryDocuments,
  readDocument,
  updateDocument
} from "./MongoProxyClient";
import { AuthType } from "../AuthType";
import { Collection, DatabaseAccount, DocumentId } from "../Contracts/ViewModels";
import { config } from "../Config";
import { CosmosClient } from "./CosmosClient";
import { ResourceProviderClient } from "../ResourceProvider/ResourceProviderClient";
jest.mock("../ResourceProvider/ResourceProviderClient.ts");

const databaseId = "testDB";

const fetchMock = () => {
  return Promise.resolve({
    ok: true,
    text: () => "{}",
    json: () => "{}",
    headers: new Map()
  });
};

const partitionKeyProperty = "pk";

const collection = {
  id: () => "testCollection",
  rid: "testCollectionrid",
  partitionKeyProperty,
  partitionKey: {
    paths: ["/pk"],
    kind: "Hash",
    version: 1
  }
} as Collection;

const documentId = ({
  partitionKeyHeader: () => "[]",
  self: "db/testDB/db/testCollection/docs/testId",
  partitionKeyProperty,
  partitionKey: {
    paths: ["/pk"],
    kind: "Hash",
    version: 1
  }
} as unknown) as DocumentId;

const databaseAccount = {
  id: "foo",
  name: "foo",
  location: "foo",
  type: "foo",
  kind: "foo",
  properties: {
    documentEndpoint: "bar",
    gremlinEndpoint: "foo",
    tableEndpoint: "foo",
    cassandraEndpoint: "foo"
  }
};

describe("MongoProxyClient", () => {
  describe("queryDocuments", () => {
    beforeEach(() => {
      delete config.BACKEND_ENDPOINT;
      CosmosClient.databaseAccount(databaseAccount as any);
      window.dataExplorer = {
        extensionEndpoint: () => "https://main.documentdb.ext.azure.com",
        serverId: () => ""
      } as any;
      window.fetch = jest.fn().mockImplementation(fetchMock);
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("builds the correct URL", () => {
      queryDocuments(databaseId, collection, true, "{}");
      expect(window.fetch).toHaveBeenCalledWith(
        "https://main.documentdb.ext.azure.com/api/mongo/explorer/resourcelist?db=testDB&coll=testCollection&resourceUrl=bardbs%2FtestDB%2Fcolls%2FtestCollection%2Fdocs%2F&rid=testCollectionrid&rtype=docs&sid=&rg=&dba=foo&pk=pk",
        expect.any(Object)
      );
    });

    it("builds the correct proxy URL in development", () => {
      config.MONGO_BACKEND_ENDPOINT = "https://localhost:1234";
      queryDocuments(databaseId, collection, true, "{}");
      expect(window.fetch).toHaveBeenCalledWith(
        "https://localhost:1234/api/mongo/explorer/resourcelist?db=testDB&coll=testCollection&resourceUrl=bardbs%2FtestDB%2Fcolls%2FtestCollection%2Fdocs%2F&rid=testCollectionrid&rtype=docs&sid=&rg=&dba=foo&pk=pk",
        expect.any(Object)
      );
    });
  });
  describe("readDocument", () => {
    beforeEach(() => {
      delete config.MONGO_BACKEND_ENDPOINT;
      CosmosClient.databaseAccount(databaseAccount as any);
      window.dataExplorer = {
        extensionEndpoint: () => "https://main.documentdb.ext.azure.com",
        serverId: () => ""
      } as any;
      window.fetch = jest.fn().mockImplementation(fetchMock);
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("builds the correct URL", () => {
      readDocument(databaseId, collection, documentId);
      expect(window.fetch).toHaveBeenCalledWith(
        "https://main.documentdb.ext.azure.com/api/mongo/explorer?db=testDB&coll=testCollection&resourceUrl=bardb%2FtestDB%2Fdb%2FtestCollection%2FtestId&rid=testId&rtype=docs&sid=&rg=&dba=foo&pk=pk",
        expect.any(Object)
      );
    });

    it("builds the correct proxy URL in development", () => {
      config.MONGO_BACKEND_ENDPOINT = "https://localhost:1234";
      readDocument(databaseId, collection, documentId);
      expect(window.fetch).toHaveBeenCalledWith(
        "https://localhost:1234/api/mongo/explorer?db=testDB&coll=testCollection&resourceUrl=bardb%2FtestDB%2Fdb%2FtestCollection%2FtestId&rid=testId&rtype=docs&sid=&rg=&dba=foo&pk=pk",
        expect.any(Object)
      );
    });
  });
  describe("createDocument", () => {
    beforeEach(() => {
      delete config.MONGO_BACKEND_ENDPOINT;
      CosmosClient.databaseAccount(databaseAccount as any);
      window.dataExplorer = {
        extensionEndpoint: () => "https://main.documentdb.ext.azure.com",
        serverId: () => ""
      } as any;
      window.fetch = jest.fn().mockImplementation(fetchMock);
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("builds the correct URL", () => {
      readDocument(databaseId, collection, documentId);
      expect(window.fetch).toHaveBeenCalledWith(
        "https://main.documentdb.ext.azure.com/api/mongo/explorer?db=testDB&coll=testCollection&resourceUrl=bardb%2FtestDB%2Fdb%2FtestCollection%2FtestId&rid=testId&rtype=docs&sid=&rg=&dba=foo&pk=pk",
        expect.any(Object)
      );
    });

    it("builds the correct proxy URL in development", () => {
      config.MONGO_BACKEND_ENDPOINT = "https://localhost:1234";
      readDocument(databaseId, collection, documentId);
      expect(window.fetch).toHaveBeenCalledWith(
        "https://localhost:1234/api/mongo/explorer?db=testDB&coll=testCollection&resourceUrl=bardb%2FtestDB%2Fdb%2FtestCollection%2FtestId&rid=testId&rtype=docs&sid=&rg=&dba=foo&pk=pk",
        expect.any(Object)
      );
    });
  });
  describe("updateDocument", () => {
    beforeEach(() => {
      delete config.MONGO_BACKEND_ENDPOINT;
      CosmosClient.databaseAccount(databaseAccount as any);
      window.dataExplorer = {
        extensionEndpoint: () => "https://main.documentdb.ext.azure.com",
        serverId: () => ""
      } as any;
      window.fetch = jest.fn().mockImplementation(fetchMock);
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("builds the correct URL", () => {
      updateDocument(databaseId, collection, documentId, {});
      expect(window.fetch).toHaveBeenCalledWith(
        "https://main.documentdb.ext.azure.com/api/mongo/explorer?db=testDB&coll=testCollection&resourceUrl=bardb%2FtestDB%2Fdb%2FtestCollection%2Fdocs%2FtestId&rid=testId&rtype=docs&sid=&rg=&dba=foo&pk=pk",
        expect.any(Object)
      );
    });

    it("builds the correct proxy URL in development", () => {
      config.MONGO_BACKEND_ENDPOINT = "https://localhost:1234";
      updateDocument(databaseId, collection, documentId, {});
      expect(window.fetch).toHaveBeenCalledWith(
        "https://localhost:1234/api/mongo/explorer?db=testDB&coll=testCollection&resourceUrl=bardb%2FtestDB%2Fdb%2FtestCollection%2Fdocs%2FtestId&rid=testId&rtype=docs&sid=&rg=&dba=foo&pk=pk",
        expect.any(Object)
      );
    });
  });
  describe("deleteDocument", () => {
    beforeEach(() => {
      delete config.MONGO_BACKEND_ENDPOINT;
      CosmosClient.databaseAccount(databaseAccount as any);
      window.dataExplorer = {
        extensionEndpoint: () => "https://main.documentdb.ext.azure.com",
        serverId: () => ""
      } as any;
      window.fetch = jest.fn().mockImplementation(fetchMock);
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("builds the correct URL", () => {
      deleteDocument(databaseId, collection, documentId);
      expect(window.fetch).toHaveBeenCalledWith(
        "https://main.documentdb.ext.azure.com/api/mongo/explorer?db=testDB&coll=testCollection&resourceUrl=bardb%2FtestDB%2Fdb%2FtestCollection%2Fdocs%2FtestId&rid=testId&rtype=docs&sid=&rg=&dba=foo&pk=pk",
        expect.any(Object)
      );
    });

    it("builds the correct proxy URL in development", () => {
      config.MONGO_BACKEND_ENDPOINT = "https://localhost:1234";
      deleteDocument(databaseId, collection, documentId);
      expect(window.fetch).toHaveBeenCalledWith(
        "https://localhost:1234/api/mongo/explorer?db=testDB&coll=testCollection&resourceUrl=bardb%2FtestDB%2Fdb%2FtestCollection%2Fdocs%2FtestId&rid=testId&rtype=docs&sid=&rg=&dba=foo&pk=pk",
        expect.any(Object)
      );
    });
  });
  describe("getEndpoint", () => {
    beforeEach(() => {
      delete config.MONGO_BACKEND_ENDPOINT;
      delete window.authType;
      CosmosClient.databaseAccount(databaseAccount as any);
      window.dataExplorer = {
        extensionEndpoint: () => "https://main.documentdb.ext.azure.com",
        serverId: () => ""
      } as any;
    });

    it("returns a production endpoint", () => {
      const endpoint = getEndpoint(databaseAccount as DatabaseAccount);
      expect(endpoint).toEqual("https://main.documentdb.ext.azure.com/api/mongo/explorer");
    });

    it("returns a development endpoint", () => {
      config.MONGO_BACKEND_ENDPOINT = "https://localhost:1234";
      const endpoint = getEndpoint(databaseAccount as DatabaseAccount);
      expect(endpoint).toEqual("https://localhost:1234/api/mongo/explorer");
    });

    it("returns a guest endpoint", () => {
      window.authType = AuthType.EncryptedToken;
      const endpoint = getEndpoint(databaseAccount as DatabaseAccount);
      expect(endpoint).toEqual("https://main.documentdb.ext.azure.com/api/guest/mongo/explorer");
    });
  });

  describe("createMongoCollectionWithARM", () => {
    it("should create a collection with autopilot when autopilot is selected + shared throughput is false", () => {
      const resourceProviderClientPutAsyncSpy = jest.spyOn(ResourceProviderClient.prototype, "putAsync");
      const properties = {
        pk: "state",
        coll: "abc-collection",
        cd: true,
        db: "a1-db",
        st: false,
        sid: "a2",
        rg: "c1",
        dba: "main",
        is: false,
        isFixedCollectionWithSharedThroughputBeingCreated: true
      };
      _createMongoCollectionWithARM("management.azure.com", properties, { "x-ms-cosmos-offer-autopilot-tier": "1" });
      expect(resourceProviderClientPutAsyncSpy).toHaveBeenCalledWith(
        "subscriptions/a2/resourceGroups/c1/providers/Microsoft.DocumentDB/databaseAccounts/foo/mongodbDatabases/a1-db/collections/abc-collection",
        "2020-04-01",
        {
          properties: {
            options: { "x-ms-cosmos-offer-autopilot-tier": "1", InsertSystemPartitionKey: "true" },
            resource: { id: "abc-collection" }
          }
        }
      );
    });
    it("should create a collection with provisioned throughput when provisioned throughput is selected + shared throughput is false", () => {
      const resourceProviderClientPutAsyncSpy = jest.spyOn(ResourceProviderClient.prototype, "putAsync");
      const properties = {
        pk: "state",
        coll: "abc-collection",
        cd: true,
        db: "a1-db",
        st: false,
        sid: "a2",
        rg: "c1",
        dba: "main",
        is: false,
        offerThroughput: 400,
        isFixedCollectionWithSharedThroughputBeingCreated: true
      };
      _createMongoCollectionWithARM("management.azure.com", properties, undefined);
      expect(resourceProviderClientPutAsyncSpy).toHaveBeenCalledWith(
        "subscriptions/a2/resourceGroups/c1/providers/Microsoft.DocumentDB/databaseAccounts/foo/mongodbDatabases/a1-db/collections/abc-collection",
        "2020-04-01",
        {
          properties: {
            options: { throughput: "400", InsertSystemPartitionKey: "true" },
            resource: { id: "abc-collection" }
          }
        }
      );
    });
  });
});
