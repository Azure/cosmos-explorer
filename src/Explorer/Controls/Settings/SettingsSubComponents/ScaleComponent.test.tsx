import { shallow } from "enzyme";
import React from "react";
import { ScaleComponent, ScaleComponentProps } from "./ScaleComponent";
import { container, collection } from "../TestUtils";
import { ThroughputInputAutoPilotV3Component } from "./ThroughputInputComponents/ThroughputInputAutoPilotV3Component";
import Explorer from "../../../Explorer";
import * as Constants from "../../../../Common/Constants";
import { PlatformType } from "../../../../PlatformType";
import * as DataModels from "../../../../Contracts/DataModels";
import { throughputUnit } from "../SettingsRenderUtils";
import * as SharedConstants from "../../../../Shared/Constants";
import ko from "knockout";

describe("ScaleComponent", () => {
  const nonNationalCloudContainer = new Explorer({
    notificationsClient: undefined
  });
  nonNationalCloudContainer.getPlatformType = () => PlatformType.Portal;
  nonNationalCloudContainer.isRunningOnNationalCloud = () => false;

  const targetThroughput = 6000;

  const baseProps: ScaleComponentProps = {
    collection: collection,
    container: container,
    isFixedContainer: false,
    autoPilotTiersList: [],
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
    expect(wrapper.exists("#throughputApplyLongDelayMessage")).toEqual(true);
    expect(wrapper.exists("#throughputApplyShortDelayMessage")).toEqual(false);
    expect(wrapper.find("#throughputApplyLongDelayMessage").html()).toContain(targetThroughput);

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
    const newContainer = new Explorer({
      notificationsClient: undefined
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
    let scaleComponent = new ScaleComponent(baseProps);
    expect(scaleComponent.getThroughputTitle()).toEqual("Throughput (6,000 - 40,000 RU/s)");

    let newProps = { ...baseProps, container: nonNationalCloudContainer };
    scaleComponent = new ScaleComponent(newProps);
    expect(scaleComponent.getThroughputTitle()).toEqual("Throughput (6,000 - unlimited RU/s)");

    newProps = { ...baseProps, isAutoPilotSelected: true };
    scaleComponent = new ScaleComponent(newProps);
    expect(scaleComponent.getThroughputTitle()).toEqual("Throughput (autoscale)");
  });

  it("canThroughputExceedMaximumValue", () => {
    let scaleComponent = new ScaleComponent(baseProps);
    expect(scaleComponent.canThroughputExceedMaximumValue()).toEqual(false);

    const newProps = { ...baseProps, container: nonNationalCloudContainer };
    scaleComponent = new ScaleComponent(newProps);
    expect(scaleComponent.canThroughputExceedMaximumValue()).toEqual(true);
  });

  it("getThroughputWarningMessage", () => {
    const throughputBeyondLimit = SharedConstants.CollectionCreation.DefaultCollectionRUs1Million + 1000;
    const throughputBeyondMaxRus = SharedConstants.CollectionCreation.DefaultCollectionRUs1Million - 1000;

    const newProps = { ...baseProps, container: nonNationalCloudContainer, throughput: throughputBeyondLimit };
    let scaleComponent = new ScaleComponent(newProps);
    expect(scaleComponent.getThroughputWarningMessage().props.id).toEqual("updateThroughputBeyondLimitWarningMessage");

    newProps.throughput = throughputBeyondMaxRus;
    scaleComponent = new ScaleComponent(newProps);
    expect(scaleComponent.getThroughputWarningMessage().props.id).toEqual("updateThroughputDelayedApplyWarningMessage");
  });
});
