import { shallow } from "enzyme";
import React from "react";
import { WelcomeBubble } from "./WelcomeBubble";

describe("Welcome Bubble snapshot test", () => {
  it("should render ", () => {
    const wrapper = shallow(<WelcomeBubble />);
    expect(wrapper).toMatchSnapshot();
  });
});
