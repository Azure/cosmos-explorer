import { shallow } from "enzyme";
import React from "react";
import { ScaleComponent, ScaleComponentProps } from "./ScaleComponent";
import { container, collection } from "../TestUtils";
import * as DataModels from "../../../../Contracts/DataModels";
import { ThroughputInputAutoPilotV3Component } from "./ThroughputInputComponents/ThroughputInputAutoPilotV3Component";
import { ThroughputInputComponent } from "./ThroughputInputComponents/ThroughputInputComponent";
import Explorer from "../../../Explorer";
import * as Constants from "../../../../Common/Constants";

describe("ScaleComponent", () => {
  const baseProps: ScaleComponentProps = {
    collection: collection,
    container: container,
    hasProvisioningTypeChanged: () => true,
    hasAutoPilotV2FeatureFlag: false,
    isFixedContainer: false,
    autoPilotTiersList: [],
    onThroughputChange: () => {
      return;
    },
    throughput: 1000,
    throughputBaseline: 1000,
    autoPilotThroughput: 4000,
    autoPilotThroughputBaseline: 4000,
    selectedAutoPilotTier: DataModels.AutopilotTier.Tier1,
    selectedAutoPilotTierBaseline: DataModels.AutopilotTier.Tier1,
    isAutoPilotSelected: false,
    wasAutopilotOriginallySet: true,
    userCanChangeProvisioningTypes: false,
    overrideWithProvisionedThroughputSettings: () => false,
    onAutoPilotSelected: () => false,
    onAutoPilotTierChange: () => {
      return;
    },
    onMaxAutoPilotThroughputChange: () => {
      return;
    },
    onScaleSaveableChange: (isScaleSaveable: boolean) => {
      return;
    },
    onScaleDiscardableChange: (isScaleDiscardable: boolean) => {
      return;
    },
    initialNotification: undefined 
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

  it("autoScale disabled", () => {
    const scaleComponent = new ScaleComponent(baseProps);
    expect(scaleComponent.isAutoScaleEnabled()).toEqual(false);
  });

  it("autoScale enabled", () => {
    const newContainer = new Explorer({
      notificationsClient: undefined,
      isEmulator: false
    });

    newContainer.databaseAccount({
      id: undefined,
      name: undefined,
      location: undefined,
      type: undefined,
      kind: "documentdb",
      tags: undefined,
      properties: {
        documentEndpoint: undefined,
        tableEndpoint: undefined,
        gremlinEndpoint: undefined,
        cassandraEndpoint: undefined,
        capabilities: [
          {
            name: Constants.CapabilityNames.EnableAutoScale.toLowerCase(),
            description: undefined
          }
        ]
      }
    });
    const props = { ...baseProps, container: newContainer };
    const scaleComponent = new ScaleComponent(props);
    expect(scaleComponent.isAutoScaleEnabled()).toEqual(true);
  });

  it("getMaxRUThroughputInputLimit", () => {
    const scaleComponent = new ScaleComponent(baseProps);
    expect(scaleComponent.getMaxRUThroughputInputLimit()).toEqual(40000);
  });

  it("getThroughputTitle", () => {
    const scaleComponent = new ScaleComponent(baseProps);
    expect(scaleComponent.getThroughputTitle()).toEqual("Throughput (6,000 - 40,000 RU/s)");
  });

  it("should override with AutoPilotSettings", () => {
    const scaleComponent = new ScaleComponent(baseProps);
    expect(scaleComponent.overrideWithAutoPilotSettings()).toEqual(true);
  });

  it("should not override with AutoPilotSettings", () => {
    const props = { ...baseProps, hasAutoPilotV2FeatureFlag: true };
    const scaleComponent = new ScaleComponent(props);
    expect(scaleComponent.overrideWithAutoPilotSettings()).toEqual(false);
  });
});
