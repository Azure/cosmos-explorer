import { DefaultButton } from "@fluentui/react";
import { shallow } from "enzyme";
import React from "react";
import { RetrievingBubble } from "./RetrievingBubble";

const mockUseQueryCopilot = {
  isGeneratingQuery: false,
  setIsGeneratingQuery: jest.fn(),
  isGeneratingExplanation: false,
  setIsGeneratingExplanation: jest.fn(),
  shouldIncludeInMessages: true,
  setShouldIncludeInMessages: jest.fn(),
};

jest.mock("hooks/useQueryCopilot", () => ({
  useQueryCopilot: jest.fn(() => mockUseQueryCopilot),
}));

describe("RetrievingBubble", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQueryCopilot.isGeneratingQuery = false;
    mockUseQueryCopilot.isGeneratingExplanation = false;
    mockUseQueryCopilot.setIsGeneratingQuery.mockClear();
    mockUseQueryCopilot.setIsGeneratingExplanation.mockClear();
    mockUseQueryCopilot.setShouldIncludeInMessages.mockClear();
  });

  it("should render properly when isGeneratingQuery is true", () => {
    mockUseQueryCopilot.isGeneratingQuery = true;
    const wrapper = shallow(<RetrievingBubble />);
    expect(wrapper).toMatchSnapshot();
  });

  it("should render properly when isGeneratingExplanation is true", () => {
    mockUseQueryCopilot.isGeneratingExplanation = true;
    const wrapper = shallow(<RetrievingBubble />);
    expect(wrapper).toMatchSnapshot();
  });

  it("when isGeneratingQuery is true clicking stop generating button invokes the correct callbacks", () => {
    mockUseQueryCopilot.isGeneratingQuery = true;

    const wrapper = shallow(<RetrievingBubble />);
    wrapper.find(DefaultButton).at(0).simulate("click");

    expect(mockUseQueryCopilot.setIsGeneratingQuery).toHaveBeenCalledWith(false);
    expect(mockUseQueryCopilot.setIsGeneratingExplanation).toHaveBeenCalledTimes(0);
    expect(mockUseQueryCopilot.setShouldIncludeInMessages).toHaveBeenCalledWith(false);
  });

  it("when isGeneratingExplanation is true clicking stop generating button invokes the correct callbacks", () => {
    mockUseQueryCopilot.isGeneratingExplanation = true;

    const wrapper = shallow(<RetrievingBubble />);
    wrapper.find(DefaultButton).at(0).simulate("click");

    expect(mockUseQueryCopilot.setIsGeneratingQuery).toHaveBeenCalledTimes(0);
    expect(mockUseQueryCopilot.setIsGeneratingExplanation).toHaveBeenCalledWith(false);
    expect(mockUseQueryCopilot.setShouldIncludeInMessages).toHaveBeenCalledWith(false);
  });
});
