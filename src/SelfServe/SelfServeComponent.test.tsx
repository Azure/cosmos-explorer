import React from "react";
import { shallow } from "enzyme";
import { SelfServeDescriptor, SelfServeComponent, SelfServeComponentState } from "./SelfServeComponent";
import { InputType, UiType } from "../Explorer/Controls/SmartUi/SmartUiComponent";

describe("SelfServeComponent", () => {
  const defaultValues = new Map<string, InputType>([
    ["throughput", "450"],
    ["analyticalStore", "false"],
    ["database", "db2"],
  ]);
  const initializeMock = jest.fn(async () => defaultValues);
  const onSubmitMock = jest.fn(async () => {
    return;
  });

  const exampleData: SelfServeDescriptor = {
    initialize: initializeMock,
    onSubmit: onSubmitMock,
    inputNames: ["throughput", "containerId", "analyticalStore", "database"],
    root: {
      id: "root",
      info: {
        message: "Start at $24/mo per database",
        link: {
          href: "https://aka.ms/azure-cosmos-db-pricing",
          text: "More Details",
        },
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
            uiType: UiType.Spinner,
          },
        },
        {
          id: "containerId",
          input: {
            label: "Container id",
            dataFieldName: "containerId",
            type: "string",
          },
        },
        {
          id: "analyticalStore",
          input: {
            label: "Analytical Store",
            trueLabel: "Enabled",
            falseLabel: "Disabled",
            defaultValue: true,
            dataFieldName: "analyticalStore",
            type: "boolean",
          },
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
              { label: "Database 3", key: "db3" },
            ],
            defaultKey: "db2",
          },
        },
      ],
    },
  };

  const verifyDefaultsSet = (currentValues: Map<string, InputType>): void => {
    for (const key of currentValues.keys()) {
      if (defaultValues.has(key)) {
        expect(defaultValues.get(key)).toEqual(currentValues.get(key));
      }
    }
  };

  it("should render", async () => {
    const wrapper = shallow(<SelfServeComponent descriptor={exampleData} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(wrapper).toMatchSnapshot();

    // initialize() should be called and defaults should be set when component is mounted
    expect(initializeMock).toHaveBeenCalled();
    const state = wrapper.state() as SelfServeComponentState;
    verifyDefaultsSet(state.currentValues);

    // onSubmit() must be called when submit button is clicked
    const submitButton = wrapper.find("#submitButton");
    submitButton.simulate("click");
    expect(onSubmitMock).toHaveBeenCalled();
  });
});
