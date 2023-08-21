import { Stack } from "@fluentui/react";
import Explorer from "Explorer/Explorer";
import { SampleBubble } from "Explorer/QueryCopilot/V2/Bubbles/Sample/SampleBubble";
import { shallow } from "enzyme";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import { withHooks } from "jest-react-hooks-shallow";
import React from "react";
import { QueryCopilotSidebar } from "./QueryCopilotSidebar";

describe("Query Copilot Sidebar snapshot test", () => {
  const initialState = useQueryCopilot.getState();

  beforeEach(() => {
    useQueryCopilot.setState(initialState, true);
  });

  it("should render and set copilot used flag ", () => {
    withHooks(() => {
      useQueryCopilot.getState().setShowCopilotSidebar(true);
      const wrapper = shallow(<QueryCopilotSidebar explorer={new Explorer()} />);

      expect(useQueryCopilot.getState().wasCopilotUsed).toBeTruthy();
      expect(wrapper).toMatchSnapshot();
    });
  });

  it("should render and not set copilot used flag ", () => {
    withHooks(() => {
      const wrapper = shallow(<QueryCopilotSidebar explorer={new Explorer()} />);

      expect(useQueryCopilot.getState().wasCopilotUsed).toBeFalsy();
      expect(wrapper).toMatchSnapshot();
    });
  });

  it("should render with chat messages", () => {
    const message = "some test message";
    useQueryCopilot.getState().setChatMessages([{ source: 0, message: message }]);
    const wrapper = shallow(<QueryCopilotSidebar explorer={new Explorer()} />);

    const messageContainer = wrapper.find(Stack).findWhere((x) => x.text() === message);

    expect(messageContainer).toBeDefined();
    expect(wrapper).toMatchSnapshot();
  });

  it("should render samples without messages", () => {
    const wrapper = shallow(<QueryCopilotSidebar explorer={new Explorer()} />);

    const sampleBubble = wrapper.find(SampleBubble);

    expect(sampleBubble).toBeDefined();
    expect(wrapper).toMatchSnapshot();
  });
});
