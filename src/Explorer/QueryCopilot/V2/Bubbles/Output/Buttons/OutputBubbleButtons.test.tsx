import { OutputBubbleButtons } from "Explorer/QueryCopilot/V2/Bubbles/Output/Buttons/OutputBubbleButtons";
import { shallow } from "enzyme";
import React from "react";

describe("Output Bubble Buttons snapshot tests", () => {
  it("should render", () => {
    const wrapper = shallow(<OutputBubbleButtons sqlQuery={""} />);

    expect(wrapper).toMatchSnapshot();
  });
});
