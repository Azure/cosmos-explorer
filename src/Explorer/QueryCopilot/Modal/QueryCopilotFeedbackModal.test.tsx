import { Checkbox, ChoiceGroup, DefaultButton, IconButton, PrimaryButton, TextField } from "@fluentui/react";
import { QueryCopilotFeedbackModal } from "Explorer/QueryCopilot/Modal/QueryCopilotFeedbackModal";
import { submitFeedback } from "Explorer/QueryCopilot/QueryCopilotUtilities";
import { getUserEmail } from "Utils/UserUtils";
import { shallow } from "enzyme";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import React from "react";

jest.mock("Utils/UserUtils");
(getUserEmail as jest.Mock).mockResolvedValue("test@email.com");

jest.mock("Explorer/QueryCopilot/QueryCopilotUtilities");
submitFeedback as jest.Mock;

describe("Query Copilot Feedback Modal snapshot test", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("shoud render and match snapshot", () => {
    useQueryCopilot.getState().openFeedbackModal("test query", false, "test prompt");

    const wrapper = shallow(<QueryCopilotFeedbackModal />);

    expect(wrapper.props().isOpen).toBeTruthy();
    expect(wrapper).toMatchSnapshot();
  });

  it("should close on cancel click", () => {
    const wrapper = shallow(<QueryCopilotFeedbackModal />);

    const cancelButton = wrapper.find(IconButton);
    cancelButton.simulate("click");
    wrapper.setProps({});

    expect(wrapper.props().isOpen).toBeFalsy();
    expect(wrapper).toMatchSnapshot();
  });

  it("should get user unput", () => {
    const wrapper = shallow(<QueryCopilotFeedbackModal />);
    const testUserInput = "test user input";

    const userInput = wrapper.find(TextField).first();
    userInput.simulate("change", {}, testUserInput);

    expect(wrapper.find(TextField).first().props().value).toEqual(testUserInput);
    expect(wrapper).toMatchSnapshot();
  });

  it("should record user contact choice no", () => {
    const wrapper = shallow(<QueryCopilotFeedbackModal />);
    const contactAllowed = wrapper.find(ChoiceGroup);

    contactAllowed.simulate("change", {}, { key: "no" });

    expect(getUserEmail).toHaveBeenCalledTimes(3);
    expect(wrapper.find(ChoiceGroup).props().selectedKey).toEqual("no");
    expect(wrapper).toMatchSnapshot();
  });

  it("should record user contact choice yes", () => {
    const wrapper = shallow(<QueryCopilotFeedbackModal />);
    const contactAllowed = wrapper.find(ChoiceGroup);

    contactAllowed.simulate("change", {}, { key: "yes" });

    expect(getUserEmail).toHaveBeenCalledTimes(4);
    expect(wrapper.find(ChoiceGroup).props().selectedKey).toEqual("yes");
    expect(wrapper).toMatchSnapshot();
  });

  it("should not render dont show again button", () => {
    const wrapper = shallow(<QueryCopilotFeedbackModal />);

    const dontShowAgain = wrapper.find(Checkbox);

    expect(dontShowAgain).toHaveLength(0);
    expect(wrapper).toMatchSnapshot();
  });

  it("should render dont show again button and check it ", () => {
    useQueryCopilot.getState().openFeedbackModal("test query", true, "test prompt");
    const wrapper = shallow(<QueryCopilotFeedbackModal />);

    const dontShowAgain = wrapper.find(Checkbox);
    dontShowAgain.simulate("change", {}, true);

    expect(wrapper.find(Checkbox)).toHaveLength(1);
    expect(wrapper.find(Checkbox).first().props().checked).toBeTruthy();
    expect(wrapper).toMatchSnapshot();
  });

  it("should cancel submission", () => {
    const wrapper = shallow(<QueryCopilotFeedbackModal />);

    const cancelButton = wrapper.find(DefaultButton);
    cancelButton.simulate("click");
    wrapper.setProps({});

    expect(wrapper.props().isOpen).toBeFalsy();
    expect(wrapper).toMatchSnapshot();
  });

  it("should submit submission", () => {
    const wrapper = shallow(<QueryCopilotFeedbackModal />);

    const submitButton = wrapper.find(PrimaryButton);
    submitButton.simulate("click");
    wrapper.setProps({});

    expect(submitFeedback).toHaveBeenCalledTimes(1);
    expect(submitFeedback).toHaveBeenCalledWith({
      likeQuery: false,
      generatedQuery: "",
      userPrompt: "",
      description: "",
      contact: getUserEmail(),
    });
    expect(wrapper.props().isOpen).toBeFalsy();
    expect(wrapper).toMatchSnapshot();
  });
});
