import { shallow } from "enzyme";
import React from "react";
import { ThroughputInputComponent, ThroughputInputProps } from "./ThroughputInputComponent";
import { AutopilotTier } from "../../../../../Contracts/DataModels";

describe("ThroughputInputReactComponent", () => {
  const baseProps: ThroughputInputProps = {
    throughput: 100,
    throughputBaseline: 100,
    setThroughput: undefined,
    minimum: 10000,
    maximum: 400,
    step: 100,
    isEnabled: true,
    costsVisible: true,
    requestUnitsUsageCost: undefined,
    spendAckChecked: false,
    spendAckId: "spendAckId",
    spendAckText: "spendAckText",
    spendAckVisible: false,
    showAsMandatory: true,
    isFixed: true,
    label: "label",
    infoBubbleText: "infoBubbleText",
    canExceedMaximumValue: true,
    cssClass: "dirty",
    setAutoPilotSelected: undefined,
    isAutoPilotSelected: false,
    autoPilotTiersList: [
      { value: AutopilotTier.Tier1, text: "tier 1" },
      { value: AutopilotTier.Tier2, text: "tier 2" }
    ],
    selectedAutoPilotTier: AutopilotTier.Tier1,
    setAutoPilotTier: undefined,
    autoPilotUsageCost: undefined,
    showAutoPilot: true
  };

  it("throughput input visible", () => {
    const wrapper = shallow(<ThroughputInputComponent {...baseProps} />);
    expect(wrapper).toMatchSnapshot();
    expect(wrapper.exists("#throughputInput")).toEqual(true);
    expect(wrapper.exists("#autopilotSelector")).toEqual(false);
    expect(wrapper.exists("#spendAckCheckBox")).toEqual(false);
  });

  it("autopilot input visible", () => {
    const newProps = { ...baseProps, isAutoPilotSelected: true };
    const wrapper = shallow(<ThroughputInputComponent {...newProps} />);
    expect(wrapper).toMatchSnapshot();
    expect(wrapper.exists("#autopilotSelector")).toEqual(true);
    expect(wrapper.exists("#throughputInput")).toEqual(false);
    expect(wrapper.exists("#spendAckCheckBox")).toEqual(false);
  });

  it("spendAck checkbox visible", () => {
    const newProps = { ...baseProps, spendAckVisible: true };
    const wrapper = shallow(<ThroughputInputComponent {...newProps} />);
    expect(wrapper).toMatchSnapshot();
    expect(wrapper.exists("#spendAckCheckBox")).toEqual(true);
  });
});
