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

  it("should render properly if isSamplePromptsOpen is true", () => {
    const wrapper = shallow(<SamplePrompts sampleProps={sampleProps} />);

    expect(wrapper).toMatchSnapshot();
  });

  it("should render properly if isSamplePromptsOpen is false", () => {
    sampleProps.isSamplePromptsOpen = false;

    const wrapper = shallow(<SamplePrompts sampleProps={sampleProps} />);

    expect(wrapper).toMatchSnapshot();
  });
});
