import { CopilotMessage } from "Explorer/QueryCopilot/Shared/QueryCopilotInterfaces";
import { ExplanationBubble } from "Explorer/QueryCopilot/V2/Bubbles/Explanation/ExplainationBubble";
import { shallow } from "enzyme";
import React from "react";

describe("Explanation Bubble snapshot tests", () => {
  it("should render", () => {
    const mockCopilotMessage: CopilotMessage = {
      source: 2,
      message: "Mock message",
    };

    const wrapper = shallow(<ExplanationBubble copilotMessage={mockCopilotMessage} />);

    expect(wrapper).toMatchSnapshot();
  });
});
