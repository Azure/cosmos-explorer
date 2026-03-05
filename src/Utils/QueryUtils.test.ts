import { PartitionKey, PartitionKeyDefinition, PartitionKeyKind } from "@azure/cosmos";
import * as Q from "q";
import * as sinon from "sinon";
import * as DataModels from "../Contracts/DataModels";
import * as ViewModels from "../Contracts/ViewModels";
import * as QueryUtils from "./QueryUtils";
import {
  defaultQueryFields,
  extractPartitionKeyValues,
  getValueForPath,
  stripDoubleQuotesFromSegment,
} from "./QueryUtils";

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

describe("Query Utils", () => {
  const generatePartitionKeyForPath = (path: string): DataModels.PartitionKey => {
    return {
      paths: [path],
      kind: "Hash",
      version: 2,
    };
  };
  const generatePartitionKeysForPaths = (paths: string[]): DataModels.PartitionKey => {
    return {
      paths: paths,
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

    it("should always include {} for any missing partition keys", () => {
      const query = QueryUtils.buildDocumentsQuery(
        "",
        ["a", "b", "c"],
        generatePartitionKeysForPaths(["/a", "/b", "/c"]),
        [],
      );
      expect(query).toContain('IIF(IS_DEFINED(c["a"]), c["a"], {})');
      expect(query).toContain('IIF(IS_DEFINED(c["b"]), c["b"], {})');
      expect(query).toContain('IIF(IS_DEFINED(c["c"]), c["c"], {})');
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

  describe("getValueForPath", () => {
    it("should return the correct value for a simple path", () => {
      const pathSegments = ["Volcano Name"];
      expect(getValueForPath(documentContent, pathSegments)).toBe("Adams");
    });
    it("should return the correct value for a nested path", () => {
      const pathSegments = ["Location", "coordinates"];
      expect(getValueForPath(documentContent, pathSegments)).toEqual([-121.49, 46.206]);
    });
    it("should return undefined for a non-existing path", () => {
      const pathSegments = ["NonExistent", "Path"];
      expect(getValueForPath(documentContent, pathSegments)).toBeUndefined();
    });
    it("should return undefined for an invalid path", () => {
      const pathSegments = ["Location", "InvalidKey"];
      expect(getValueForPath(documentContent, pathSegments)).toBeUndefined();
    });
    it("should return the root object if pathSegments is empty", () => {
      const pathSegments: string[] = [];
      expect(getValueForPath(documentContent, pathSegments)).toBeUndefined();
    });
  });

  describe("extractPartitionKey", () => {
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

    it("if any partition key is null or empty string, the partitionKeyValues shall match", () => {
      const newDocumentContent = {
        ...documentContent,
        ...{
          Country: null,
          Location: {
            type: "",
            coordinates: [-121.49, 46.206],
          },
        },
      };

      const mixedPartitionKeyDefinition: PartitionKeyDefinition = {
        kind: PartitionKeyKind.MultiHash,
        paths: ["/Country", "/Location/type"],
      };
      const partitionKeyValues: PartitionKey[] = extractPartitionKeyValues(
        newDocumentContent,
        mixedPartitionKeyDefinition,
      );
      expect(partitionKeyValues.length).toBe(2);
      expect(partitionKeyValues).toEqual([null, ""]);
    });

    it("if any partition key doesn't exist, it should still set partitionkey value as {}", () => {
      const newDocumentContent = {
        ...documentContent,
        ...{
          Country: null,
          Location: {
            coordinates: [-121.49, 46.206],
          },
        },
      };

      const mixedPartitionKeyDefinition: PartitionKeyDefinition = {
        kind: PartitionKeyKind.MultiHash,
        paths: ["/Country", "/Location/type"],
      };
      const partitionKeyValues: PartitionKey[] = extractPartitionKeyValues(
        newDocumentContent,
        mixedPartitionKeyDefinition,
      );
      expect(partitionKeyValues.length).toBe(2);
      expect(partitionKeyValues).toEqual([null, {}]);
    });

    it("should extract partition key value when path has enclosing double quotes", () => {
      const docWithSpecialKey = {
        id: "test-id",
        "partition-key": "some-value",
      };

      const partitionKeyDefinition: PartitionKeyDefinition = {
        kind: PartitionKeyKind.Hash,
        paths: ['/"partition-key"'],
      };

      const partitionKeyValues: PartitionKey[] = extractPartitionKeyValues(docWithSpecialKey, partitionKeyDefinition);
      expect(partitionKeyValues.length).toBe(1);
      expect(partitionKeyValues[0]).toEqual("some-value");
    });

    it("should extract nested partition key value when path segments have enclosing double quotes", () => {
      const docWithSpecialKey = {
        id: "test-id",
        "my-field": {
          "sub-field": 42,
        },
      };

      const partitionKeyDefinition: PartitionKeyDefinition = {
        kind: PartitionKeyKind.Hash,
        paths: ['/"my-field"/"sub-field"'],
      };

      const partitionKeyValues: PartitionKey[] = extractPartitionKeyValues(docWithSpecialKey, partitionKeyDefinition);
      expect(partitionKeyValues.length).toBe(1);
      expect(partitionKeyValues[0]).toEqual(42);
    });

    it("should return {} for missing double-quoted partition key", () => {
      const docWithSpecialKey = {
        id: "test-id",
      };

      const partitionKeyDefinition: PartitionKeyDefinition = {
        kind: PartitionKeyKind.Hash,
        paths: ['/"partition-key"'],
      };

      const partitionKeyValues: PartitionKey[] = extractPartitionKeyValues(docWithSpecialKey, partitionKeyDefinition);
      expect(partitionKeyValues.length).toBe(1);
      expect(partitionKeyValues[0]).toEqual({});
    });

    it("should handle multi-hash with mixed quoted and unquoted paths", () => {
      const doc = {
        id: "test-id",
        Country: "Japan",
        "partition-key": "hello",
      };

      const partitionKeyDefinition: PartitionKeyDefinition = {
        kind: PartitionKeyKind.MultiHash,
        paths: ["/Country", '/"partition-key"'],
      };

      const partitionKeyValues: PartitionKey[] = extractPartitionKeyValues(doc, partitionKeyDefinition);
      expect(partitionKeyValues.length).toBe(2);
      expect(partitionKeyValues).toEqual(["Japan", "hello"]);
    });
  });

  describe("stripDoubleQuotesFromSegment", () => {
    it("should strip enclosing double quotes", () => {
      expect(stripDoubleQuotesFromSegment('"partition-key"')).toBe("partition-key");
    });

    it("should not strip if only opening quote", () => {
      expect(stripDoubleQuotesFromSegment('"partition-key')).toBe('"partition-key');
    });

    it("should not strip if only closing quote", () => {
      expect(stripDoubleQuotesFromSegment('partition-key"')).toBe('partition-key"');
    });

    it("should return empty string when stripping quotes from empty quoted string", () => {
      expect(stripDoubleQuotesFromSegment('""')).toBe("");
    });

    it("should not modify unquoted segments", () => {
      expect(stripDoubleQuotesFromSegment("Country")).toBe("Country");
    });

    it("should not strip single quotes", () => {
      expect(stripDoubleQuotesFromSegment("'partition-key'")).toBe("'partition-key'");
    });
  });
});
