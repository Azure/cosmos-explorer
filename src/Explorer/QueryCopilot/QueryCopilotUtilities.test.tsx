import { FeedOptions } from "@azure/cosmos";
import { handleError } from "Common/ErrorHandlingUtils";
import { sampleDataClient } from "Common/SampleDataClient";
import * as commonUtils from "Common/dataAccess/queryDocuments";
import DocumentId from "Explorer/Tree/DocumentId";
import { querySampleDocuments, readSampleDocument } from "./QueryCopilotUtilities";

jest.mock("Explorer/Tree/DocumentId", () => {
  return jest.fn().mockImplementation(() => {
    return {
      id: jest.fn(),
      loadDocument: jest.fn(),
    };
  });
});

jest.mock("Utils/NotificationConsoleUtils", () => ({
  logConsoleProgress: jest.fn().mockReturnValue((): void => undefined),
  logConsoleError: jest.fn(),
}));

jest.mock("@azure/cosmos", () => ({
  FeedOptions: jest.fn(),
  QueryIterator: jest.fn(),
  Constants: {
    HttpHeaders: {},
  },
}));
jest.mock("Common/ErrorHandlingUtils", () => ({
  handleError: jest.fn(),
}));

jest.mock("Common/dataAccess/queryDocuments", () => ({
  getCommonQueryOptions: jest.fn((options) => options),
}));

jest.mock("Common/SampleDataClient");

jest.mock("node-fetch");

jest.mock("Explorer/Explorer", () => {
  class MockExplorer {
    allocateContainer = jest.fn().mockResolvedValueOnce({});
  }
  return MockExplorer;
});

jest.mock("hooks/useQueryCopilot", () => {
  const mockQueryCopilotStore = {
    shouldAllocateContainer: true,
    setShouldAllocateContainer: jest.fn(),
    correlationId: "mocked-correlation-id",
  };

  return {
    useQueryCopilot: jest.fn(() => mockQueryCopilotStore),
  };
});

describe("QueryCopilotUtilities", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("querySampleDocuments", () => {
    (sampleDataClient as jest.Mock).mockReturnValue({
      database: jest.fn().mockReturnValue({
        container: jest.fn().mockReturnValue({
          items: {
            query: jest.fn().mockReturnValue([]),
          },
        }),
      }),
    });

    it("calls getCommonQueryOptions with the provided options", () => {
      const query = "sample query";
      const options: FeedOptions = { maxItemCount: 10 };
      
      querySampleDocuments(query, options);

      expect(commonUtils.getCommonQueryOptions).toHaveBeenCalledWith(options);
    });

    it("returns the result of items.query method", () => {
      const query = "sample query";
      const options: FeedOptions = { maxItemCount: 10 };
      querySampleDocuments(query, options);
      const mockResult = [
        { id: 1, name: "Document 1" },
        { id: 2, name: "Document 2" },
      ];

      // Mock the items.query method to return the mockResult
      (
        sampleDataClient().database("CopilotSampleDb").container("SampleContainer").items.query as jest.Mock
      ).mockReturnValue(mockResult);

      const result = querySampleDocuments(query, options);

      expect(result).toEqual(mockResult);
    });
  });

  describe("readSampleDocument", () => {
    it("should call the read method with the correct parameters", async () => {
      (sampleDataClient as jest.Mock).mockReturnValue({
        database: jest.fn().mockReturnValue({
          container: jest.fn().mockReturnValue({
            item: jest.fn().mockReturnValue({
              read: jest.fn().mockResolvedValue({
                resource: {},
              }),
            }),
          }),
        }),
      });

      const documentId = new DocumentId(null, "DocumentId", []);
      const expectedResponse = {};

      const result = await readSampleDocument(documentId);

      expect(sampleDataClient).toHaveBeenCalled();
      expect(sampleDataClient().database).toHaveBeenCalledWith("CopilotSampleDb");
      expect(sampleDataClient().database("CopilotSampleDb").container).toHaveBeenCalledWith("SampleContainer");
      expect(
        sampleDataClient().database("CopilotSampleDb").container("SampleContainer").item("DocumentId", undefined).read,
      ).toHaveBeenCalled();
      expect(result).toEqual(expectedResponse);
    });

    it("should handle an error and re-throw it", async () => {
      (sampleDataClient as jest.Mock).mockReturnValue({
        database: jest.fn().mockReturnValue({
          container: jest.fn().mockReturnValue({
            item: jest.fn().mockReturnValue({
              read: jest.fn().mockRejectedValue(new Error("Mock error")),
            }),
          }),
        }),
      });

      const errorMock = new Error("Mock error");
      const documentId = new DocumentId(null, "DocumentId", []);

      await expect(readSampleDocument(documentId)).rejects.toStrictEqual(errorMock);

      expect(sampleDataClient).toHaveBeenCalled();
      expect(sampleDataClient().database).toHaveBeenCalledWith("CopilotSampleDb");
      expect(sampleDataClient().database("CopilotSampleDb").container).toHaveBeenCalledWith("SampleContainer");
      expect(
        sampleDataClient().database("CopilotSampleDb").container("SampleContainer").item("DocumentId", undefined).read,
      ).toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(errorMock, "ReadDocument", expect.any(String));
    });
  });
});
