import * as ko from "knockout";
import { PartitionKey, Resource } from "../../../src/Contracts/DataModels";
import DocumentId from "../Tree/DocumentId";
import * as DocumentTabUtils from "./DocumentTabUtils";

describe("DocumentTabUtils", () => {
  describe("getfilterText()", () => {
    it("Should return filter if isPreferredApiMongoDB is true and filter is applied ", () => {
      const filteredText: string = DocumentTabUtils.getfilterText(true, `{"_id": "foo"}`);
      expect(filteredText).toBe(`Filter : {"_id": "foo"}`);
    });
    it("Should return `No filter applied` if isPreferredApiMongoDB is true and filter is not applied ", () => {
      const filteredText: string = DocumentTabUtils.getfilterText(true, "");
      expect(filteredText).toBe("No filter applied");
    });
    it("Should return `Select * from C` with filter if isPreferredApiMongoDB is false and filter is applied ", () => {
      const filteredText: string = DocumentTabUtils.getfilterText(false, `WHERE c.id = "foo"`);
      expect(filteredText).toBe(`Select * from C WHERE c.id = "foo"`);
    });
  });

  describe("formatDocumentContent()", () => {
    const fakeDocumentData = {} as DocumentId;
    fakeDocumentData.partitionKeyProperty = "test";
    fakeDocumentData.id = ko.observable("id");

    it("should return formatted content with new line each property.", () => {
      fakeDocumentData.partitionKeyValue = "partitionValue";
      const formattedContent: string = DocumentTabUtils.formatDocumentContent(fakeDocumentData);
      expect(formattedContent).toBe(`{\n"_id":"id",\n"test":"partitionValue"\n}`);
    });

    it("should return formatted content with empty partitionKeyValue when partitionKeyValue is undefined.", () => {
      fakeDocumentData.partitionKeyValue = undefined;
      const formattedContent: string = DocumentTabUtils.formatDocumentContent(fakeDocumentData);
      expect(formattedContent).toBe(`{\n"_id":"id",\n"test":""\n}`);
    });
  });

  describe("formatSqlDocumentContent()", () => {
    const fakeDocumentData = {} as Resource;
    it("should return formatted content with new line each property.", () => {
      fakeDocumentData.id = "testId";
      fakeDocumentData._rid = "testRid";
      fakeDocumentData._self = "testSelf";
      fakeDocumentData._ts = "testTs";
      fakeDocumentData._etag = "testEtag";
      fakeDocumentData._partitionKeyValue = "testPartitionKeyValue";
      const formattedContent: string = DocumentTabUtils.formatSqlDocumentContent(fakeDocumentData);
      expect(formattedContent).toBe(
        `{\n"id":"testId",\n"_rid":"testRid",\n"_self":"testSelf",\n"_ts":"testTs",\n"_etag":"testEtag",\n"_partitionKeyValue":"testPartitionKeyValue"\n}`
      );
    });

    it("should return formatted content with empty value when key value is undefined.", () => {
      fakeDocumentData.id = undefined;
      fakeDocumentData._rid = undefined;
      fakeDocumentData._self = undefined;
      fakeDocumentData._ts = undefined;
      fakeDocumentData._etag = undefined;
      fakeDocumentData._partitionKeyValue = undefined;
      const formattedContent: string = DocumentTabUtils.formatSqlDocumentContent(fakeDocumentData);
      expect(formattedContent).toBe(
        `{\n"id":"",\n"_rid":"",\n"_self":"",\n"_ts":"",\n"_etag":"",\n"_partitionKeyValue":""\n}`
      );
    });

    describe("getPartitionKeyDefinition()", () => {
      const partitionKey = {} as PartitionKey;
      partitionKey.kind = "Hash";
      partitionKey.version = 1;
      partitionKey.systemKey = true;
      const partitionKeyProperty = "testPartitionKey";

      it("should return formatted partitionKey with formatted path.", () => {
        partitionKey.paths = ["test"];
        const formattedPartitionKey = DocumentTabUtils.getPartitionKeyDefinition(partitionKey, partitionKeyProperty);
        expect(formattedPartitionKey).toEqual({ kind: "Hash", version: 1, systemKey: true, paths: ["test"] });
      });

      it("should return partitionKey with undefined paths if paths is undefined.", () => {
        partitionKey.paths = undefined;
        const formattedPartitionKey = DocumentTabUtils.getPartitionKeyDefinition(partitionKey, partitionKeyProperty);
        expect(formattedPartitionKey).toEqual({ kind: "Hash", version: 1, systemKey: true, paths: undefined });
      });
    });
  });
});
