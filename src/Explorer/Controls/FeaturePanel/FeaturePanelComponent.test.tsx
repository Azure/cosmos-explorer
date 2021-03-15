import { shallow } from "enzyme";
import React from "react";
import { FeaturePanelComponent } from "./FeaturePanelComponent";

describe("Feature panel", () => {
  it("renders all flags", () => {
    const wrapper = shallow(<FeaturePanelComponent />);
    expect(wrapper).toMatchSnapshot();
  });
});
