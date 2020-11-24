import * as React from "react";
import { Position } from "office-ui-fabric-react/lib/utilities/positioning";
import { Slider } from "office-ui-fabric-react/lib/Slider";
import { SpinButton } from "office-ui-fabric-react/lib/SpinButton";
import { Dropdown, IDropdownOption } from "office-ui-fabric-react/lib/Dropdown";
import { TextField } from "office-ui-fabric-react/lib/TextField";
import { Text } from "office-ui-fabric-react/lib/Text";
import { InputType } from "../../Tables/Constants";
import { RadioSwitchComponent } from "../RadioSwitchComponent/RadioSwitchComponent";
import { Stack, IStackTokens } from "office-ui-fabric-react/lib/Stack";
import { Link, MessageBar, MessageBarType } from "office-ui-fabric-react";

import * as InputUtils from "./InputUtils";
import "./SmartUiComponent.less";

/**
 * Generic UX renderer
 * It takes:
 * - a JSON object as data
 * - a Map of callbacks
 * - a descriptor of the UX.
 */

export type InputTypeValue = "number" | "string" | "boolean" | "enum";

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export type EnumItem = { label: string; key: string; value: any };

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

export interface Info {
  message: string;
  link?: {
    href: string;
    text: string;
  };
}

export type AnyInput = NumberInput | BooleanInput | StringInput | EnumInput;

export interface Node {
  id: string;
  info?: Info;
  input?: AnyInput;
  children?: { [id: string]: Node} ;
}

export interface Descriptor {
  root: Node;
}

/************************** Component implementation starts here ************************************* */

export interface SmartUiComponentProps {
  descriptor: Descriptor;
  onChange: (newValues: Map<string, InputType>) => void;
}

interface SmartUiComponentState {
  currentValues: Map<string, InputType>;
  errors: Map<string, string>;
}

export class SmartUiComponent extends React.Component<SmartUiComponentProps, SmartUiComponentState> {
  private static readonly labelStyle = {
    color: "#393939",
    fontFamily: "wf_segoe-ui_normal, 'Segoe UI', 'Segoe WP', Tahoma, Arial, sans-serif",
    fontSize: 12
  };

  constructor(props: SmartUiComponentProps) {
    super(props);
    this.state = {
      currentValues: new Map(),
      errors: new Map()
    };
  }

  private renderInfo(info: Info): JSX.Element {
    return (
      <MessageBar>
        {info.message}
        <Link href={info.link.href} target="_blank">
          {info.link.text}
        </Link>
      </MessageBar>
    );
  }

  private onInputChange = (newValue: string | number | boolean, dataFieldName: string) => {
    const { currentValues } = this.state;
    currentValues.set(dataFieldName, newValue);
    this.setState({ currentValues }, () => this.props.onChange(this.state.currentValues));
  };

  private renderStringInput(input: StringInput): JSX.Element {
    return (
      <div className="stringInputContainer">
        <div>
          <TextField
            id={`${input.dataFieldName}-input`}
            label={input.label}
            type="text"
            value={input.defaultValue}
            placeholder={input.placeholder}
            onChange={(_, newValue) => this.onInputChange(newValue, input.dataFieldName)}
            styles={{
              subComponentStyles: {
                label: {
                  root: {
                    ...SmartUiComponent.labelStyle,
                    fontWeight: 600
                  }
                }
              }
            }}
          />
        </div>
      </div>
    );
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
  };

  private onIncrement = (value: string, step: number, max: number, dataFieldName: string): string => {
    const newValue = InputUtils.onIncrementValue(value, step, max);
    if (newValue) {
      this.onInputChange(newValue, dataFieldName);
      this.clearError(dataFieldName);
      return newValue.toString();
    }
    return undefined;
  };

  private onDecrement = (value: string, step: number, min: number, dataFieldName: string): string => {
    const newValue = InputUtils.onDecrementValue(value, step, min);
    if (newValue) {
      this.onInputChange(newValue, dataFieldName);
      this.clearError(dataFieldName);
      return newValue.toString();
    }
    return undefined;
  };

  private renderNumberInput(input: NumberInput): JSX.Element {
    const { label, min, max, defaultValue, dataFieldName, step } = input;
    const props = { label, min, max, ariaLabel: label, step };

    if (input.inputType === "spin") {
      return (
        <div>
          <SpinButton
            {...props}
            defaultValue={defaultValue.toString()}
            onValidate={newValue => this.onValidate(newValue, min, max, dataFieldName)}
            onIncrement={newValue => this.onIncrement(newValue, step, max, dataFieldName)}
            onDecrement={newValue => this.onDecrement(newValue, step, min, dataFieldName)}
            labelPosition={Position.top}
            styles={{
              label: {
                ...SmartUiComponent.labelStyle,
                fontWeight: 600
              }
            }}
          />
          {this.state.errors.has(dataFieldName) && (
            <MessageBar messageBarType={MessageBarType.error}>Error: {this.state.errors.get(dataFieldName)}</MessageBar>
          )}
        </div>
      );
    } else if (input.inputType === "slider") {
      return (
        <Slider
          // showValue={true}
          // valueFormat={}
          {...props}
          defaultValue={defaultValue}
          onChange={newValue => this.onInputChange(newValue, dataFieldName)}
          styles={{
            titleLabel: {
              ...SmartUiComponent.labelStyle,
              fontWeight: 600
            },
            valueLabel: SmartUiComponent.labelStyle
          }}
        />
      );
    } else {
      return <>Unsupported number input type {input.inputType}</>;
    }
  }

  private renderBooleanInput(input: BooleanInput): JSX.Element {
    const { dataFieldName } = input;
    return (
      <div>
        <div className="inputLabelContainer">
          <Text variant="small" nowrap className="inputLabel">
            {input.label}
          </Text>
        </div>
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
          selectedKey={
            (this.state.currentValues.has(dataFieldName)
            ? (this.state.currentValues.get(dataFieldName) as boolean)
            : input.defaultValue)
              ? "true"
              : "false"
          }
        />
      </div>
    );
  }

  private renderEnumInput(input: EnumInput): JSX.Element {
    const { label, defaultKey, dataFieldName, choices, placeholder } = input;
    return (
      <Dropdown
        label={label}
        selectedKey={
          this.state.currentValues.has(dataFieldName)
            ? (this.state.currentValues.get(dataFieldName) as string)
            : defaultKey
        }
        onChange={(_, item: IDropdownOption) => this.onInputChange(item.key.toString(), dataFieldName)}
        placeholder={placeholder}
        options={choices.map(c => ({
          key: c.key,
          text: c.value
        }))}
        styles={{
          label: {
            ...SmartUiComponent.labelStyle,
            fontWeight: 600
          },
          dropdown: SmartUiComponent.labelStyle
        }}
      />
    );
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
        throw new Error(`Unknown input type: ${input.type}`);
    }
  }

  private renderNode(node: Node): JSX.Element {
    const containerStackTokens: IStackTokens = { childrenGap: 10 };

    return (
      <Stack tokens={containerStackTokens} className="widgetRendererContainer">
        {node.info && this.renderInfo(node.info)}
        {node.input && this.renderInput(node.input)}
        {node.children && Object.entries(node.children).map(([key, value]) => {
        return <div key={key}>{this.renderNode(value as Node)}</div>
      })
      }
      </Stack>
    );
  }

  render(): JSX.Element {
    return <>{this.renderNode(this.props.descriptor.root)}</>;
  }
}
