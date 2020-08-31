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
    testId: "testId",
    ariaLabel: "ariaLabel",
    minimum: 10000,
    maximum: 400,
    step: 100,
    isEnabled: true,
    costsVisible: true,
    requestUnitsUsageCost: undefined,
    spendAckChecked: true,
    spendAckId: "spendAckId",
    spendAckText: "spendAckText",
    spendAckVisible: true,
    showAsMandatory: true,
    isFixed: true,
    label: "label",
    infoBubbleText: "infoBubbleText",
    canExceedMaximumValue: true,
    cssClass: "dirty",
    setAutoPilotSelected: undefined,
    isAutoPilotSelected: false,
    throughputAutoPilotRadioId: "throughputAutoPilotRadioId",
    throughputProvisionedRadioId: "throughputProvisionedRadioId",
    throughputModeRadioName: "throughputModeRadioName",
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
  });

  it("autopilot input visible", () => {
    baseProps.isAutoPilotSelected = true;
    const wrapper = shallow(<ThroughputInputComponent {...baseProps} />);
    expect(wrapper).toMatchSnapshot();
    expect(wrapper.exists("#autopilotSelector")).toEqual(true);
    expect(wrapper.exists("#throughputInput")).toEqual(false);
  });
});

describe("ThroughputInputAutoPilotV3Component", () => {
  const baseProps: ThroughputInputAutoPilotV3Props = {
    throughput: new StatefulValue(100),
    setThroughput: undefined,
    testId: "testId",
    ariaLabel: "ariaLabel",
    minimum: 10000,
    maximum: 400,
    step: 100,
    isEnabled: true,
    costsVisible: true,
    requestUnitsUsageCost: undefined,
    spendAckChecked: true,
    spendAckId: "spendAckId",
    spendAckText: "spendAckText",
    spendAckVisible: true,
    showAsMandatory: true,
    isFixed: true,
    label: "label",
    infoBubbleText: "infoBubbleText",
    canExceedMaximumValue: true,
    cssClass: "dirty",
    setAutoPilotSelected: undefined,
    isAutoPilotSelected: false,
    throughputAutoPilotRadioId: "throughputAutoPilotRadioId",
    throughputProvisionedRadioId: "throughputProvisionedRadioId",
    throughputModeRadioName: "throughputModeRadioName",
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
    baseProps.isAutoPilotSelected = true;
    const wrapper = shallow(<ThroughputInputAutoPilotV3Component {...baseProps} />);
    expect(wrapper).toMatchSnapshot();
    expect(wrapper.exists("#autopilotInput")).toEqual(true);
    expect(wrapper.exists("#throughputInput")).toEqual(false);
  });
});
