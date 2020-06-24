import * as React from "react";
import { Slider } from "office-ui-fabric-react/lib/Slider";
import { SpinButton } from "office-ui-fabric-react/lib/SpinButton";
import { Dropdown, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import { InputType } from "../../Tables/Constants";
import { RadioSwitchComponent } from "../RadioSwitchComponent/RadioSwitchComponent";
import * as InputUtils from "./InputUtils";

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
  step: number;
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

export interface WidgetRendererComponentProps {
  descriptor: Descriptor;
  onChange: (newValues: Map<string, InputType>) => void;
}

interface WidggetRendererComponentState {
  currentValues: Map<string, InputType>;
  errors: Map<string, string>;
}

export class WidgetRendererComponent extends React.Component<WidgetRendererComponentProps, WidggetRendererComponentState> {
  constructor(props: WidgetRendererComponentProps) {
    super(props);
    this.state = {
      currentValues: new Map(),
      errors: new Map()
    };
  }

  private renderInfo(info: string): JSX.Element {
    return <div>{info}</div>;
  }

  private onInputChange = (newValue: string | number | boolean, dataFieldName: string) => {
    const { currentValues } = this.state;
    currentValues.set(dataFieldName, newValue);
    this.setState({ currentValues }, () => this.props.onChange(this.state.currentValues));
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

  private clearError(dataFieldName: string): void {
    const { errors } = this.state;
    errors.delete(dataFieldName);
    this.setState({ errors });
  }

  private onValidate = (value: string, min: number, max: number, dataFieldName: string): string => {
    const newValue = InputUtils.onValidateValueChange(value, min, max);
    if (newValue) {
      this.onInputChange(newValue, dataFieldName);
      this.clearError(dataFieldName);
      return newValue.toString();
    } else {
      const { errors } = this.state;
      errors.set(dataFieldName, `Invalid value ${value}: must be between ${min} and ${max}`);
      this.setState({ errors });
    }
    return undefined;
  }

  private onIncrement = (value: string, step: number, max: number, dataFieldName: string): string => {
    const newValue = InputUtils.onIncrementValue(value, step, max);
    if (newValue) {
      this.onInputChange(newValue, dataFieldName);
      this.clearError(dataFieldName);
      return newValue.toString();
    }
    return undefined;
  }

  private onDecrement = (value: string, step: number, min: number, dataFieldName: string): string => {
    const newValue = InputUtils.onDecrementValue(value, step, min);
    if (newValue) {
      this.onInputChange(newValue, dataFieldName);
      this.clearError(dataFieldName);
      return newValue.toString();
    }
    return undefined;
  }

  private renderNumberInput(input: NumberInput): JSX.Element {
    const { label, min, max, defaultValue, dataFieldName, step } = input;
    const props = { label, min, max, ariaLabel: label, step };

    if (input.inputType === "spin") {
      return <div><SpinButton
        {...props}
        defaultValue={defaultValue.toString()}
        onValidate={newValue => this.onValidate(newValue, min, max, dataFieldName)}
        onIncrement={newValue => this.onIncrement(newValue, step, max, dataFieldName)}
        onDecrement={newValue => this.onDecrement(newValue, step, min, dataFieldName)}
      />
      {this.state.errors.has(dataFieldName) && <div style={{ color: "red" }}>Error: {this.state.errors.get(dataFieldName)}</div>}
      </div>;
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

  private renderEnumInput(input: EnumInput): JSX.Element {
    const { label, defaultKey, dataFieldName, choices, placeholder } = input;
    return <Dropdown
      label={label}
      selectedKey={this.state.currentValues.has(dataFieldName) ?
        (this.state.currentValues.get(dataFieldName) as string) : defaultKey}
      onChange={(_, item: IDropdownOption) => this.onInputChange(item.key.toString(), dataFieldName)}
      placeholder={placeholder}
      options={choices.map(c => ({
        key: c.key,
        text: c.value
      }))}
    />;
  }

  private renderInput(input: AnyInput): JSX.Element {
    switch (input.type) {
      case "string":
        return this.renderStringInput(input as StringInput);
      case "number":
        return this.renderNumberInput(input as NumberInput);
      case "boolean":
        return this.renderBooleanInput(input as BooleanInput);
      case "enum":
        return this.renderEnumInput(input as EnumInput);
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

  const exampleCallbacks: Callbacks = (newValues: Map<string, InputType>): void => {
    console.log("New values:", newValues);
  };

  return <div style={{ padding: 20, width: 400, backgroundColor: 'pink' }}>
    <WidgetRendererComponent descriptor={exampleData} onChange={exampleCallbacks} />
  </div>;
}

