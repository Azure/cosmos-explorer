import { QueryCopilotSampleContainerSchema, ShortenedQueryCopilotSampleContainerSchema } from "Common/Constants";
import { handleError } from "Common/ErrorHandlingUtils";
import { createUri } from "Common/UrlUtility";
import Explorer from "Explorer/Explorer";
import { SubmitFeedback } from "Explorer/QueryCopilot/Shared/QueryCopilotClient";
import { userContext } from "UserContext";
import { useQueryCopilot } from "hooks/useQueryCopilot";

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

describe("Query Copilot Client", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("SubmitFeedback", () => {
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

    const mockStore = useQueryCopilot.getState();
    mockStore.correlationId = "mocked-correlation-id";
    mockStore.notebookServerInfo = {
      notebookServerEndpoint: "mocked-endpoint",
      authToken: "mocked-token",
      forwardingId: "mocked-forwarding-id",
    };

    const feedbackUri = userContext.features.enableCopilotPhoenixGateaway
      ? createUri(useQueryCopilot.getState().notebookServerInfo.notebookServerEndpoint, "feedback")
      : createUri("https://copilotorchestrater.azurewebsites.net/", "feedback");

    it("should call fetch with the payload with like", async () => {
      const mockFetch = jest.fn().mockResolvedValueOnce({});

      globalThis.fetch = mockFetch;
      await SubmitFeedback({
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

      await SubmitFeedback({
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

      await SubmitFeedback({
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
