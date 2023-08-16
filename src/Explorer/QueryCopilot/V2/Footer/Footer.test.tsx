import { shallow } from "enzyme";
import React from "react";
import { Footer } from "./Footer";

describe("Footer snapshot test", () => {
  it("should render ", () => {
    const wrapper = shallow(<Footer />);
    expect(wrapper).toMatchSnapshot();
  });
});
