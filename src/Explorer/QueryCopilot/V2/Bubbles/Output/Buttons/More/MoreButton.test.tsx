import { MoreButton } from "Explorer/QueryCopilot/V2/Bubbles/Output/Buttons/More/MoreButton";
import { shallow } from "enzyme";
import React from "react";

describe("More button snapshot tests", () => {
  it("should render", () => {
    const wrapper = shallow(<MoreButton />);

    expect(wrapper).toMatchSnapshot();
  });
});
