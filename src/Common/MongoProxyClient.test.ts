import { MongoProxyEndpoints } from "Common/Constants";
import { AuthType } from "../AuthType";
import { configContext, resetConfigContext, updateConfigContext } from "../ConfigContext";
import { DatabaseAccount } from "../Contracts/DataModels";
import { Collection } from "../Contracts/ViewModels";
import DocumentId from "../Explorer/Tree/DocumentId";
import { updateUserContext } from "../UserContext";
import { deleteDocuments, getEndpoint, queryDocuments, readDocument, updateDocument } from "./MongoProxyClient";

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
        MONGO_PROXY_ENDPOINT: MongoProxyEndpoints.Prod,
        globallyEnabledMongoAPIs: [],
      });
      window.fetch = jest.fn().mockImplementation(fetchMock);
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("builds the correct URL", () => {
      queryDocuments(databaseId, collection, true, "{}");
      expect(window.fetch).toHaveBeenCalledWith(
        `${configContext.MONGO_PROXY_ENDPOINT}/api/mongo/explorer/resourcelist`,
        expect.any(Object),
      );
    });

    it("builds the correct proxy URL in development", () => {
      updateConfigContext({
        MONGO_PROXY_ENDPOINT: "https://localhost:1234",
        globallyEnabledMongoAPIs: [],
      });
      queryDocuments(databaseId, collection, true, "{}");
      expect(window.fetch).toHaveBeenCalledWith(
        `${configContext.MONGO_PROXY_ENDPOINT}/api/mongo/explorer/resourcelist`,
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
        MONGO_PROXY_ENDPOINT: MongoProxyEndpoints.Prod,
        globallyEnabledMongoAPIs: [],
      });
      window.fetch = jest.fn().mockImplementation(fetchMock);
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("builds the correct URL", () => {
      readDocument(databaseId, collection, documentId);
      expect(window.fetch).toHaveBeenCalledWith(
        `${configContext.MONGO_PROXY_ENDPOINT}/api/mongo/explorer`,
        expect.any(Object),
      );
    });

    it("builds the correct proxy URL in development", () => {
      updateConfigContext({
        MONGO_PROXY_ENDPOINT: "https://localhost:1234",
        globallyEnabledMongoAPIs: [],
      });
      readDocument(databaseId, collection, documentId);
      expect(window.fetch).toHaveBeenCalledWith(
        `${configContext.MONGO_PROXY_ENDPOINT}/api/mongo/explorer`,
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
        MONGO_PROXY_ENDPOINT: MongoProxyEndpoints.Prod,
        globallyEnabledMongoAPIs: [],
      });
      window.fetch = jest.fn().mockImplementation(fetchMock);
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("builds the correct URL", () => {
      readDocument(databaseId, collection, documentId);
      expect(window.fetch).toHaveBeenCalledWith(
        `${configContext.MONGO_PROXY_ENDPOINT}/api/mongo/explorer`,
        expect.any(Object),
      );
    });

    it("builds the correct proxy URL in development", () => {
      updateConfigContext({
        MONGO_PROXY_ENDPOINT: "https://localhost:1234",
        globallyEnabledMongoAPIs: [],
      });
      readDocument(databaseId, collection, documentId);
      expect(window.fetch).toHaveBeenCalledWith(
        `${configContext.MONGO_PROXY_ENDPOINT}/api/mongo/explorer`,
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
        MONGO_PROXY_ENDPOINT: MongoProxyEndpoints.Prod,
        globallyEnabledMongoAPIs: [],
      });
      window.fetch = jest.fn().mockImplementation(fetchMock);
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("builds the correct URL", () => {
      updateDocument(databaseId, collection, documentId, "{}");
      expect(window.fetch).toHaveBeenCalledWith(
        `${configContext.MONGO_PROXY_ENDPOINT}/api/mongo/explorer`,
        expect.any(Object),
      );
    });
  });
  describe("deleteDocuments", () => {
    beforeEach(() => {
      resetConfigContext();
      updateUserContext({
        databaseAccount,
      });
      updateConfigContext({
        MONGO_PROXY_ENDPOINT: MongoProxyEndpoints.Prod,
        globallyEnabledMongoAPIs: [],
      });
      window.fetch = jest.fn().mockImplementation(fetchMock);
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("builds the correct URL", () => {
      deleteDocuments(databaseId, collection, [documentId]);
      expect(window.fetch).toHaveBeenCalledWith(
        `${configContext.MONGO_PROXY_ENDPOINT}/api/mongo/explorer/bulkdelete`,
        expect.any(Object),
      );
    });

    it("builds the correct proxy URL in development", () => {
      updateConfigContext({
        MONGO_PROXY_ENDPOINT: "https://localhost:1234",
        globallyEnabledMongoAPIs: [],
      });
      deleteDocuments(databaseId, collection, [documentId]);
      expect(window.fetch).toHaveBeenCalledWith(
        `${configContext.MONGO_PROXY_ENDPOINT}/api/mongo/explorer/bulkdelete`,
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
        MONGO_PROXY_ENDPOINT: MongoProxyEndpoints.Prod,
        globallyEnabledMongoAPIs: [],
      });
    });

    it("returns a production endpoint", () => {
      const endpoint = getEndpoint(configContext.MONGO_PROXY_ENDPOINT);
      expect(endpoint).toEqual(`${configContext.MONGO_PROXY_ENDPOINT}/api/mongo/explorer`);
    });

    it("returns a development endpoint", () => {
      const endpoint = getEndpoint("https://localhost:1234");
      expect(endpoint).toEqual("https://localhost:1234/api/mongo/explorer");
    });

    it("returns a guest endpoint", () => {
      updateUserContext({
        authType: AuthType.EncryptedToken,
      });
      const endpoint = getEndpoint(configContext.MONGO_PROXY_ENDPOINT);
      expect(endpoint).toEqual(`${configContext.MONGO_PROXY_ENDPOINT}/api/connectionstring/mongo/explorer`);
    });
  });
});
