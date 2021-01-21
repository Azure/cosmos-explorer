import React from "react";
import { shallow } from "enzyme";
import { SmartUiComponent, SmartUiDescriptor, UiType } from "./SmartUiComponent";

describe("SmartUiComponent", () => {
  const exampleData: SmartUiDescriptor = {
    root: {
      id: "root",
      info: {
        message: "Start at $24/mo per database",
        link: {
          href: "https://aka.ms/azure-cosmos-db-pricing",
          text: "More Details"
        }
      },
      children: [
        {
          id: "throughput",
          input: {
            label: "Throughput (input)",
            dataFieldName: "throughput",
            type: "number",
            min: 400,
            max: 500,
            step: 10,
            defaultValue: 400,
            uiType: UiType.Spinner
          }
        },
        {
          id: "throughput2",
          input: {
            label: "Throughput (Slider)",
            dataFieldName: "throughput2",
            type: "number",
            min: 400,
            max: 500,
            step: 10,
            defaultValue: 400,
            uiType: UiType.Slider
          }
        },
        {
          id: "throughput3",
          input: {
            label: "Throughput (invalid)",
            dataFieldName: "throughput3",
            type: "boolean",
            min: 400,
            max: 500,
            step: 10,
            defaultValue: 400,
            uiType: UiType.Spinner,
            errorMessage: "label, truelabel and falselabel are required for boolean input 'throughput3'"
          }
        },
        {
          id: "containerId",
          input: {
            label: "Container id",
            dataFieldName: "containerId",
            type: "string"
          }
        },
        {
          id: "analyticalStore",
          input: {
            label: "Analytical Store",
            trueLabel: "Enabled",
            falseLabel: "Disabled",
            defaultValue: true,
            dataFieldName: "analyticalStore",
            type: "boolean"
          }
        },
        {
          id: "database",
          input: {
            label: "Database",
            dataFieldName: "database",
            type: "object",
            choices: [
              { label: "Database 1", key: "db1" },
              { label: "Database 2", key: "db2" },
              { label: "Database 3", key: "db3" }
            ],
            defaultKey: "db2"
          }
        }
      ]
    }
  };

  it("should render", async () => {
    const wrapper = shallow(
      <SmartUiComponent descriptor={exampleData} currentValues={new Map()} onInputChange={undefined} />
    );
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(wrapper).toMatchSnapshot();
  });
});
