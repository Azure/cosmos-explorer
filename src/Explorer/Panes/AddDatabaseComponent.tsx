import * as React from "react";
import { SmartUiComponentProps, InputType, SmartUiComponent } from "../Controls/SmartUi/SmartUiComponent";

export interface AddDatabaseComponentProps {
  disableThroughputConfiguration?: boolean;
}

interface AddDatabaseComponentState {
  databaseId: string;
  provisionThroughput: boolean;
  autoScale: boolean;
  throughput: number;
}

export class AddDatabaseComponent extends React.Component<AddDatabaseComponentProps, AddDatabaseComponentState> {

  constructor(props: AddDatabaseComponentProps) {
    super(props);

    this.state = {
      databaseId: undefined,
      provisionThroughput: false,
      autoScale: false,
      throughput: 0
    };
  }

  render(): JSX.Element {
    const props: SmartUiComponentProps = {
      descriptor: {
        root: {
          id: "root",
          children: [
            {
              id: "databaseId",
              input: {
                type: "string",
                label: "Database id",
                dataFieldName: "databaseId",
                placeholder: "Type a new database id"
              }
            }
          ]
        }
      },
      onChange: this.onChange
    };

    if (!this.props.disableThroughputConfiguration) {
      props.descriptor.root.children.push({
        id: "showProvisionThroughput",
        input: {
          type: "boolean",
          inputType: "checkbox",
          label: "Provision throughput",
          dataFieldName: "throughputConfigurationVisible"
        }
      });

      if (this.state.provisionThroughput) {
        props.descriptor.root.children.push({
          id: "throughputType",
          input: {
            type: "boolean",
            inputType: "radio",
            label: `Throughput (${this.state.autoScale ? "autoscale" : "400 - 1,000,000 RU/s"})`,
            trueLabel: "Autoscale",
            falseLabel: "Manual",
            dataFieldName: "autoscale"
          }
        });

        props.descriptor.root.children.push({
          id: "throughput",
          input: {
            type: "number",
            inputType: "spin",
            label: "Estimated cost",
            defaultValue: "",
            dataFieldName: "throughput"
          }
        });
      }
    }

    return <SmartUiComponent {...props} />;
  }

  private onChange = (newValues: Map<string, InputType>): void =>  {
    newValues.forEach((value: InputType, key: string) => {
      switch (key) {
        case "databaseId":
          this.setState({
            databaseId: value as string
          });
          break;

        case "throughputConfigurationVisible":
          this.setState({
            provisionThroughput: value as boolean
          });
          break;

        case "autoscale":
          this.setState({
            autoScale: value as boolean
          });
          break;

        case "throughput":
          this.setState({
            throughput: value as number
          });
          break;

        default:
          throw new Error(`Unsupported key ${key}`);
      }
    });
  }
}