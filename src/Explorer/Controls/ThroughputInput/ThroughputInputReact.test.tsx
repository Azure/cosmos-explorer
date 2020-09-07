import { shallow } from "enzyme";
import React from "react";
import { ThroughputInputComponent, ThroughputInputProps } from "./ThroughputInputReactComponent";
import {
  ThroughputInputAutoPilotV3Component,
  ThroughputInputAutoPilotV3Props
} from "./ThroughputInputReactComponentAutoPilotV3";
import { AutopilotTier } from "../../../Contracts/DataModels";
import { StatefulValue } from "../StatefulValue";

describe("ThroughputInputReactComponent", () => {
  const baseProps: ThroughputInputProps = {
    throughput: new StatefulValue(100),
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
    const newProps = { ...baseProps };
    newProps.isAutoPilotSelected = true;
    const wrapper = shallow(<ThroughputInputComponent {...newProps} />);
    expect(wrapper).toMatchSnapshot();
    expect(wrapper.exists("#autopilotSelector")).toEqual(true);
    expect(wrapper.exists("#throughputInput")).toEqual(false);
    expect(wrapper.exists("#spendAckCheckBox")).toEqual(false);
  });

  it("spendAck checkbox visible", () => {
    const newProps = { ...baseProps };
    newProps.spendAckVisible = true;
    const wrapper = shallow(<ThroughputInputComponent {...newProps} />);
    expect(wrapper).toMatchSnapshot();
    expect(wrapper.exists("#spendAckCheckBox")).toEqual(true);
  });
});

describe("ThroughputInputAutoPilotV3Component", () => {
  const baseProps: ThroughputInputAutoPilotV3Props = {
    throughput: new StatefulValue(100),
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
    setAutoPilotSelected: undefined,
    isAutoPilotSelected: false,
    autoPilotUsageCost: undefined,
    showAutoPilot: true,
    overrideWithAutoPilotSettings: true,
    overrideWithProvisionedThroughputSettings: false,
    maxAutoPilotThroughput: new StatefulValue(4000),
    setMaxAutoPilotThroughput: undefined
  };

  it("throughput input visible", () => {
    const wrapper = shallow(<ThroughputInputAutoPilotV3Component {...baseProps} />);
    expect(wrapper).toMatchSnapshot();
    expect(wrapper.exists("#throughputInput")).toEqual(true);
    expect(wrapper.exists("#autopilotInput")).toEqual(false);
  });

  it("autopilot input visible", () => {
    const newProps = { ...baseProps };
    newProps.isAutoPilotSelected = true;
    const wrapper = shallow(<ThroughputInputAutoPilotV3Component {...newProps} />);
    expect(wrapper).toMatchSnapshot();
    expect(wrapper.exists("#autopilotInput")).toEqual(true);
    expect(wrapper.exists("#throughputInput")).toEqual(false);
  });

  it("spendAck checkbox visible", () => {
    const newProps = { ...baseProps };
    newProps.spendAckVisible = true;
    const wrapper = shallow(<ThroughputInputAutoPilotV3Component {...newProps} />);
    expect(wrapper).toMatchSnapshot();
    expect(wrapper.exists("#spendAckCheckBox")).toEqual(true);
  });
});
