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

  it("should switch mode properly", () => {
    wrapper.find('[aria-label="Manual mode"]').simulate("change");
    expect(wrapper.find('[aria-label="Throughput header"]').at(0).text()).toBe(
      "Container throughput (400 - unlimited RU/s)"
    );

    wrapper.find('[aria-label="Autoscale mode"]').simulate("change");
    expect(wrapper.find('[aria-label="Throughput header"]').at(0).text()).toBe("Container throughput (autoscale)");
  });
});
