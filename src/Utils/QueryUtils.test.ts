import { PartitionKey, PartitionKeyDefinition, PartitionKeyKind } from "@azure/cosmos";
import * as Q from "q";
import * as sinon from "sinon";
import * as DataModels from "../Contracts/DataModels";
import * as ViewModels from "../Contracts/ViewModels";
import * as QueryUtils from "./QueryUtils";
import { defaultQueryFields, extractPartitionKeyValues } from "./QueryUtils";

describe("Query Utils", () => {
  const generatePartitionKeyForPath = (path: string): DataModels.PartitionKey => {
    return {
      paths: [path],
      kind: "Hash",
      version: 2,
    };
  };

  describe("buildDocumentsQueryPartitionProjections()", () => {
    it("should return empty string if partition key is undefined", () => {
      expect(QueryUtils.buildDocumentsQueryPartitionProjections("c", undefined)).toBe("");
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

    it("should always include the default fields", () => {
      const query: string = QueryUtils.buildDocumentsQuery("", [], generatePartitionKeyForPath("/a"), []);

      defaultQueryFields.forEach((field) => {
        expect(query).toContain(`c.${field}`);
      });
    });

    it("should always include the default fields even if they are themselves partition key fields", () => {
      const query: string = QueryUtils.buildDocumentsQuery("", ["id"], generatePartitionKeyForPath("/id"), ["id"]);

      expect(query).toContain("c.id");
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

  describe("extractPartitionKey", () => {
    const documentContent = {
      "Volcano Name": "Adams",
      Country: "United States",
      Region: "US-Washington",
      Location: {
        type: "Point",
        coordinates: [-121.49, 46.206],
      },
      Elevation: 3742,
      Type: "Stratovolcano",
      Category: "",
      Status: "Tephrochronology",
      "Last Known Eruption": "Last known eruption from A.D. 1-1499, inclusive",
      id: "9e3c494e-8367-3f50-1f56-8c6fcb961363",
      _rid: "xzo0AJRYUxUFAAAAAAAAAA==",
      _self: "dbs/xzo0AA==/colls/xzo0AJRYUxU=/docs/xzo0AJRYUxUFAAAAAAAAAA==/",
      _etag: '"ce00fa43-0000-0100-0000-652840440000"',
      _attachments: "attachments/",
      _ts: 1697136708,
    };

    it("should extract single partition key value", () => {
      const singlePartitionKeyDefinition: PartitionKeyDefinition = {
        kind: PartitionKeyKind.Hash,
        paths: ["/Elevation"],
      };

      const partitionKeyValues: PartitionKey[] = extractPartitionKeyValues(
        documentContent,
        singlePartitionKeyDefinition,
      );
      expect(partitionKeyValues.length).toBe(1);
      expect(partitionKeyValues[0]).toEqual(3742);
    });

    it("should extract two partition key values", () => {
      const multiPartitionKeyDefinition: PartitionKeyDefinition = {
        kind: PartitionKeyKind.MultiHash,
        paths: ["/Type", "/Status"],
      };
      const expectedPartitionKeyValues: string[] = ["Stratovolcano", "Tephrochronology"];
      const partitionKeyValues: PartitionKey[] = extractPartitionKeyValues(
        documentContent,
        multiPartitionKeyDefinition,
      );
      expect(partitionKeyValues.length).toBe(2);
      expect(expectedPartitionKeyValues).toContain(documentContent["Type"]);
      expect(expectedPartitionKeyValues).toContain(documentContent["Status"]);
    });

    it("should extract three partition key values even if one is empty", () => {
      const multiPartitionKeyDefinition: PartitionKeyDefinition = {
        kind: PartitionKeyKind.MultiHash,
        paths: ["/Country", "/Region", "/Category"],
      };
      const expectedPartitionKeyValues: string[] = ["United States", "US-Washington", ""];
      const partitioinKeyValues: PartitionKey[] = extractPartitionKeyValues(
        documentContent,
        multiPartitionKeyDefinition,
      );
      expect(partitioinKeyValues.length).toBe(3);
      expect(expectedPartitionKeyValues).toContain(documentContent["Country"]);
      expect(expectedPartitionKeyValues).toContain(documentContent["Region"]);
      expect(expectedPartitionKeyValues).toContain(documentContent["Category"]);
    });

    it("should extract no partition key values in the case nested partition key", () => {
      const singlePartitionKeyDefinition: PartitionKeyDefinition = {
        kind: PartitionKeyKind.Hash,
        paths: ["/Location.type"],
      };
      const partitionKeyValues: PartitionKey[] = extractPartitionKeyValues(
        documentContent,
        singlePartitionKeyDefinition,
      );
      expect(partitionKeyValues.length).toBe(0);
    });

    it("should extract all partition key values for hierarchical and nested partition keys", () => {
      const mixedPartitionKeyDefinition: PartitionKeyDefinition = {
        kind: PartitionKeyKind.MultiHash,
        paths: ["/Country", "/Location/type"],
      };
      const partitionKeyValues: PartitionKey[] = extractPartitionKeyValues(
        documentContent,
        mixedPartitionKeyDefinition,
      );
      expect(partitionKeyValues.length).toBe(2);
      expect(partitionKeyValues).toEqual(["United States", "Point"]);
    });
  });
});
