import { shallow } from "enzyme";
import React from "react";
import { DescriptionType, NumberUiType, SmartUiInput } from "../../../SelfServe/SelfServeTypes";
import { SmartUiComponent, SmartUiDescriptor } from "./SmartUiComponent";

describe("SmartUiComponent", () => {
  const exampleData: SmartUiDescriptor = {
    root: {
      id: "root",
      info: {
        messageTKey: "Start at $24/mo per database",
        link: {
          href: "https://aka.ms/azure-cosmos-db-pricing",
          textTKey: "More Details",
        },
      },
      children: [
        {
          id: "description",
          input: {
            labelTKey: undefined,
            dataFieldName: "description",
            type: "string",
            description: {
              textTKey: "this is an example description text.",
              type: DescriptionType.Text,
              link: {
                href: "https://docs.microsoft.com/en-us/azure/cosmos-db/introduction",
                textTKey: "Click here for more information.",
              },
            },
          },
        },
        {
          id: "throughput",
          input: {
            labelTKey: "Throughput (input)",
            dataFieldName: "throughput",
            type: "number",
            min: 400,
            max: 500,
            step: 10,
            defaultValue: 400,
            uiType: NumberUiType.Spinner,
          },
        },
        {
          id: "throughput2",
          input: {
            labelTKey: "Throughput (Slider)",
            dataFieldName: "throughput2",
            type: "number",
            min: 400,
            max: 500,
            step: 10,
            defaultValue: 400,
            uiType: NumberUiType.Slider,
          },
        },
        {
          id: "throughput3",
          input: {
            labelTKey: "Throughput (invalid)",
            dataFieldName: "throughput3",
            type: "boolean",
            min: 400,
            max: 500,
            step: 10,
            defaultValue: 400,
            uiType: NumberUiType.Spinner,
            errorMessage: "label, truelabel and falselabel are required for boolean input 'throughput3'",
          },
        },
        {
          id: "containerId",
          input: {
            labelTKey: "Container id",
            dataFieldName: "containerId",
            type: "string",
          },
        },
        {
          id: "analyticalStore",
          input: {
            labelTKey: "Analytical Store",
            trueLabelTKey: "Enabled",
            falseLabelTKey: "Disabled",
            defaultValue: true,
            dataFieldName: "analyticalStore",
            type: "boolean",
          },
        },
        {
          id: "database",
          input: {
            labelTKey: "Database",
            dataFieldName: "database",
            type: "object",
            choices: [
              { labelTKey: "Database 1", key: "db1" },
              { labelTKey: "Database 2", key: "db2" },
              { labelTKey: "Database 3", key: "db3" },
            ],
            defaultKey: "db2",
          },
        },
      ],
    },
  };

  it("should render and honor input's hidden, disabled state", async () => {
    const currentValues = new Map<string, SmartUiInput>();
    const wrapper = shallow(
      <SmartUiComponent
        disabled={false}
        descriptor={exampleData}
        currentValues={currentValues}
        onInputChange={jest.fn()}
        onError={() => {
          return;
        }}
        getTranslation={(key: string) => {
          return key;
        }}
      />,
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(wrapper).toMatchSnapshot();
    expect(wrapper.exists("#containerId-textField-input")).toBeTruthy();

    currentValues.set("containerId", { value: "container1", hidden: true });
    wrapper.setProps({ currentValues });
    wrapper.update();
    expect(wrapper.exists("#containerId-textField-input")).toBeFalsy();

    currentValues.set("containerId", { value: "container1", hidden: false, disabled: true });
    wrapper.setProps({ currentValues });
    wrapper.update();
    const containerIdTextField = wrapper.find("#containerId-textField-input");
    expect(containerIdTextField.props().disabled).toBeTruthy();
  });

  it("disable all inputs", async () => {
    const wrapper = shallow(
      <SmartUiComponent
        disabled={true}
        descriptor={exampleData}
        currentValues={new Map()}
        onInputChange={jest.fn()}
        onError={() => {
          return;
        }}
        getTranslation={(key: string) => {
          return key;
        }}
      />,
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(wrapper).toMatchSnapshot();
    const throughputSpinner = wrapper.find("#throughput-spinner-input");
    expect(throughputSpinner.props().disabled).toBeTruthy();
    const throughput2Slider = wrapper.find("#throughput2-slider-input").childAt(0);
    expect(throughput2Slider.props().disabled).toBeTruthy();
    const containerIdTextField = wrapper.find("#containerId-textField-input");
    expect(containerIdTextField.props().disabled).toBeTruthy();
    const analyticalStoreToggle = wrapper.find("#analyticalStore-toggle-input");
    expect(analyticalStoreToggle.props().disabled).toBeTruthy();
    const databaseDropdown = wrapper.find("#database-dropdown-input");
    expect(databaseDropdown.props().disabled).toBeTruthy();
  });
});
