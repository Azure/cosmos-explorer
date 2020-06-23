import * as React from "react";
import { Slider } from "office-ui-fabric-react/lib/Slider";
import { SpinButton } from "office-ui-fabric-react/lib/SpinButton";
import { InputType } from "../../Tables/Constants";
import { RadioSwitchComponent } from "../RadioSwitchComponent/RadioSwitchComponent";

/**
 * Generic UX renderer
 * It takes:
 * - a JSON object as data
 * - a Map of callbacks
 * - a descriptor of the UX.
 */

export type InputTypeValue = "number" | "string" | "boolean" | "enum";

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export type EnumItem = { label: string, key: string, value: any };

export type InputType = number | string | boolean | EnumItem;

interface BaseInput {
  label: string;
  dataFieldName: string;
  type: InputTypeValue;
  placeholder?: string;
}

/**
 * For now, this only supports integers
 */
export interface NumberInput extends BaseInput {
  min?: number;
  max?: number;
  defaultValue: number;
  inputType: "spin" | "slider";
}

export interface BooleanInput extends BaseInput {
  trueLabel: string;
  falseLabel: string;
  defaultValue: boolean;
}

export interface StringInput extends BaseInput {
  defaultValue?: string;
}

export interface EnumInput extends BaseInput {
  choices: EnumItem[];
  defaultKey: string;
}

export type AnyInput = NumberInput | BooleanInput | StringInput | EnumInput;

export interface Node {
  id: string;
  info?: string;
  input? : AnyInput;
  children?: Node[];
}

export interface Descriptor {
  root: Node;
}

export type Callbacks = (newValues: {[dataFieldName: string]: InputType }) => void;

export interface UxRendererComponentProps {
  descriptor: Descriptor;
  callbacks: Callbacks;
}

interface UxRendererComponentState {
  currentValues: Map<string, InputType>;
}

export class UxRendererComponent extends React.Component<UxRendererComponentProps, UxRendererComponentState> {
  constructor(props: UxRendererComponentProps) {
    super(props);
    this.state = {
      currentValues: new Map()
    };
  }

  private renderInfo(info: string): JSX.Element {
    return <div>{info}</div>;
  }

  private onInputChange = (newValue: string | number | boolean, dataFieldName: string): string | number | number => {
    const { currentValues } = this.state;
    currentValues.set(dataFieldName, newValue);
    this.setState({ currentValues });
    return newValue;
  };

  private renderStringInput(input: StringInput): JSX.Element {
    return <>
      <label htmlFor={`${input.dataFieldName}-input`}>{input.label}</label>
      <input
        id={`${input.dataFieldName}-input`}
        type="text"
        value={input.defaultValue}
        placeholder={input.placeholder}
        onChange={e => this.onInputChange(e.target.value, input.dataFieldName)}
      />
    </>;
  }

  private renderNumberInput(input: NumberInput): JSX.Element {
    const { label, min, max, defaultValue, dataFieldName } = input;
    const props = { label, min, max, ariaLabel: label };

    if (input.inputType === "spin") {
      return <SpinButton
        {...props}
        defaultValue={defaultValue.toString()}
        // value={this.state.currentValues.has(dataFieldName) ?
        //   (this.state.currentValues.get(dataFieldName) as number).toString() : defaultValue.toString()}
        step={1}
        onValidate={undefined}
        onIncrement={newValue => this.onInputChange(Number.parseInt(newValue) + 1, dataFieldName).toString()}
        onDecrement={newValue => this.onInputChange(Number.parseInt(newValue) - 1, dataFieldName).toString()}
      />;
    } else if (input.inputType === "slider") {
      return <Slider
        // showValue={true}
        // valueFormat={}
        {...props}
        defaultValue={defaultValue}
        onChange={newValue => this.onInputChange(newValue, dataFieldName)}
      />
    } else {
      return <>Unsupported number input type {input.inputType}</>;
    }
  }

  private renderBooleanInput(input: BooleanInput): JSX.Element {
    const { dataFieldName } = input;
    return <>
      <label>{input.label}</label>
      <RadioSwitchComponent
        choices={[
          {
            label: input.falseLabel,
            key: "false",
            onSelect: () => this.onInputChange(false, dataFieldName)
          },
          {
            label: input.trueLabel,
            key: "true",
            onSelect: () => this.onInputChange(true, dataFieldName)
          }
        ]}
        selectedKey={(this.state.currentValues.has(dataFieldName) ?
          (this.state.currentValues.get(dataFieldName) as boolean) : input.defaultValue) ? "true" : "false"}
      />
    </>;
  }

  private renderInput(input: AnyInput): JSX.Element {
    switch(input.type) {
      case "string":
        return this.renderStringInput(input as StringInput);
      case "number":
        return this.renderNumberInput(input as NumberInput);
      case "boolean":
        return this.renderBooleanInput(input as BooleanInput);
      default:
        return <>Unknown type{input.type}</>
    }
  }

  private renderNode(node: Node): JSX.Element {
    return <>
      {node.info && this.renderInfo(node.info)}
      {node.input && this.renderInput(node.input)}
      {node.children && node.children.map(child => (<div key={child.id}>{this.renderNode(child)}</div>))}
    </>;
  }

  render(): JSX.Element {
    return <>{this.renderNode(this.props.descriptor.root)}</>;
  }
}



/******************************** Test code *************************** */
export const TestUxRendererComponent: React.FunctionComponent = () => {
  const exampleData: Descriptor = {
    root: {
      id: "root",
      info: "Start at $24/mo per database",
      children: [
        {
          id: "throughput",
          input: {
            label: "Throughput (input)",
            dataFieldName: "throughput",
            type: "number",
            min: 400,
            max: 1000000,
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
            max: 1000000,
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
            ]
          }
        }
      ]
    }
  };

  const exampleCallbacks: Callbacks = (newValues: { [dataFieldName: string]: InputType }): void => {
    console.log("New values:", newValues);
  };

  return <div style={{ padding: 20 }}>
    <UxRendererComponent descriptor={exampleData} callbacks={exampleCallbacks} />
  </div>;
}

