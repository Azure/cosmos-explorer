import { mount, ReactWrapper } from "enzyme";
import React from "react";
import { ThroughputInput } from "./ThroughputInput";
const props = {
  isDatabase: false,
  showFreeTierExceedThroughputTooltip: true,
  isAutoscaleSelected: true,
  throughput: 500,
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

  it("test Autoscale Mode select", () => {
    wrapper.setProps({ isAutoscaleSelected: true });
    expect(wrapper.find('[data-testid="ruDescription"]').at(0).text()).toContain(
      "Provision maximum RU/s required by this resource. Estimate your required RU/s with"
    );
    expect(wrapper.find('[data-testid="maxRUDescription"]').at(0).text()).toContain("Max RU/s");
  });

  it("test Manual Mode select", () => {
    wrapper.setProps({ isAutoscaleSelected: false });
    expect(wrapper.find('[data-testid="ruDescription"]').at(0).text()).toContain("Estimate your required RU/s with");
    expect(wrapper.find('[data-testid="capacityLink"]').at(0).text()).toContain("capacity calculator");
  });
});
