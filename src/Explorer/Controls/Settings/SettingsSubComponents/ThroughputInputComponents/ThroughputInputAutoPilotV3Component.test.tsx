import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { Keys, t } from "Localization";
import { shallow } from "enzyme";
import React from "react";
import * as Constants from "../../../../../Common/Constants";
import * as DataModels from "../../../../../Contracts/DataModels";
import { updateUserContext } from "../../../../../UserContext";
import {
  ThroughputInputAutoPilotV3Component,
  ThroughputInputAutoPilotV3Props,
} from "./ThroughputInputAutoPilotV3Component";

describe("ThroughputInputAutoPilotV3Component", () => {
  beforeAll(() => {
    updateUserContext({
      databaseAccount: {
        properties: {
          capabilities: [{ name: Constants.CapabilityNames.EnableHotPartitionKeyThrottling }],
        },
      } as DataModels.DatabaseAccount,
    });
  });

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
    isGlobalSecondaryIndexTarget: false,
    onHotPartitionKeyRateLimitingPolicyChange: () => {
      return;
    },
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

  const renderPolicyEditor = (
    policy: DataModels.HotPartitionKeyRateLimitingPolicy | null = {
      maximumPerPartitionKeyThroughputUtilizationPercent: 85,
    },
  ) => {
    const ref = React.createRef<ThroughputInputAutoPilotV3Component>();
    const onPolicyChange = jest.fn();
    const PolicyEditor = () => {
      const [currentPolicy, setCurrentPolicy] = React.useState<DataModels.HotPartitionKeyRateLimitingPolicy | null>(
        policy,
      );
      return (
        <ThroughputInputAutoPilotV3Component
          {...baseProps}
          ref={ref}
          hotPartitionKeyRateLimitingPolicy={currentPolicy}
          hotPartitionKeyRateLimitingPolicyBaseline={policy}
          onHotPartitionKeyRateLimitingPolicyChange={(newPolicy) => {
            onPolicyChange(newPolicy);
            setCurrentPolicy(newPolicy);
          }}
        />
      );
    };
    render(<PolicyEditor />);
    return { onPolicyChange, ref };
  };

  it("removes the policy and makes the change saveable and discardable", () => {
    const { onPolicyChange, ref } = renderPolicyEditor();
    const toggle = screen.getByRole("switch", { name: t(Keys.controls.settings.scale.rateLimitingPolicyTitle) });
    expect(toggle).toBeChecked();

    fireEvent.click(toggle);

    expect(onPolicyChange).toHaveBeenLastCalledWith(null);
    expect(toggle).not.toBeChecked();
    expect(screen.getByRole("slider")).toHaveAttribute("aria-disabled", "true");
    expect(screen.queryByRole("button", { name: "Reset to default" })).not.toBeInTheDocument();
    expect(ref.current.IsComponentDirty()).toMatchObject({ isSaveable: true, isDiscardable: true });
  });

  it("immediately restores the baseline value when re-enabling a removed policy", () => {
    const { onPolicyChange, ref } = renderPolicyEditor();
    const toggle = screen.getByRole("switch", { name: t(Keys.controls.settings.scale.rateLimitingPolicyTitle) });
    fireEvent.click(toggle);
    fireEvent.click(toggle);

    expect(onPolicyChange).toHaveBeenCalledTimes(2);
    expect(toggle).toBeChecked();
    expect(onPolicyChange).toHaveBeenLastCalledWith({ maximumPerPartitionKeyThroughputUtilizationPercent: 85 });
    expect(ref.current.IsComponentDirty()).toMatchObject({ isSaveable: false, isDiscardable: false });
  });

  it("immediately enables a new policy with the default utilization", () => {
    const { onPolicyChange, ref } = renderPolicyEditor(null);
    const toggle = screen.getByRole("switch", { name: t(Keys.controls.settings.scale.rateLimitingPolicyTitle) });

    fireEvent.click(toggle);

    expect(toggle).toBeChecked();
    expect(onPolicyChange).toHaveBeenLastCalledWith({ maximumPerPartitionKeyThroughputUtilizationPercent: 75 });
    expect(screen.queryByRole("button", { name: "Reset to default" })).not.toBeInTheDocument();
    expect(ref.current.IsComponentDirty()).toMatchObject({ isSaveable: true, isDiscardable: true });
  });
});
