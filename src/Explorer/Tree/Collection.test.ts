import * as DataModels from "../../Contracts/DataModels";
import Explorer from "../Explorer";
import Collection from "./Collection";
jest.mock("monaco-editor");

describe("Collection", () => {
  const generateCollection = (container: Explorer, databaseId: string, data: DataModels.Collection): Collection =>
    new Collection(container, databaseId, data);

  const generateMockCollectionsDataModelWithPartitionKey = (
    partitionKey: DataModels.PartitionKey
  ): DataModels.Collection => {
    return {
      defaultTtl: 1,
      indexingPolicy: {} as DataModels.IndexingPolicy,
      partitionKey,
      _rid: "",
      _self: "",
      _etag: "",
      _ts: 1,
      id: "",
    };
  };

  const generateMockCollectionWithDataModel = (data: DataModels.Collection): Collection => {
    const mockContainer = {} as Explorer;
    return generateCollection(mockContainer, "abc", data);
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
      expect(collection.partitionKeyProperties).toBe(["somePartitionKey.anotherPartitionKey"]);
    });

    it("should strip out forward slashes from single partition key paths", () => {
      const collectionsDataModel = generateMockCollectionsDataModelWithPartitionKey({
        paths: ["/somePartitionKey"],
        kind: "Hash",
        version: 2,
      });
      collection = generateMockCollectionWithDataModel(collectionsDataModel);
      expect(collection.partitionKeyProperties).toBe(["somePartitionKey"]);
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
      expect(collection.partitionKeyPropertyHeaders).toBe(["/somePartitionKey/anotherPartitionKey"]);
    });

    it("should preserve forward slash on a single partition key", () => {
      const collectionsDataModel = generateMockCollectionsDataModelWithPartitionKey({
        paths: ["/somePartitionKey"],
        kind: "Hash",
        version: 2,
      });
      collection = generateMockCollectionWithDataModel(collectionsDataModel);
      expect(collection.partitionKeyPropertyHeaders).toBe(["/somePartitionKey"]);
    });

    it("should be null if there is no partition key", () => {
      const collectionsDataModel = generateMockCollectionsDataModelWithPartitionKey({
        version: 2,
        paths: [],
        kind: "Hash",
      });
      collection = generateMockCollectionWithDataModel(collectionsDataModel);
      expect(collection.partitionKeyPropertyHeaders).toBeNull();
    });
  });
});
