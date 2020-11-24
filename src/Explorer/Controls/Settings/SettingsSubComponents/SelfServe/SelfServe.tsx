import React from "react";
import { Descriptor, InputType, SmartUiComponent } from "../../../SmartUi/SmartUiComponent";
import { SqlX } from "./SqlX";

interface SelfServeComponentProps {
    propertyNames: string[]
}

export class SelfServeCmponent extends React.Component<SelfServeComponentProps> {

    private properties: any = {}

    constructor(props: SelfServeComponentProps) {
        super(props)
        let stringer = "{"
        for (var i =0; i < props.propertyNames.length; i++) {
            stringer += `"${props.propertyNames[i]}":null,`
        }
        stringer = stringer.substring(0, stringer.length-1)
        console.log(stringer)
        stringer += "}"
        this.properties = JSON.parse(stringer)
    }


      private selfServeData: Descriptor = {
        root: {
          id: "root",
          info: {
            message: "Start at $24/mo per database",
            link: {
              href: "https://aka.ms/azure-cosmos-db-pricing",
              text: "More Details"
            }
          },
          children: {
          "instanceCount" : {
              id: "instanceCount",
              input: {
                label: "Instance Count",
                dataFieldName: "instanceCount",
                type: "number",
                min: 1,
                max: 5,
                step: 1,
                defaultValue: 1,
                inputType: "slider"
              }
            },
            "instanceSize": {
              id: "instanceSize",
              input: {
                label: "Instance Size",
                dataFieldName: "instanceSize",
                type: "enum",
                choices: [
                  { label: "1Core4Gb", key: "1Core4Gb", value: "1Core4Gb" },
                  { label: "2Core8Gb", key: "2Core8Gb", value: "2Core8Gb" },
                  { label: "4Core16Gb", key: "4Core16Gb", value: "4Core16Gb" }
                ],
                defaultKey: "1Core4Gb"
              }
            }
        }
      }
    };



      private exampleCallbacks = (newValues: Map<string, InputType>): void => {
        for (var i =0; i < this.props.propertyNames.length; i++) {
            const prop = this.props.propertyNames[i]
            const newVal = newValues.get(prop)
            if (newVal) {
                this.properties[`${prop}`] = newVal
            }
        }

        console.log(this.properties)
      };
    
    public render() : JSX.Element {
      const data : Descriptor = {root: SqlX.toJson()}
        //return <SmartUiComponent descriptor={this.selfServeData} onChange={this.exampleCallbacks} />
        return <SmartUiComponent descriptor={data} onChange={this.exampleCallbacks} />
    }
}