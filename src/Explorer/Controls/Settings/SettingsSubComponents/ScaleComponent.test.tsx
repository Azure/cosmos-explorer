import { shallow } from "enzyme";
import React from "react";
import { ScaleComponent, ScaleComponentProps } from "./ScaleComponent";
import { container, collection } from "../TestUtils";
import { StatefulValue } from "../../StatefulValue/StatefulValue";
import * as DataModels from "../../../../Contracts/DataModels";
import { ThroughputInputAutoPilotV3Component } from "./ThroughputInputComponents/ThroughputInputAutoPilotV3Component";
import { ThroughputInputComponent } from "./ThroughputInputComponents/ThroughputInputComponent";

describe("ScaleComponent", () => {
  const baseProps: ScaleComponentProps = {
    collection: collection,
    container: container,
    hasProvisioningTypeChanged: () => true,
    hasAutoPilotV2FeatureFlag: false,
    isFixedContainer: false,
    autoPilotTiersList: [],
    setThroughput: () => {
      return;
    },
    throughput: new StatefulValue<number>(1000),
    autoPilotThroughput: new StatefulValue<number>(4000),
    selectedAutoPilotTier: DataModels.AutopilotTier.Tier1,
    isAutoPilotSelected: false,
    wasAutopilotOriginallySet: false,
    userCanChangeProvisioningTypes: false,
    overrideWithProvisionedThroughputSettings: () => false,
    setAutoPilotSelected: () => false,
    setAutoPilotTier: () => {
      return;
    },
    setMaxAutoPilotThroughput: () => {
      return;
    }
  };

  it("renders V3 throughput component", () => {
    const wrapper = shallow(<ScaleComponent {...baseProps} />);
    expect(wrapper).toMatchSnapshot();
    expect(wrapper.exists(ThroughputInputAutoPilotV3Component)).toEqual(true);
    expect(wrapper.exists(ThroughputInputComponent)).toEqual(false);
  });

  it("renders V2 throughput component", () => {
    const props = { ...baseProps, hasAutoPilotV2FeatureFlag: true };
    const wrapper = shallow(<ScaleComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
    expect(wrapper.exists(ThroughputInputAutoPilotV3Component)).toEqual(false);
    expect(wrapper.exists(ThroughputInputComponent)).toEqual(true);
  });
});
