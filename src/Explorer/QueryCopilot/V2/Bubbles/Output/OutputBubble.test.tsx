import { EditorReact } from "Explorer/Controls/Editor/EditorReact";
import { OutputBubble } from "Explorer/QueryCopilot/V2/Bubbles/Output/OutputBubble";
import { shallow } from "enzyme";
import { withHooks } from "jest-react-hooks-shallow";
import React from "react";

describe("Output Bubble snapshot tests", () => {
  it("should render and update height", () => {
    withHooks(() => {
      const wrapper = shallow(
        <OutputBubble
          copilotMessage={{ message: "testMessage", source: 1, explanation: "testExplanation", sqlQuery: "testSQL" }}
        />
      );

      const editor = wrapper.find(EditorReact).first();

      expect(editor.props().monacoContainerStyles).not.toHaveProperty("height", undefined);
      expect(wrapper).toMatchSnapshot();
    });
  });
});
