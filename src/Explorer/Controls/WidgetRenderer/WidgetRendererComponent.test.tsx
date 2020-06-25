import React from "react";
import { shallow } from "enzyme";
import { WidgetRendererComponent, Descriptor, InputType } from "./WidgetRendererComponent";

describe("WidgetRendererComponent", () => {
  const exampleData: Descriptor = {
    root: {
      id: "root",
      info: {
        message: "Start at $24/mo per database",
        url: "https://aka.ms/azure-cosmos-db-pricing"
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
            inputType: "spin"
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
            inputType: "slider"
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
            type: "enum",
            choices: [
              { label: "Database 1", key: "db1", value: "database1" },
              { label: "Database 2", key: "db2", value: "database2" },
              { label: "Database 3", key: "db3", value: "database3" }
            ],
            defaultKey: "db2"
          }
        }
      ]
    }
  };

  const exampleCallbacks = (newValues: Map<string, InputType>): void => {
    console.log("New values:", newValues);
  };

  it("should render", () => {
    const wrapper = shallow(<WidgetRendererComponent descriptor={exampleData} onChange={exampleCallbacks} />);
    expect(wrapper).toMatchSnapshot();
  });
});
