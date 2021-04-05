import { shallow, ShallowWrapper } from "enzyme";
import React from "react";
import { ThroughputInput } from ".";
const props = {
  isDatabase: false,
  showFreeTierExceedThroughputTooltip: true,
  setThroughputValue: () => jest.fn(),
  setIsAutoscale: () => jest.fn(),
  onCostAcknowledgeChange: () => jest.fn(),
};
describe("ThroughputInput Pane", () => {
  let wrapper: ShallowWrapper;
  beforeEach(() => {
    wrapper = shallow(<ThroughputInput {...props} />);
  });
  it("should render Default properly", () => {
    expect(wrapper).toMatchSnapshot();
  });
});
