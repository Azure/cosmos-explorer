import { DefaultButton, IconButton } from "@fluentui/react";
import { mount, shallow } from "enzyme";
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
    const wrapper = mount(<SamplePrompts sampleProps={sampleProps} />);

    wrapper.find(DefaultButton).at(0).simulate("click");
    expect(setTextBoxMock).toHaveBeenCalledWith("Show me products less than 100 dolars");
    expect(setIsSamplePromptsOpenMock).toHaveBeenCalledWith(false);

    wrapper.find(DefaultButton).at(3).simulate("click");
    expect(setTextBoxMock).toHaveBeenCalledWith(
      "Write a query to return all records in this table created in the last thirty days"
    );
    expect(setIsSamplePromptsOpenMock).toHaveBeenCalledWith(false);
  });

  it("should call setIsSamplePromptsOpen(false) when the close button is clicked", () => {
    const wrapper = mount(<SamplePrompts sampleProps={sampleProps} />);

    wrapper.find(IconButton).simulate("click");

    expect(setIsSamplePromptsOpenMock).toHaveBeenCalledWith(false);
  });
});
