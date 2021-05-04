import { shallow } from "enzyme";
import React from "react";
import { CostEstimateText } from "./CostEstimateText";
const props = {
  requestUnits: 5,
  isAutoscale: false,
};
describe("CostEstimateText Pane", () => {
  it("should render Default properly", () => {
    const wrapper = shallow(<CostEstimateText {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
