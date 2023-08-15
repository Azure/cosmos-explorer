import { shallow } from "enzyme";
import React from "react";
import { Header } from "./Header";

describe("Header snapshot test", () => {
  it("should render ", () => {
    const wrapper = shallow(<Header />);
    expect(wrapper).toMatchSnapshot();
  });
});
