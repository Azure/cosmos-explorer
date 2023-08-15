import { shallow } from "enzyme";
import React from "react";
import { SampleBubble } from "./SampleBubble";

describe("Sample Bubble snapshot test", () => {
  it("should render ", () => {
    const wrapper = shallow(<SampleBubble />);
    expect(wrapper).toMatchSnapshot();
  });
});
