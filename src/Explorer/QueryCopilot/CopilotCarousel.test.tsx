import { shallow } from "enzyme";
import React from "react";
import Explorer from "../Explorer";
import { QueryCopilotCarousel } from "./CopilotCarousel";

describe("Query Copilot Carousel snapshot test", () => {
  it("should render when isOpen is true", () => {
    const wrapper = shallow(<QueryCopilotCarousel isOpen={true} explorer={new Explorer()} />);
    expect(wrapper).toMatchSnapshot();
  });
});
