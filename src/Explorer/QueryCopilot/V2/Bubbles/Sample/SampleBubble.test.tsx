import { Text } from "@fluentui/react";
import { shallow } from "enzyme";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import React from "react";
import { SampleBubble } from "./SampleBubble";

describe("Sample Bubble snapshot test", () => {
  it("should render", () => {
    const wrapper = shallow(<SampleBubble />);

    const sampleInputs = wrapper.find(Text);

    expect(sampleInputs.length).toEqual(2);
    expect(useQueryCopilot.getState().userPrompt).toEqual("");
    expect(wrapper).toMatchSnapshot();
  });
  it("should render and be clicked", () => {
    const wrapper = shallow(<SampleBubble />);

    const firstSampleInput = wrapper.find(Text).first();
    firstSampleInput.simulate("click", {}, "");

    expect(useQueryCopilot.getState().userPrompt).toEqual(expect.any(String));
    expect(wrapper).toMatchSnapshot();
  });
});
