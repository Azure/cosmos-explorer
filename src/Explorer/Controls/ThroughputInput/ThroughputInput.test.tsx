import { mount, ReactWrapper } from "enzyme";
import React from "react";
import { ThroughputInput } from "./ThroughputInput";
const props = {
  isDatabase: false,
  showFreeTierExceedThroughputTooltip: true,
  isSharded: true,
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

  it("should switch mode properly", () => {
    wrapper.find(".ms-ChoiceField-input").at(0).simulate("change");
    expect(wrapper.find("#throughPut").at(0).text()).toBe("Container throughput (autoscale)");

    wrapper.find(".ms-ChoiceField-input").at(1).simulate("change");
    expect(wrapper.find("#throughPut").at(0).text()).toBe("Container throughput (400 - unlimited RU/s)");
  });
});
