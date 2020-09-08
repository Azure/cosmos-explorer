import { shallow } from "enzyme";
import React from "react";
import {
  ThroughputInputAutoPilotV3Component,
  ThroughputInputAutoPilotV3Props
} from "./ThroughputInputAutoPilotV3Component";
import { StatefulValue } from "../../../StatefulValue/StatefulValue";

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
    const newProps = { ...baseProps, isAutoPilotSelected: true };
    const wrapper = shallow(<ThroughputInputAutoPilotV3Component {...newProps} />);
    expect(wrapper).toMatchSnapshot();
    expect(wrapper.exists("#autopilotInput")).toEqual(true);
    expect(wrapper.exists("#throughputInput")).toEqual(false);
  });

  it("spendAck checkbox visible", () => {
    const newProps = { ...baseProps, spendAckVisible: true };
    const wrapper = shallow(<ThroughputInputAutoPilotV3Component {...newProps} />);
    expect(wrapper).toMatchSnapshot();
    expect(wrapper.exists("#spendAckCheckBox")).toEqual(true);
  });
});
