import React from "react";
import { Descriptor, InputType, SmartUiComponent } from "../../../SmartUi/SmartUiComponent";
import { SqlX } from "./SqlX";

export class SelfServeComponent extends React.Component {
  private onSubmit = async (currentValues: Map<string, InputType>): Promise<void> => {
    console.log(currentValues.get("instanceCount"), currentValues.get("instanceSize"));
  };

  private selfServeData: Descriptor = {
    onSubmit: this.onSubmit,
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
          id: "instanceCount",
          input: {
            label: "Instance Count",
            dataFieldName: "instanceCount",
            type: "number",
            min: 1,
            max: 5,
            step: 1,
            defaultValue: 1,
            inputType: "slider",
            onChange: (currentState: Map<string, InputType>, newValue: InputType): Map<string, InputType> => {
              currentState.set("instanceCount", newValue);
              if ((newValue as number) === 1) {
                currentState.set("instanceSize", "1Core4Gb");
              }
              return currentState;
            }
          }
        },
        {
          id: "instanceSize",
          input: {
            label: "Instance Size",
            dataFieldName: "instanceSize",
            type: "object",
            choices: [
              { label: "1Core4Gb", key: "1Core4Gb", value: "1Core4Gb" },
              { label: "2Core8Gb", key: "2Core8Gb", value: "2Core8Gb" },
              { label: "4Core16Gb", key: "4Core16Gb", value: "4Core16Gb" }
            ],
            defaultKey: "1Core4Gb",
            onChange: (currentState: Map<string, InputType>, newValue: InputType): Map<string, InputType> => {
              currentState.set("instanceSize", newValue);
              return currentState;
            }
          }
        }
      ]
    }
  };

  public render(): JSX.Element {
    //return <SmartUiComponent descriptor={this.selfServeData} />
    return <SmartUiComponent descriptor={SqlX.toSmartUiDescriptor()} />;
  }
}
