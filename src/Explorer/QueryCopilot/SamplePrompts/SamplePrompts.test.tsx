import { shallow } from "enzyme";
import React from "react";
import { SamplePrompts, SamplePromptsProps } from "./SamplePrompts";

describe("Sample Prompts snapshot test", () => {
  it("should render properly if isSamplePromptsOpen is true", () => {
    const sampleProps: SamplePromptsProps = {
      isSamplePromptsOpen: true,
      setIsSamplePromptsOpen: () => undefined,
      setTextBox: () => undefined,
    };

    const wrapper = shallow(<SamplePrompts sampleProps={sampleProps} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("should render properly if isSamplePromptsOpen is false", () => {
    const sampleProps: SamplePromptsProps = {
      isSamplePromptsOpen: false,
      setIsSamplePromptsOpen: () => undefined,
      setTextBox: () => undefined,
    };
    const wrapper = shallow(<SamplePrompts sampleProps={sampleProps} />);
    expect(wrapper).toMatchSnapshot();
  });
});
