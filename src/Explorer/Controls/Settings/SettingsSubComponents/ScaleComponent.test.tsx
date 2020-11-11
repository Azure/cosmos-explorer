import { shallow } from "enzyme";
import ko from "knockout";
import React from "react";
import * as Constants from "../../../../Common/Constants";
import * as DataModels from "../../../../Contracts/DataModels";
import Explorer from "../../../Explorer";
import { throughputUnit } from "../SettingsRenderUtils";
import { collection, container } from "../TestUtils";
import { ScaleComponent, ScaleComponentProps } from "./ScaleComponent";
import { ThroughputInputAutoPilotV3Component } from "./ThroughputInputComponents/ThroughputInputAutoPilotV3Component";

describe("ScaleComponent", () => {
  const nonNationalCloudContainer = new Explorer();
  nonNationalCloudContainer.isRunningOnNationalCloud = () => false;

  const targetThroughput = 6000;

  const baseProps: ScaleComponentProps = {
    collection: collection,
    container: container,
    isFixedContainer: false,
    onThroughputChange: () => {
      return;
    },
    throughput: 1000,
    throughputBaseline: 1000,
    autoPilotThroughput: 4000,
    autoPilotThroughputBaseline: 4000,
    isAutoPilotSelected: false,
    wasAutopilotOriginallySet: true,
    onAutoPilotSelected: () => false,
    onMaxAutoPilotThroughputChange: () => {
      return;
    },
    onScaleSaveableChange: () => {
      return;
    },
    onScaleDiscardableChange: () => {
      return;
    },
    initialNotification: {
      description: `Throughput update for ${targetThroughput} ${throughputUnit}`
    } as DataModels.Notification
  };

  it("renders with correct intiial notification", () => {
    let wrapper = shallow(<ScaleComponent {...baseProps} />);
    expect(wrapper).toMatchSnapshot();
    expect(wrapper.exists(ThroughputInputAutoPilotV3Component)).toEqual(true);
    expect(wrapper.exists("#throughputApplyShortDelayMessage")).toEqual(false);

    const newCollection = { ...collection };
    const maxThroughput = 5000;
    const targetMaxThroughput = 50000;
    newCollection.offer = ko.observable({
      content: {
        offerAutopilotSettings: {
          maxThroughput: maxThroughput,
          targetMaxThroughput: targetMaxThroughput
        }
      },
      headers: { "x-ms-offer-replace-pending": true }
    } as DataModels.OfferWithHeaders);
    const newProps = {
      ...baseProps,
      initialNotification: undefined as DataModels.Notification,
      collection: newCollection
    };
    wrapper = shallow(<ScaleComponent {...newProps} />);
    expect(wrapper.exists("#throughputApplyShortDelayMessage")).toEqual(true);
    expect(wrapper.exists("#throughputApplyLongDelayMessage")).toEqual(false);
    expect(wrapper.find("#throughputApplyShortDelayMessage").html()).toContain(maxThroughput);
    expect(wrapper.find("#throughputApplyShortDelayMessage").html()).toContain(targetMaxThroughput);
  });

  it("autoScale disabled", () => {
    const scaleComponent = new ScaleComponent(baseProps);
    expect(scaleComponent.isAutoScaleEnabled()).toEqual(false);
  });

  it("autoScale enabled", () => {
    const newContainer = new Explorer();

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

  it("getThroughputTitle", () => {
    let scaleComponent = new ScaleComponent(baseProps);
    expect(scaleComponent.getThroughputTitle()).toEqual("Throughput (6,000 - unlimited RU/s)");

    let newProps = { ...baseProps, container: nonNationalCloudContainer };
    scaleComponent = new ScaleComponent(newProps);
    expect(scaleComponent.getThroughputTitle()).toEqual("Throughput (6,000 - unlimited RU/s)");

    newProps = { ...baseProps, isAutoPilotSelected: true };
    scaleComponent = new ScaleComponent(newProps);
    expect(scaleComponent.getThroughputTitle()).toEqual("Throughput (autoscale)");
  });
});
