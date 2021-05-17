import { mount, ReactWrapper } from "enzyme";
import React from "react";
import { ThroughputInput } from "./ThroughputInput";
const props = {
  isDatabase: false,
  showFreeTierExceedThroughputTooltip: true,
  isSharded: false,
  setThroughputValue: () => jest.fn(),
  setIsAutoscale: () => jest.fn(),
  onCostAcknowledgeChange: () => jest.fn(),
};
describe("ThroughputInput Pane", () => {
  let wrapper: ReactWrapper;

  beforeEach(() => {
    wrapper = mount(<ThroughputInput {...props} />);
  });

  it("should render Default properly", () => {
    expect(wrapper).toMatchSnapshot();
  });
});
