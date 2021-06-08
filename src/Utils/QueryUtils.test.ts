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

    it("should not perform multiple queries if the first page of results has items", (done) => {
      const queryStub = sinon.stub().returns(Q.resolve(queryResultWithItemsInPage));
      QueryUtils.queryPagesUntilContentPresent(0, queryStub).finally(() => {
        expect(queryStub.callCount).toBe(1);
        expect(queryStub.getCall(0).args[0]).toBe(0);
        done();
      });
    });

    it("should not proceed with subsequent queries if the first one errors out", (done) => {
      const queryStub = sinon.stub().returns(Q.reject("Error injected for testing purposes"));
      QueryUtils.queryPagesUntilContentPresent(0, queryStub).finally(() => {
        expect(queryStub.callCount).toBe(1);
        expect(queryStub.getCall(0).args[0]).toBe(0);
        done();
      });
    });
  });

  describe("queryAllPages()", () => {
    const queryResultWithNoContinuation: ViewModels.QueryResults = {
      documents: [{ a: "123" }],
      activityId: "123",
      requestCharge: 1,
      hasMoreResults: false,
      firstItemIndex: 1,
      lastItemIndex: 1,
      itemCount: 1,
    };
    const queryResultWithContinuation: ViewModels.QueryResults = {
      documents: [{ b: "123" }],
      activityId: "123",
      requestCharge: 1,
      hasMoreResults: true,
      firstItemIndex: 0,
      lastItemIndex: 0,
      itemCount: 1,
    };

    it("should follow continuation token to fetch all pages", (done) => {
      const queryStub = sinon
        .stub()
        .onFirstCall()
        .returns(Q.resolve(queryResultWithContinuation))
        .returns(Q.resolve(queryResultWithNoContinuation));
      QueryUtils.queryAllPages(queryStub).then(
        (results: ViewModels.QueryResults) => {
          expect(queryStub.callCount).toBe(2);
          expect(queryStub.getCall(0).args[0]).toBe(0);
          expect(queryStub.getCall(1).args[0]).toBe(1);
          expect(results.itemCount).toBe(
            queryResultWithContinuation.documents.length + queryResultWithNoContinuation.documents.length
          );
          expect(results.requestCharge).toBe(
            queryResultWithContinuation.requestCharge + queryResultWithNoContinuation.requestCharge
          );
          expect(results.documents).toEqual(
            queryResultWithContinuation.documents.concat(queryResultWithNoContinuation.documents)
          );
          done();
        },
        (error: any) => {
          fail(error);
        }
      );
    });

    it("should not perform subsequent fetches when result has no continuation", (done) => {
      const queryStub = sinon.stub().returns(Q.resolve(queryResultWithNoContinuation));
      QueryUtils.queryAllPages(queryStub).then(
        (results: ViewModels.QueryResults) => {
          expect(queryStub.callCount).toBe(1);
          expect(queryStub.getCall(0).args[0]).toBe(0);
          expect(results.itemCount).toBe(queryResultWithNoContinuation.documents.length);
          expect(results.requestCharge).toBe(queryResultWithNoContinuation.requestCharge);
          expect(results.documents).toEqual(queryResultWithNoContinuation.documents);
          done();
        },
        (error: any) => {
          fail(error);
        }
      );
    });

    it("should not proceed with subsequent fetches if the first one errors out", (done) => {
      const queryStub = sinon.stub().returns(Q.reject("Error injected for testing purposes"));
      QueryUtils.queryAllPages(queryStub).finally(() => {
        expect(queryStub.callCount).toBe(1);
        expect(queryStub.getCall(0).args[0]).toBe(0);
        done();
      });
    });
  });
});
