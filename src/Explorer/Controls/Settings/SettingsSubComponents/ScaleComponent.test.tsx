import * as Constants from "../../../../Common/Constants";
import { updateUserContext } from "../../../../UserContext";
import Explorer from "../../../Explorer";
import { collection } from "../TestUtils";
import { ScaleComponent, ScaleComponentProps } from "./ScaleComponent";

describe("ScaleComponent", () => {
  const baseProps: ScaleComponentProps = {
    collection: collection,
    database: undefined,
    isFixedContainer: false,
    isGlobalSecondaryIndex: false,
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
  };

  it("autoScale disabled", () => {
    const scaleComponent = new ScaleComponent(baseProps);
    expect(scaleComponent.isAutoScaleEnabled()).toEqual(false);
  });

  it("autoScale enabled", () => {
    const newContainer = new Explorer();
    updateUserContext({
      databaseAccount: {
        id: undefined,
        name: undefined,
        location: undefined,
        type: undefined,
        kind: "documentdb",
        properties: {
          documentEndpoint: undefined,
          tableEndpoint: undefined,
          gremlinEndpoint: undefined,
          cassandraEndpoint: undefined,
          capabilities: [
            {
              name: Constants.CapabilityNames.EnableAutoScale.toLowerCase(),
              description: undefined,
            },
          ],
        },
      },
    });
    const props = { ...baseProps, container: newContainer };
    const scaleComponent = new ScaleComponent(props);
    expect(scaleComponent.isAutoScaleEnabled()).toEqual(true);
  });

  it("getThroughputTitle", () => {
    let scaleComponent = new ScaleComponent(baseProps);
    expect(scaleComponent.getThroughputTitle()).toEqual("Throughput (6,000 - unlimited RU/s)");

    let newProps = { ...baseProps };
    scaleComponent = new ScaleComponent(newProps);
    expect(scaleComponent.getThroughputTitle()).toEqual("Throughput (6,000 - unlimited RU/s)");

    newProps = { ...baseProps, isAutoPilotSelected: true };
    scaleComponent = new ScaleComponent(newProps);
    expect(scaleComponent.getThroughputTitle()).toEqual("Throughput (autoscale)");
  });

  it("canThroughputExceedMaximumValue", () => {
    let scaleComponent = new ScaleComponent(baseProps);
    expect(scaleComponent.canThroughputExceedMaximumValue()).toEqual(true);

    const newProps = { ...baseProps };
    scaleComponent = new ScaleComponent(newProps);
    expect(scaleComponent.canThroughputExceedMaximumValue()).toEqual(true);
  });
});
