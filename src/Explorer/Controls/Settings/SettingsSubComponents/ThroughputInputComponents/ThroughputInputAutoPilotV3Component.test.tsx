import { shallow } from "enzyme";
import React from "react";
import * as DataModels from "../../../../../Contracts/DataModels";
import {
  ThroughputInputAutoPilotV3Component,
  ThroughputInputAutoPilotV3Props,
} from "./ThroughputInputAutoPilotV3Component";

describe("ThroughputInputAutoPilotV3Component", () => {
  const baseProps: ThroughputInputAutoPilotV3Props = {
    databaseAccount: {} as DataModels.DatabaseAccount,
    databaseName: "test",
    collectionName: "test",
    wasAutopilotOriginallySet: false,
    throughput: 100,
    throughputBaseline: 100,
    onThroughputChange: undefined,
    minimum: 10000,
    maximum: 400,
    step: 100,
    usageSizeInKB: 10000,
    isEnabled: true,
    isEmulator: false,
    spendAckChecked: false,
    spendAckId: "spendAckId",
    spendAckText: "spendAckText",
    spendAckVisible: false,
    showAsMandatory: true,
    isFixed: false,
    isFreeTierAccount: false,
    label: "label",
    infoBubbleText: "infoBubbleText",
    canExceedMaximumValue: true,
    onAutoPilotSelected: undefined,
    isAutoPilotSelected: false,
    maxAutoPilotThroughput: 4000,
    maxAutoPilotThroughputBaseline: 4000,
    onMaxAutoPilotThroughputChange: undefined,
    onScaleSaveableChange: () => {
      return;
    },
    onScaleDiscardableChange: () => {
      return;
    },
    instantMaximumThroughput: 5000,
    softAllowedMaximumThroughput: 1000000,
  };

  it("throughput input visible", () => {
    const wrapper = shallow(<ThroughputInputAutoPilotV3Component {...baseProps} />);
    const throughputComponent = wrapper.instance() as ThroughputInputAutoPilotV3Component;
    expect(throughputComponent.hasProvisioningTypeChanged()).toEqual(false);
    expect(throughputComponent.overrideWithProvisionedThroughputSettings()).toEqual(false);
    expect(throughputComponent.overrideWithAutoPilotSettings()).toEqual(false);

    expect(wrapper).toMatchSnapshot();
    expect(wrapper.exists("#throughputInput")).toEqual(true);
    expect(wrapper.exists("#autopilotInput")).toEqual(false);
    expect(wrapper.exists("#throughputSpendElement")).toEqual(true);
  });

  it("autopilot input visible", () => {
    const newProps = { ...baseProps, isAutoPilotSelected: true };
    const wrapper = shallow(<ThroughputInputAutoPilotV3Component {...newProps} />);
    const throughputComponent = wrapper.instance() as ThroughputInputAutoPilotV3Component;
    expect(throughputComponent.hasProvisioningTypeChanged()).toEqual(true);
    expect(throughputComponent.overrideWithProvisionedThroughputSettings()).toEqual(true);
    expect(throughputComponent.overrideWithAutoPilotSettings()).toEqual(false);

    expect(wrapper).toMatchSnapshot();
    expect(wrapper.exists("#autopilotInput")).toEqual(true);
    expect(wrapper.exists("#throughputInput")).toEqual(false);
    expect(wrapper.exists("#manualToAutoscaleDisclaimerElement")).toEqual(true);

    wrapper.setProps({ wasAutopilotOriginallySet: true });
    wrapper.update();
    expect(wrapper.exists("#throughputSpendElement")).toEqual(true);
  });

  it("spendAck checkbox visible", () => {
    const newProps = { ...baseProps, spendAckVisible: true };
    const wrapper = shallow(<ThroughputInputAutoPilotV3Component {...newProps} />);
    expect(wrapper).toMatchSnapshot();
    expect(wrapper.exists("#spendAckCheckBox")).toEqual(true);
  });

  it("scale saveable and discardable are set", () => {
    let throughputComponent = new ThroughputInputAutoPilotV3Component(baseProps);
    let isComponentDirtyResult = throughputComponent.IsComponentDirty();
    expect(isComponentDirtyResult.isSaveable).toEqual(false);
    expect(isComponentDirtyResult.isDiscardable).toEqual(false);

    const newProps = { ...baseProps, throughput: 1000000 };
    throughputComponent = new ThroughputInputAutoPilotV3Component(newProps);
    isComponentDirtyResult = throughputComponent.IsComponentDirty();
    expect(isComponentDirtyResult.isSaveable).toEqual(true);
    expect(isComponentDirtyResult.isDiscardable).toEqual(true);
  });
});
