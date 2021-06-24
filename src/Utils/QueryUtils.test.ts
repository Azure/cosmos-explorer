import * as Q from "q";
import * as sinon from "sinon";
import * as DataModels from "../Contracts/DataModels";
import * as ViewModels from "../Contracts/ViewModels";
import * as QueryUtils from "./QueryUtils";

describe("Query Utils", () => {
  function generatePartitionKeyForPath(path: string): DataModels.PartitionKey {
    return {
      paths: [path],
      kind: "Hash",
      version: 2,
    };
  }

  describe("buildDocumentsQueryPartitionProjections()", () => {
    it("should return empty string if partition key is undefined", () => {
      expect(QueryUtils.buildDocumentsQueryPartitionProjections("c", undefined)).toBe("");
    });

    it("should return empty string if partition key is null", () => {
      expect(QueryUtils.buildDocumentsQueryPartitionProjections("c", null)).toBe("");
    });

    it("should replace slashes and embed projection in square braces", () => {
      const partitionKey: DataModels.PartitionKey = generatePartitionKeyForPath("/a");
      const partitionProjection: string = QueryUtils.buildDocumentsQueryPartitionProjections("c", partitionKey);

      expect(partitionProjection).toContain('c["a"]');
    });

    it("should embed multiple projections in individual square braces", () => {
      const partitionKey: DataModels.PartitionKey = generatePartitionKeyForPath("/a/b");
      const partitionProjection: string = QueryUtils.buildDocumentsQueryPartitionProjections("c", partitionKey);

      expect(partitionProjection).toContain('c["a"]["b"]');
    });

    it("should not escape double quotes if partition key definition does not have single quote prefix", () => {
      const partitionKey: DataModels.PartitionKey = generatePartitionKeyForPath('/"a"');
      const partitionProjection: string = QueryUtils.buildDocumentsQueryPartitionProjections("c", partitionKey);

      expect(partitionProjection).toContain('c["a"]');
    });

    it("should escape single quotes", () => {
      const partitionKey: DataModels.PartitionKey = generatePartitionKeyForPath("/'\"a\"'");
      const partitionProjection: string = QueryUtils.buildDocumentsQueryPartitionProjections("c", partitionKey);

      expect(partitionProjection).toContain('c["\\\\\\"a\\\\\\""]');
    });

    it("should escape double quotes if partition key definition has single quote prefix", () => {
      const partitionKey: DataModels.PartitionKey = generatePartitionKeyForPath("/'\\\"a\\\"'");
      const partitionProjection: string = QueryUtils.buildDocumentsQueryPartitionProjections("c", partitionKey);

      expect(partitionProjection).toContain('c["\\\\\\"a\\\\\\""]');
    });
  });

  describe("queryPagesUntilContentPresent()", () => {
    const queryResultWithItemsInPage: ViewModels.QueryResults = {
      documents: [{ a: "123" }],
      activityId: "123",
      requestCharge: 1,
      hasMoreResults: false,
      firstItemIndex: 0,
      lastItemIndex: 1,
      itemCount: 1,
    };
    const queryResultWithNoItemsInPage: ViewModels.QueryResults = {
      documents: [],
      activityId: "123",
      requestCharge: 1,
      hasMoreResults: true,
      firstItemIndex: 0,
      lastItemIndex: 0,
      itemCount: 0,
    };

    it("should perform multiple queries until it finds a page that has items", async () => {
      const queryStub = sinon
        .stub()
        .onFirstCall()
        .returns(Q.resolve(queryResultWithNoItemsInPage))
        .returns(Q.resolve(queryResultWithItemsInPage));

      await QueryUtils.queryPagesUntilContentPresent(0, queryStub);
      expect(queryStub.callCount).toBe(2);
      expect(queryStub.getCall(0).args[0]).toBe(0);
      expect(queryStub.getCall(1).args[0]).toBe(0);
    });

    it("should not perform multiple queries if the first page of results has items", async () => {
      const queryStub = sinon.stub().returns(Q.resolve(queryResultWithItemsInPage));
      await QueryUtils.queryPagesUntilContentPresent(0, queryStub);
      expect(queryStub.callCount).toBe(1);
      expect(queryStub.getCall(0).args[0]).toBe(0);
    });
  });
});
