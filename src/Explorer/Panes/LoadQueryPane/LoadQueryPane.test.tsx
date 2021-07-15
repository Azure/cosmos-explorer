import { shallow } from "enzyme";
import React from "react";
import { LoadQueryPane } from "./LoadQueryPane";

describe("Load Query Pane", () => {
  it("should render Default properly", () => {
    const wrapper = shallow(<LoadQueryPane />);
    expect(wrapper).toMatchSnapshot();
  });
});
