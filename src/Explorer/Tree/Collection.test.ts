import * as DataModels from "../../Contracts/DataModels";
import Explorer from "../Explorer";
import Collection from "./Collection";
jest.mock("monaco-editor");

describe("Collection", () => {
  const generateCollection = (container: Explorer, databaseId: string, data: DataModels.Collection): Collection =>
    new Collection(container, databaseId, data);

  const generateMockCollectionsDataModelWithPartitionKey = (
    partitionKey: DataModels.PartitionKey,
  ): DataModels.Collection => {
    return {
      defaultTtl: 1,
      indexingPolicy: {} as DataModels.IndexingPolicy,
      partitionKey,
      _rid: "testRid",
      _self: "testSelf",
      _etag: "testEtag",
      _ts: 1,
      id: "testCollection",
    };
  };

  const generateMockCollectionWithDataModel = (data: DataModels.Collection): Collection => {
    const mockContainer = {
      isReadOnly: () => false,
      isFabricCapable: () => true,
      databaseAccount: () => ({
        name: () => "testAccount",
        id: () => "testAccount",
        properties: {
          enablePartitionKey: true,
          partitionKeyDefinitionVersion: 2,
          capabilities: [] as string[],
          databaseAccountEndpoint: "test.documents.azure.com",
        },
      }),
    } as unknown as Explorer;
    return generateCollection(mockContainer, "testDb", data);
  };

  describe("Partition key path parsing", () => {
    let collection: Collection;

    it("should strip out multiple forward slashes from partition key paths", () => {
      const collectionsDataModel = generateMockCollectionsDataModelWithPartitionKey({
        paths: ["/somePartitionKey/anotherPartitionKey"],
        kind: "Hash",
        version: 2,
      });
      collection = generateMockCollectionWithDataModel(collectionsDataModel);
      expect(collection.partitionKeyProperties.length).toBe(1);
      expect(collection.partitionKeyProperties[0]).toBe("somePartitionKey.anotherPartitionKey");
    });

    it("should strip out forward slashes from single partition key paths", () => {
      const collectionsDataModel = generateMockCollectionsDataModelWithPartitionKey({
        paths: ["/somePartitionKey"],
        kind: "Hash",
        version: 2,
      });
      collection = generateMockCollectionWithDataModel(collectionsDataModel);
      expect(collection.partitionKeyProperties.length).toBe(1);
      expect(collection.partitionKeyProperties[0]).toBe("somePartitionKey");
    });
  });

  describe("Partition key path header", () => {
    let collection: Collection;

    it("should preserve forward slashes on partition keys", () => {
      const collectionsDataModel = generateMockCollectionsDataModelWithPartitionKey({
        paths: ["/somePartitionKey/anotherPartitionKey"],
        kind: "Hash",
        version: 2,
      });
      collection = generateMockCollectionWithDataModel(collectionsDataModel);
      expect(collection.partitionKeyPropertyHeaders.length).toBe(1);
      expect(collection.partitionKeyPropertyHeaders[0]).toBe("/somePartitionKey/anotherPartitionKey");
    });

    it("should preserve forward slash on a single partition key", () => {
      const collectionsDataModel = generateMockCollectionsDataModelWithPartitionKey({
        paths: ["/somePartitionKey"],
        kind: "Hash",
        version: 2,
      });
      collection = generateMockCollectionWithDataModel(collectionsDataModel);
      expect(collection.partitionKeyPropertyHeaders.length).toBe(1);
      expect(collection.partitionKeyPropertyHeaders[0]).toBe("/somePartitionKey");
    });

    it("should be empty if there is no partition key", () => {
      const collectionsDataModel = generateMockCollectionsDataModelWithPartitionKey({
        version: 2,
        paths: [],
        kind: "Hash",
      });
      collection = generateMockCollectionWithDataModel(collectionsDataModel);
      expect(collection.partitionKeyPropertyHeaders.length).toBe(0);
    });
  });

  describe("Collection properties", () => {
    let collection: Collection;
    const collectionsDataModel = generateMockCollectionsDataModelWithPartitionKey({
      paths: ["/id"],
      kind: "Hash",
      version: 2,
    });

    beforeEach(() => {
      collection = generateMockCollectionWithDataModel(collectionsDataModel);
    });

    it("should return correct collection id", () => {
      expect(collection.id()).toBe("testCollection");
    });

    it("should return correct rid", () => {
      expect(collection.rid).toBe("testRid");
    });

    it("should return correct self", () => {
      expect(collection.self).toBe("testSelf");
    });

    it("should return correct collection type", () => {
      expect(collection.partitionKey).toBeDefined();
    });
  });

  describe("Collection type", () => {
    it("should identify large partitioned collection for v2 partition key", () => {
      const collectionsDataModel = generateMockCollectionsDataModelWithPartitionKey({
        paths: ["/id"],
        kind: "Hash",
        version: 2,
      });
      const collection = generateMockCollectionWithDataModel(collectionsDataModel);
      expect(collection.partitionKey.version).toBe(2);
      expect(collection.partitionKey.paths).toEqual(["/id"]);
    });

    it("should identify standard partitioned collection for v1 partition key", () => {
      const collectionsDataModel = generateMockCollectionsDataModelWithPartitionKey({
        paths: ["/id"],
        kind: "Hash",
        version: 1,
      });
      const collection = generateMockCollectionWithDataModel(collectionsDataModel);
      expect(collection.partitionKey.version).toBe(1);
      expect(collection.partitionKey.paths).toEqual(["/id"]);
    });

    it("should identify collection without partition key", () => {
      const collectionsDataModel = generateMockCollectionsDataModelWithPartitionKey({
        paths: [],
        kind: "Hash",
        version: 2,
      });
      const collection = generateMockCollectionWithDataModel(collectionsDataModel);
      expect(collection.partitionKey.paths).toEqual([]);
    });
  });

  describe("Partition key handling", () => {
    it("should return correct partition key paths for multiple paths", () => {
      const collectionsDataModel = generateMockCollectionsDataModelWithPartitionKey({
        paths: ["/id", "/pk"],
        kind: "Hash",
        version: 2,
      });
      const collection = generateMockCollectionWithDataModel(collectionsDataModel);
      expect(collection.partitionKey.paths).toEqual(["/id", "/pk"]);
      expect(collection.partitionKeyProperties).toEqual(["id", "pk"]);
    });

    it("should handle empty partition key paths", () => {
      const collectionsDataModel = generateMockCollectionsDataModelWithPartitionKey({
        paths: [],
        kind: "Hash",
        version: 2,
      });
      const collection = generateMockCollectionWithDataModel(collectionsDataModel);
      expect(collection.partitionKey.paths).toEqual([]);
      expect(collection.partitionKeyProperties).toEqual([]);
    });

    it("should handle undefined partition key", () => {
      const collectionData = generateMockCollectionsDataModelWithPartitionKey({
        paths: ["/id"],
        kind: "Hash",
        version: 2,
      });
      delete collectionData.partitionKey;
      const collection = generateMockCollectionWithDataModel(collectionData);
      expect(collection.partitionKey).toBeUndefined();
      expect(collection.partitionKeyProperties).toEqual([]);
    });
  });
});
