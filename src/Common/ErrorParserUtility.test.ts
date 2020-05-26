import * as ErrorParserUtility from "./ErrorParserUtility";

describe("Error Parser Utility", () => {
  describe("shouldEnableCrossPartitionKeyForResourceWithPartitionKey()", () => {
    it("should parse a backend error correctly", () => {
      // A fake error matching what is thrown by the SDK on a bad collection create request
      const innerMessage =
        "The partition key component definition path '/asdwqr31 @#$#$WRadf' could not be accepted, failed near position '10'. Partition key paths must contain only valid characters and not contain a trailing slash or wildcard character.";
      const message = `Message: {\"Errors\":[\"${innerMessage}\"]}\r\nActivityId: 97b2e684-7505-4921-85f6-2513b9b28220, Request URI: /apps/89fdcf25-2a0b-4d2a-aab6-e161e565b26f/services/54911149-7bb1-4e7d-a1fa-22c8b36a4bb9/partitions/cc2a7a04-5f5a-4709-bcf7-8509b264963f/replicas/132304018743619218p, RequestStats: , SDK: Microsoft.Azure.Documents.Common/2.10.0`;
      const err = new Error(message) as any;
      err.code = 400;
      err.body = {
        code: "BadRequest",
        message
      };
      err.headers = {};
      err.activityId = "97b2e684-7505-4921-85f6-2513b9b28220";

      const parsedError = ErrorParserUtility.parse(err);
      expect(parsedError.length).toBe(1);
      expect(parsedError[0].message).toBe(innerMessage);
    });
  });
});
