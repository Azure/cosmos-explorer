import { QueryCopilotSampleContainerSchema, ShortenedQueryCopilotSampleContainerSchema } from "Common/Constants";
import { handleError } from "Common/ErrorHandlingUtils";
import { createUri } from "Common/UrlUtility";
import Explorer from "Explorer/Explorer";
import { useNotebook } from "Explorer/Notebook/useNotebook";
import { submitFeedback } from "Explorer/QueryCopilot/Shared/QueryCopilotClient";
import { userContext } from "UserContext";

jest.mock("@azure/cosmos", () => ({
  Constants: {
    HttpHeaders: {},
  },
}));

jest.mock("Common/ErrorHandlingUtils", () => ({
  handleError: jest.fn(),
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

describe("Query Copilot Client", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("submitFeedback", () => {
    const payload = {
      like: "like",
      generatedSql: "GeneratedQuery",
      userPrompt: "UserPrompt",
      description: "Description",
      contact: "Contact",
      containerSchema: userContext.features.enableCopilotFullSchema
        ? QueryCopilotSampleContainerSchema
        : ShortenedQueryCopilotSampleContainerSchema,
    };

    const mockStore = useNotebook.getState();
    beforeEach(() => {
      mockStore.notebookServerInfo = {
        notebookServerEndpoint: "mocked-endpoint",
        authToken: "mocked-token",
        forwardingId: "mocked-forwarding-id",
      };
    });

    const feedbackUri = userContext.features.enableCopilotPhoenixGateaway
      ? createUri(useNotebook.getState().notebookServerInfo.notebookServerEndpoint, "feedback")
      : createUri("https://copilotorchestrater.azurewebsites.net/", "feedback");

    it("should call fetch with the payload with like", async () => {
      const mockFetch = jest.fn().mockResolvedValueOnce({});

      globalThis.fetch = mockFetch;
      await submitFeedback({
        params: {
          likeQuery: true,
          generatedQuery: "GeneratedQuery",
          userPrompt: "UserPrompt",
          description: "Description",
          contact: "Contact",
        },
        explorer: new Explorer(),
      });

      expect(mockFetch).toHaveBeenCalledWith(
        feedbackUri,
        expect.objectContaining({
          headers: expect.objectContaining({
            "x-ms-correlationid": "mocked-correlation-id",
          }),
        })
      );

      const actualBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(actualBody).toEqual(payload);
    });

    it("should call fetch with the payload with unlike and empty parameters", async () => {
      payload.like = "dislike";
      payload.description = "";
      payload.contact = "";
      const mockFetch = jest.fn().mockResolvedValueOnce({});

      globalThis.fetch = mockFetch;

      await submitFeedback({
        params: {
          likeQuery: false,
          generatedQuery: "GeneratedQuery",
          userPrompt: "UserPrompt",
          description: undefined,
          contact: undefined,
        },
        explorer: new Explorer(),
      });

      expect(mockFetch).toHaveBeenCalledWith(
        feedbackUri,
        expect.objectContaining({
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-ms-correlationid": "mocked-correlation-id",
          },
        })
      );

      const actualBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(actualBody).toEqual(payload);
    });

    it("should handle errors and call handleError", async () => {
      globalThis.fetch = jest.fn().mockRejectedValueOnce(new Error("Mock error"));

      await submitFeedback({
        params: {
          likeQuery: true,
          generatedQuery: "GeneratedQuery",
          userPrompt: "UserPrompt",
          description: "Description",
          contact: "Contact",
        },
        explorer: new Explorer(),
      }).catch((error) => {
        expect(error.message).toEqual("Mock error");
      });

      expect(handleError).toHaveBeenCalledWith(new Error("Mock error"), expect.any(String));
    });
  });
});
