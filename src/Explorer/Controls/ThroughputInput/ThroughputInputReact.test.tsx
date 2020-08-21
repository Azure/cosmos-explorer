import { shallow } from "enzyme";
import React from "react";
import { ThroughputInputComponent, ThroughputInputProps } from "./ThroughputInputReactComponent";
import {
  ThroughputInputAutoPilotV3Component,
  ThroughputInputAutoPilotV3Props
} from "./ThroughputInputReactComponentAutoPilotV3";
import { AutopilotTier } from "../../../Contracts/DataModels";

describe("ThroughputInputReactComponent", () => {
  it("renders", () => {
    const props: ThroughputInputProps = {
      throughput: { baseline: 100, current: 100, isValid: true },
      setThroughput: undefined,
      testId: "testId",
      ariaLabel: "ariaLabel",
      minimum: 10000,
      maximum: 400,
      step: 100,
      isEnabled: true,
      costsVisible: true,
      requestUnitsUsageCost: "requestUnitsUsageCost",
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
      isAutoPilotSelected: true,
      throughputAutoPilotRadioId: "throughputAutoPilotRadioId",
      throughputProvisionedRadioId: "throughputProvisionedRadioId",
      throughputModeRadioName: "throughputModeRadioName",
      autoPilotTiersList: [
        { value: AutopilotTier.Tier1, text: "tier 1" },
        { value: AutopilotTier.Tier2, text: "tier 2" }
      ],
      selectedAutoPilotTier: AutopilotTier.Tier1,
      setAutoPilotTier: undefined,
      autoPilotUsageCost: "autoPilotUsageCost",
      showAutoPilot: true
    };

    const wrapper = shallow(<ThroughputInputComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});

describe("ThroughputInputAutoPilotV3Component", () => {
  it("renders", () => {
    const props: ThroughputInputAutoPilotV3Props = {
      throughput: { baseline: 100, current: 100, isValid: true },
      setThroughput: undefined,
      testId: "testId",
      ariaLabel: "ariaLabel",
      minimum: 10000,
      maximum: 400,
      step: 100,
      isEnabled: true,
      costsVisible: true,
      requestUnitsUsageCost: "requestUnitsUsageCost",
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
      isAutoPilotSelected: true,
      throughputAutoPilotRadioId: "throughputAutoPilotRadioId",
      throughputProvisionedRadioId: "throughputProvisionedRadioId",
      throughputModeRadioName: "throughputModeRadioName",
      autoPilotUsageCost: "autoPilotUsageCost",
      showAutoPilot: true,
      overrideWithAutoPilotSettings: true,
      overrideWithProvisionedThroughputSettings: false,
      maxAutoPilotThroughput: 4000,
      setMaxAutoPilotThroughput: undefined
    };

    const wrapper = shallow(<ThroughputInputAutoPilotV3Component {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
