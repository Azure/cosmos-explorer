import { shallow } from "enzyme";
import React from "react";
import Explorer from "../Explorer";
import { QueryCopilotTab } from "./QueryCopilotTab";

describe("Query copilot tab snapshot test", () => {
  it("should render with initial input", () => {
    const wrapper = shallow(<QueryCopilotTab explorer={new Explorer()} />);
    expect(wrapper).toMatchSnapshot();
  });
});
