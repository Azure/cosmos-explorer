import { shallow } from "enzyme";
import { QueryCopilotState, useQueryCopilotState } from "hooks/useQueryCopilotState";
import React from "react";
import Explorer from "../Explorer";
import { QueryCopilotTab } from "./QueryCopilotTab";

jest.mock("hooks/useQueryCopilotState");

describe("Query copilot tab snapshot test", () => {
  it("should render with initial input", () => {
    const mockQueryCopilotState: QueryCopilotState = {
      hideFeedbackModalForLikedQueries: false,
      userPrompt: "",
      setUserPrompt: jest.fn(),
      generatedQuery: "",
      setGeneratedQuery: jest.fn(),
      query: "",
      setQuery: jest.fn(),
      selectedQuery: "",
      setSelectedQuery: jest.fn(),
      isGeneratingQuery: false,
      setIsGeneratingQuery: jest.fn(),
      isExecuting: false,
      setIsExecuting: jest.fn(),
      likeQuery: false,
      setLikeQuery: jest.fn(),
      dislikeQuery: false,
      setDislikeQuery: jest.fn(),
      showCallout: false,
      setShowCallout: jest.fn(),
      showSamplePrompts: false,
      setShowSamplePrompts: jest.fn(),
      queryIterator: undefined,
      setQueryIterator: jest.fn(),
      queryResults: undefined,
      setQueryResults: jest.fn(),
      errorMessage: "",
      setErrorMessage: jest.fn(),
      inputEdited: false,
      isSamplePromptsOpen: false,
      setIsSamplePromptsOpen: jest.fn(),
      showDeletePopup: false,
      setShowDeletePopup: jest.fn(),
      showFeedbackBar: false,
      setShowFeedbackBar: jest.fn(),
      showCopyPopup: false,
      setshowCopyPopup: jest.fn(),
      showErrorMessageBar: false,
      setShowErrorMessageBar: jest.fn(),
      generatedQueryComments: "",
      setGeneratedQueryComments: jest.fn(),
      resetQueryCopilotStates: jest.fn(),
    };

    (useQueryCopilotState as jest.Mock).mockReturnValue(mockQueryCopilotState);

    const wrapper = shallow(<QueryCopilotTab queryCopilotState={mockQueryCopilotState} explorer={new Explorer()} />);
    expect(wrapper).toMatchSnapshot();
  });
});
