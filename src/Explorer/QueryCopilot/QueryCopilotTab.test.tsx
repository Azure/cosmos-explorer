import { shallow } from "enzyme";
import { useQueryCopilotState } from "hooks/useQueryCopilotState";
import React from "react";
import Explorer from "../Explorer";
import { QueryCopilotTab } from "./QueryCopilotTab";

describe("Query copilot tab snapshot test", () => {
  it("should render with initial input", () => {
    const queryCopilotState = useQueryCopilotState();
    const wrapper = shallow(<QueryCopilotTab queryCopilotState={queryCopilotState} explorer={new Explorer()} />);
    expect(wrapper).toMatchSnapshot();
  });
});
