import { shallow } from "enzyme";
import React from "react";
import { InfoComponent } from "./InfoComponent";

describe("InfoComponent", () => {
  it("renders", () => {
    const wrapper = shallow(<InfoComponent />);
    expect(wrapper).toMatchSnapshot();
  });
});
