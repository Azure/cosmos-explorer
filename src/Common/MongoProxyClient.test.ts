import { AuthType } from "../AuthType";
import { resetConfigContext, updateConfigContext } from "../ConfigContext";
import { DatabaseAccount } from "../Contracts/DataModels";
import { Collection } from "../Contracts/ViewModels";
import DocumentId from "../Explorer/Tree/DocumentId";
import { extractFeatures } from "../Platform/Hosted/extractFeatures";
import { updateUserContext } from "../UserContext";
import {
  deleteDocument,
  getEndpoint,
  getFeatureEndpointOrDefault,
  queryDocuments,
  readDocument,
  updateDocument,
} from "./MongoProxyClient";

const databaseId = "testDB";

const fetchMock = () => {
  return Promise.resolve({
    ok: true,
    text: () => "{}",
    json: () => "{}",
    headers: new Map(),
  });
};

const partitionKeyProperties = ["pk"];

const collection = {
  id: () => "testCollection",
  rid: "testCollectionrid",
  partitionKeyProperties,
  partitionKey: {
    paths: ["/pk"],
    kind: "Hash",
    version: 1,
  },
} as Collection;

const documentId = {
  partitionKeyHeader: () => "[]",
  self: "db/testDB/db/testCollection/docs/testId",
  partitionKeyProperties,
  partitionKey: {
    paths: ["/pk"],
    kind: "Hash",
    version: 1,
  },
} as unknown as DocumentId;

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
    cassandraEndpoint: "foo",
  },
} as DatabaseAccount;

describe("MongoProxyClient", () => {
  describe("queryDocuments", () => {
    beforeEach(() => {
      resetConfigContext();
      updateUserContext({
        databaseAccount,
      });
      updateConfigContext({
        BACKEND_ENDPOINT: "https://main.documentdb.ext.azure.com",
      });
      window.fetch = jest.fn().mockImplementation(fetchMock);
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("builds the correct URL", () => {
      queryDocuments(databaseId, collection, true, "{}");
      expect(window.fetch).toHaveBeenCalledWith(
        "https://main.documentdb.ext.azure.com/api/mongo/explorer/resourcelist?db=testDB&coll=testCollection&resourceUrl=bardbs%2FtestDB%2Fcolls%2FtestCollection%2Fdocs%2F&rid=testCollectionrid&rtype=docs&sid=&rg=&dba=foo&pk=pk",
        expect.any(Object),
      );
    });

    it("builds the correct proxy URL in development", () => {
      updateConfigContext({ MONGO_BACKEND_ENDPOINT: "https://localhost:1234" });
      queryDocuments(databaseId, collection, true, "{}");
      expect(window.fetch).toHaveBeenCalledWith(
        "https://localhost:1234/api/mongo/explorer/resourcelist?db=testDB&coll=testCollection&resourceUrl=bardbs%2FtestDB%2Fcolls%2FtestCollection%2Fdocs%2F&rid=testCollectionrid&rtype=docs&sid=&rg=&dba=foo&pk=pk",
        expect.any(Object),
      );
    });
  });
  describe("readDocument", () => {
    beforeEach(() => {
      resetConfigContext();
      updateUserContext({
        databaseAccount,
      });
      updateConfigContext({
        BACKEND_ENDPOINT: "https://main.documentdb.ext.azure.com",
      });
      window.fetch = jest.fn().mockImplementation(fetchMock);
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("builds the correct URL", () => {
      readDocument(databaseId, collection, documentId);
      expect(window.fetch).toHaveBeenCalledWith(
        "https://main.documentdb.ext.azure.com/api/mongo/explorer?db=testDB&coll=testCollection&resourceUrl=bardb%2FtestDB%2Fdb%2FtestCollection%2FtestId&rid=testId&rtype=docs&sid=&rg=&dba=foo&pk=pk",
        expect.any(Object),
      );
    });

    it("builds the correct proxy URL in development", () => {
      updateConfigContext({ MONGO_BACKEND_ENDPOINT: "https://localhost:1234" });
      readDocument(databaseId, collection, documentId);
      expect(window.fetch).toHaveBeenCalledWith(
        "https://localhost:1234/api/mongo/explorer?db=testDB&coll=testCollection&resourceUrl=bardb%2FtestDB%2Fdb%2FtestCollection%2FtestId&rid=testId&rtype=docs&sid=&rg=&dba=foo&pk=pk",
        expect.any(Object),
      );
    });
  });
  describe("createDocument", () => {
    beforeEach(() => {
      resetConfigContext();
      updateUserContext({
        databaseAccount,
      });
      updateConfigContext({
        BACKEND_ENDPOINT: "https://main.documentdb.ext.azure.com",
      });
      window.fetch = jest.fn().mockImplementation(fetchMock);
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("builds the correct URL", () => {
      readDocument(databaseId, collection, documentId);
      expect(window.fetch).toHaveBeenCalledWith(
        "https://main.documentdb.ext.azure.com/api/mongo/explorer?db=testDB&coll=testCollection&resourceUrl=bardb%2FtestDB%2Fdb%2FtestCollection%2FtestId&rid=testId&rtype=docs&sid=&rg=&dba=foo&pk=pk",
        expect.any(Object),
      );
    });

    it("builds the correct proxy URL in development", () => {
      updateConfigContext({ MONGO_BACKEND_ENDPOINT: "https://localhost:1234" });
      readDocument(databaseId, collection, documentId);
      expect(window.fetch).toHaveBeenCalledWith(
        "https://localhost:1234/api/mongo/explorer?db=testDB&coll=testCollection&resourceUrl=bardb%2FtestDB%2Fdb%2FtestCollection%2FtestId&rid=testId&rtype=docs&sid=&rg=&dba=foo&pk=pk",
        expect.any(Object),
      );
    });
  });
  describe("updateDocument", () => {
    beforeEach(() => {
      resetConfigContext();
      updateUserContext({
        databaseAccount,
      });
      updateConfigContext({
        BACKEND_ENDPOINT: "https://main.documentdb.ext.azure.com",
      });
      window.fetch = jest.fn().mockImplementation(fetchMock);
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("builds the correct URL", () => {
      updateDocument(databaseId, collection, documentId, "{}");
      expect(window.fetch).toHaveBeenCalledWith(
        "https://main.documentdb.ext.azure.com/api/mongo/explorer?db=testDB&coll=testCollection&resourceUrl=bardb%2FtestDB%2Fdb%2FtestCollection%2Fdocs%2FtestId&rid=testId&rtype=docs&sid=&rg=&dba=foo&pk=pk",
        expect.any(Object),
      );
    });

    it("builds the correct proxy URL in development", () => {
      updateConfigContext({ MONGO_BACKEND_ENDPOINT: "https://localhost:1234" });
      updateDocument(databaseId, collection, documentId, "{}");
      expect(window.fetch).toHaveBeenCalledWith(
        "https://localhost:1234/api/mongo/explorer?db=testDB&coll=testCollection&resourceUrl=bardb%2FtestDB%2Fdb%2FtestCollection%2Fdocs%2FtestId&rid=testId&rtype=docs&sid=&rg=&dba=foo&pk=pk",
        expect.any(Object),
      );
    });
  });
  describe("deleteDocument", () => {
    beforeEach(() => {
      resetConfigContext();
      updateUserContext({
        databaseAccount,
      });
      updateConfigContext({
        BACKEND_ENDPOINT: "https://main.documentdb.ext.azure.com",
      });
      window.fetch = jest.fn().mockImplementation(fetchMock);
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("builds the correct URL", () => {
      deleteDocument(databaseId, collection, documentId);
      expect(window.fetch).toHaveBeenCalledWith(
        "https://main.documentdb.ext.azure.com/api/mongo/explorer?db=testDB&coll=testCollection&resourceUrl=bardb%2FtestDB%2Fdb%2FtestCollection%2Fdocs%2FtestId&rid=testId&rtype=docs&sid=&rg=&dba=foo&pk=pk",
        expect.any(Object),
      );
    });

    it("builds the correct proxy URL in development", () => {
      updateConfigContext({ MONGO_BACKEND_ENDPOINT: "https://localhost:1234" });
      deleteDocument(databaseId, collection, documentId);
      expect(window.fetch).toHaveBeenCalledWith(
        "https://localhost:1234/api/mongo/explorer?db=testDB&coll=testCollection&resourceUrl=bardb%2FtestDB%2Fdb%2FtestCollection%2Fdocs%2FtestId&rid=testId&rtype=docs&sid=&rg=&dba=foo&pk=pk",
        expect.any(Object),
      );
    });
  });
  describe("getEndpoint", () => {
    beforeEach(() => {
      resetConfigContext();
      updateUserContext({
        databaseAccount,
      });
      updateConfigContext({
        BACKEND_ENDPOINT: "https://main.documentdb.ext.azure.com",
      });
    });

    it("returns a production endpoint", () => {
      const endpoint = getEndpoint("https://main.documentdb.ext.azure.com");
      expect(endpoint).toEqual("https://main.documentdb.ext.azure.com/api/mongo/explorer");
    });

    it("returns a development endpoint", () => {
      const endpoint = getEndpoint("https://localhost:1234");
      expect(endpoint).toEqual("https://localhost:1234/api/mongo/explorer");
    });

    it("returns a guest endpoint", () => {
      updateUserContext({
        authType: AuthType.EncryptedToken,
      });
      const endpoint = getEndpoint("https://main.documentdb.ext.azure.com");
      expect(endpoint).toEqual("https://main.documentdb.ext.azure.com/api/guest/mongo/explorer");
    });
  });
  describe("getFeatureEndpointOrDefault", () => {
    beforeEach(() => {
      resetConfigContext();
      updateConfigContext({
        BACKEND_ENDPOINT: "https://main.documentdb.ext.azure.com",
      });
      const params = new URLSearchParams({
        "feature.mongoProxyEndpoint": "https://localhost:12901",
        "feature.mongoProxyAPIs": "readDocument|createDocument",
      });
      const features = extractFeatures(params);
      updateUserContext({
        authType: AuthType.AAD,
        features: features,
      });
    });

    it("returns a local endpoint", () => {
      const endpoint = getFeatureEndpointOrDefault("readDocument");
      expect(endpoint).toEqual("https://localhost:12901/api/mongo/explorer");
    });

    it("returns a production endpoint", () => {
      const endpoint = getFeatureEndpointOrDefault("deleteDocument");
      expect(endpoint).toEqual("https://main.documentdb.ext.azure.com/api/mongo/explorer");
    });
  });
});
