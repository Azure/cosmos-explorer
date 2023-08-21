import { IconButton, Image, TextField } from "@fluentui/react";
import Explorer from "Explorer/Explorer";
import { CopilotMessage } from "Explorer/QueryCopilot/Shared/QueryCopilotInterfaces";
import { shallow } from "enzyme";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import React from "react";
import { Footer } from "./Footer";

jest.mock("@azure/cosmos", () => ({
  Constants: {
    HttpHeaders: {},
  },
}));

jest.mock("Common/SampleDataClient");

jest.mock("Explorer/Explorer");

jest.mock("node-fetch");

jest.mock("Common/ErrorHandlingUtils", () => ({
  handleError: jest.fn(),
  getErrorMessage: jest.fn(),
}));

const mockResponseData = {
  apiVersion: "1.0",
  sql: "SELECT * FROM mock_table",
  explanation: "Mock explanation",
  generateStart: "2023-08-21T00:00:00Z",
  generateEnd: "2023-08-21T01:00:00Z",
};

const mockFetch = jest.fn().mockResolvedValueOnce({
  json: () => Promise.resolve(mockResponseData),
  status: 200,
  ok: true,
  headers: {
    "content-type": "application/json",
  },
});

globalThis.fetch = mockFetch;

jest.mock("Explorer/QueryCopilot/Shared/QueryCopilotClient", () => ({
  SendQueryRequest: async () => {
    return mockFetch();
  },
}));

describe("Footer snapshot test", () => {
  const testMessage = "test message";

  const mockResponse: CopilotMessage = {
    message: testMessage,
    source: 0,
  };

  const initialStoreState = useQueryCopilot.getState();
  beforeEach(() => {
    useQueryCopilot.setState(initialStoreState, true);
  });

  it("should open sample prompts on button click", () => {
    const wrapper = shallow(<Footer explorer={new Explorer()} />);

    const samplePromptsImage = wrapper.find(Image).first();
    samplePromptsImage.simulate("click", {});

    expect(useQueryCopilot.getState().isSamplePromptsOpen).toBeTruthy();
    expect(wrapper).toMatchSnapshot();
  });

  it("should update user input", () => {
    const wrapper = shallow(<Footer explorer={new Explorer()} />);
    const newInput = "some new input";

    const textInput = wrapper.find(TextField).first();
    textInput.simulate("change", {}, newInput);

    expect(useQueryCopilot.getState().userPrompt).toEqual(newInput);
    expect(wrapper).toMatchSnapshot();
  });

  it("should pass text with enter key", () => {
    useQueryCopilot.getState().setUserPrompt(testMessage);
    const wrapper = shallow(<Footer explorer={new Explorer()} />);

    const textInput = wrapper.find(TextField).first();
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    textInput.simulate("keydown", { key: "Enter", shiftKey: false, preventDefault: () => {} });

    expect(useQueryCopilot.getState().chatMessages).toEqual([mockResponse]);
    expect(useQueryCopilot.getState().userPrompt).toEqual(testMessage);
    expect(wrapper).toMatchSnapshot();
  });

  it("should not pass text with non enter key", () => {
    const wrapper = shallow(<Footer explorer={new Explorer()} />);

    const textInput = wrapper.find(TextField).first();
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    textInput.simulate("keydown", { key: "K", shiftKey: false, preventDefault: () => {} });

    expect(useQueryCopilot.getState().chatMessages).toEqual([]);
    expect(useQueryCopilot.getState().userPrompt).toEqual("");
    expect(wrapper).toMatchSnapshot();
  });

  it("should not pass if no text", () => {
    const wrapper = shallow(<Footer explorer={new Explorer()} />);

    const textInput = wrapper.find(TextField).first();
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    textInput.simulate("keydown", { key: "Enter", shiftKey: false, preventDefault: () => {} });

    expect(useQueryCopilot.getState().chatMessages).toEqual([]);
    expect(useQueryCopilot.getState().userPrompt).toEqual("");
    expect(wrapper).toMatchSnapshot();
  });

  it("should pass text with icon button", () => {
    useQueryCopilot.getState().setUserPrompt(testMessage);
    const wrapper = shallow(<Footer explorer={new Explorer()} />);

    const iconButton = wrapper.find(IconButton).first();
    iconButton.simulate("click", {});

    expect(useQueryCopilot.getState().chatMessages).toEqual([mockResponse]);
    expect(useQueryCopilot.getState().userPrompt).toEqual("test message");
    expect(wrapper).toMatchSnapshot();
  });
});
