import { shallow } from "enzyme";
import React from "react";
import { QueryCopilotSidebar } from "./QueryCopilotSidebar";

describe("Footer snapshot test", () => {
  it("should render ", () => {
    const wrapper = shallow(<QueryCopilotSidebar />);
    expect(wrapper).toMatchSnapshot();
  });
});
