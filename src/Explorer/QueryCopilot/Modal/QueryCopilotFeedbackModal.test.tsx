import { Checkbox, DefaultButton, IconButton, PrimaryButton, TextField } from "@fluentui/react";
import Explorer from "Explorer/Explorer";
import { QueryCopilotFeedbackModal } from "Explorer/QueryCopilot/Modal/QueryCopilotFeedbackModal";
import { useCopilotStore } from "Explorer/QueryCopilot/QueryCopilotContext";
import { SubmitFeedback } from "Explorer/QueryCopilot/Shared/QueryCopilotClient";
import { getUserEmail } from "Utils/UserUtils";
import { shallow } from "enzyme";
import React from "react";

jest.mock("Utils/UserUtils");
(getUserEmail as jest.Mock).mockResolvedValue("test@email.com");

jest.mock("Explorer/QueryCopilot/Shared/QueryCopilotClient");
SubmitFeedback as jest.Mock;

jest.mock("Explorer/QueryCopilot/QueryCopilotContext");
const mockUseCopilotStore = useCopilotStore as jest.Mock;
const mockReturnValue = {
  generatedQuery: "test query",
  userPrompt: "test prompt",
  likeQuery: false,
  showFeedbackModal: false,
  closeFeedbackModal: jest.fn,
  setHideFeedbackModalForLikedQueries: jest.fn,
};

describe("Query Copilot Feedback Modal snapshot test", () => {
  beforeEach(() => {
    mockUseCopilotStore.mockReturnValue(mockReturnValue);
    jest.clearAllMocks();
  });
  it("shoud render and match snapshot", () => {
    mockUseCopilotStore.mockReturnValue({
      ...mockReturnValue,
      showFeedbackModal: true,
    });
    const wrapper = shallow(
      <QueryCopilotFeedbackModal
        explorer={new Explorer()}
        databaseId="CopilotUserDb"
        containerId="CopilotUserContainer"
        mode="User"
      />,
    );

    expect(wrapper.props().isOpen).toBeTruthy();
    expect(wrapper).toMatchSnapshot();
  });

  it("should close on cancel click", () => {
    const wrapper = shallow(
      <QueryCopilotFeedbackModal
        explorer={new Explorer()}
        databaseId="CopilotUserDb"
        containerId="CopilotUserContainer"
        mode="User"
      />,
    );

    const cancelButton = wrapper.find(IconButton);
    cancelButton.simulate("click");
    wrapper.setProps({});

    expect(wrapper.props().isOpen).toBeFalsy();
    expect(wrapper).toMatchSnapshot();
  });

  it("should get user unput", () => {
    const wrapper = shallow(
      <QueryCopilotFeedbackModal
        explorer={new Explorer()}
        databaseId="CopilotUserDb"
        containerId="CopilotUserContainer"
        mode="User"
      />,
    );
    const testUserInput = "test user input";

    const userInput = wrapper.find(TextField).first();
    userInput.simulate("change", {}, testUserInput);

    expect(wrapper.find(TextField).first().props().value).toEqual(testUserInput);
    expect(wrapper).toMatchSnapshot();
  });

  it("should not render dont show again button", () => {
    const wrapper = shallow(
      <QueryCopilotFeedbackModal
        explorer={new Explorer()}
        databaseId="CopilotUserDb"
        containerId="CopilotUserContainer"
        mode="User"
      />,
    );

    const dontShowAgain = wrapper.find(Checkbox);

    expect(dontShowAgain).toHaveLength(0);
    expect(wrapper).toMatchSnapshot();
  });

  it("should render dont show again button and check it ", () => {
    mockUseCopilotStore.mockReturnValue({
      ...mockReturnValue,
      showFeedbackModal: true,
      likeQuery: true,
    });
    const wrapper = shallow(
      <QueryCopilotFeedbackModal
        explorer={new Explorer()}
        databaseId="CopilotUserDb"
        containerId="CopilotUserContainer"
        mode="User"
      />,
    );

    const dontShowAgain = wrapper.find(Checkbox);
    dontShowAgain.simulate("change", {}, true);

    expect(wrapper.find(Checkbox)).toHaveLength(1);
    expect(wrapper.find(Checkbox).first().props().checked).toBeTruthy();
    expect(wrapper).toMatchSnapshot();
  });

  it("should cancel submission", () => {
    const wrapper = shallow(
      <QueryCopilotFeedbackModal
        explorer={new Explorer()}
        databaseId="CopilotUserDb"
        containerId="CopilotUserContainer"
        mode="User"
      />,
    );

    const cancelButton = wrapper.find(DefaultButton);
    cancelButton.simulate("click");
    wrapper.setProps({});

    expect(wrapper.props().isOpen).toBeFalsy();
    expect(wrapper).toMatchSnapshot();
  });

  it("should not submit submission if required description field is null", () => {
    const explorer = new Explorer();
    const wrapper = shallow(
      <QueryCopilotFeedbackModal
        explorer={explorer}
        databaseId="CopilotUserDb"
        containerId="CopilotUserContainer"
        mode="User"
      />,
    );

    const submitButton = wrapper.find(PrimaryButton);
    submitButton.simulate("click");
    wrapper.setProps({});

    expect(SubmitFeedback).toHaveBeenCalledTimes(0);
  });

  it("should submit submission", () => {
    const explorer = new Explorer();
    const wrapper = shallow(
      <QueryCopilotFeedbackModal
        explorer={explorer}
        databaseId="CopilotUserDb"
        containerId="CopilotUserContainer"
        mode="User"
      />,
    );

    const submitButton = wrapper.find("form");
    submitButton.simulate("submit");
    wrapper.setProps({});

    expect(SubmitFeedback).toHaveBeenCalledTimes(1);
    expect(SubmitFeedback).toHaveBeenCalledWith({
      containerId: "CopilotUserContainer",
      databaseId: "CopilotUserDb",
      mode: "User",
      params: {
        likeQuery: false,
        generatedQuery: "test query",
        userPrompt: "test prompt",
        description: "",
      },
      explorer: explorer,
    });
    expect(wrapper.props().isOpen).toBeFalsy();
    expect(wrapper).toMatchSnapshot();
  });
});
