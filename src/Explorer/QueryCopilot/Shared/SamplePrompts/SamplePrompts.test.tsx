import { DefaultButton, IconButton } from "@fluentui/react";
import { shallow } from "enzyme";
import React from "react";
import { SamplePrompts, SamplePromptsProps } from "./SamplePrompts";

describe("Sample Prompts snapshot test", () => {
  const setTextBoxMock = jest.fn();
  const setIsSamplePromptsOpenMock = jest.fn();
  const sampleProps: SamplePromptsProps = {
    isSamplePromptsOpen: true,
    setIsSamplePromptsOpen: setIsSamplePromptsOpenMock,
    setTextBox: setTextBoxMock,
  };
  beforeEach(() => jest.clearAllMocks());

  it("should render properly if isSamplePromptsOpen is true", () => {
    const wrapper = shallow(<SamplePrompts sampleProps={sampleProps} />);

    expect(wrapper).toMatchSnapshot();
  });

  it("should render properly if isSamplePromptsOpen is false", () => {
    sampleProps.isSamplePromptsOpen = false;

    const wrapper = shallow(<SamplePrompts sampleProps={sampleProps} />);

    expect(wrapper).toMatchSnapshot();
  });

  it("should call setTextBox and setIsSamplePromptsOpen(false) when a button is clicked", () => {
    const wrapper = shallow(<SamplePrompts sampleProps={sampleProps} />);

    wrapper.find(DefaultButton).at(0).simulate("click");
    expect(setTextBoxMock).toHaveBeenCalledWith("Show me products less than 100 dolars");
    expect(setIsSamplePromptsOpenMock).toHaveBeenCalledWith(false);

    wrapper.find(DefaultButton).at(3).simulate("click");
    expect(setTextBoxMock).toHaveBeenCalledWith(
      "Write a query to return all records in this table created in the last thirty days",
    );
    expect(setIsSamplePromptsOpenMock).toHaveBeenCalledWith(false);
  });

  it("should call setIsSamplePromptsOpen(false) when the close button is clicked", () => {
    const wrapper = shallow(<SamplePrompts sampleProps={sampleProps} />);

    wrapper.find(IconButton).first().simulate("click");

    expect(setIsSamplePromptsOpenMock).toHaveBeenCalledWith(false);
  });

  it("should call setTextBox and setIsSamplePromptsOpen(false) when a simple prompt button is clicked", () => {
    const wrapper = shallow(<SamplePrompts sampleProps={sampleProps} />);

    wrapper.find(DefaultButton).at(0).simulate("click");
    expect(setTextBoxMock).toHaveBeenCalledWith("Show me products less than 100 dolars");
    expect(setIsSamplePromptsOpenMock).toHaveBeenCalledWith(false);

    wrapper.find(DefaultButton).at(1).simulate("click");
    expect(setTextBoxMock).toHaveBeenCalledWith("Show schema");
    expect(setIsSamplePromptsOpenMock).toHaveBeenCalledWith(false);
  });

  it("should call setTextBox and setIsSamplePromptsOpen(false) when an intermediate prompt button is clicked", () => {
    const wrapper = shallow(<SamplePrompts sampleProps={sampleProps} />);

    wrapper.find(DefaultButton).at(2).simulate("click");
    expect(setTextBoxMock).toHaveBeenCalledWith(
      "Show items with a description that contains a number between 0 and 99 inclusive.",
    );
    expect(setIsSamplePromptsOpenMock).toHaveBeenCalledWith(false);

    wrapper.find(DefaultButton).at(3).simulate("click");
    expect(setTextBoxMock).toHaveBeenCalledWith(
      "Write a query to return all records in this table created in the last thirty days",
    );
    expect(setIsSamplePromptsOpenMock).toHaveBeenCalledWith(false);
  });

  it("should call setTextBox and setIsSamplePromptsOpen(false) when a complex prompt button is clicked", () => {
    const wrapper = shallow(<SamplePrompts sampleProps={sampleProps} />);

    wrapper.find(DefaultButton).at(4).simulate("click");
    expect(setTextBoxMock).toHaveBeenCalledWith("Show all the products that customer Bob has reviewed.");
    expect(setIsSamplePromptsOpenMock).toHaveBeenCalledWith(false);

    wrapper.find(DefaultButton).at(5).simulate("click");
    expect(setTextBoxMock).toHaveBeenCalledWith("Which computers are more than 300 dollars and less than 400 dollars?");
    expect(setIsSamplePromptsOpenMock).toHaveBeenCalledWith(false);
  });
});
