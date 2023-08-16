import { shallow } from "enzyme";
import React from "react";
import { QueryCopilotSidebar } from "./QueryCopilotSidebar";

describe("QueryCopilotSidebar snapshot test", () => {
  it("should render ", () => {
    const wrapper = shallow(<QueryCopilotSidebar />);
    expect(wrapper).toMatchSnapshot();
  });
});
