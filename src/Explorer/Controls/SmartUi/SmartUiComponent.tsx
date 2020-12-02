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
import { Link, MessageBar, MessageBarType, PrimaryButton } from "office-ui-fabric-react";

import * as InputUtils from "./InputUtils";
import "./SmartUiComponent.less";

/**
 * Generic UX renderer
 * It takes:
 * - a JSON object as data
 * - a Map of callbacks
 * - a descriptor of the UX.
 */

export type InputTypeValue = "Number" | "String" | "Boolean" | "Object";

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export type EnumItem = { label: string; key: string; value: any };

export type InputType = Number | String | Boolean | EnumItem;

interface BaseInput {
  label: string;
  dataFieldName: string;
  type: InputTypeValue;
  onChange?: (currentState: Map<string, InputType>, newValue: InputType) => Map<string, InputType>;
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
  children?: Node[];
}

export interface Descriptor {
  root: Node;
  onSubmit: (currentValues: Map<string, InputType>) => Promise<void>;
}

/************************** Component implementation starts here ************************************* */

export interface SmartUiComponentProps {
  descriptor: Descriptor;
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
      currentValues: this.setDefaultValues(),
      errors: new Map()
    };
  }

  private setDefaultValues = (): Map<string, InputType> => {
    const defaults = new Map();
    this.setDefaults(this.props.descriptor.root, defaults);
    return defaults;
  };

  private setDefaults = (currentNode: Node, defaults: Map<string, InputType>) => {
    if (currentNode.input?.dataFieldName) {
      defaults.set(currentNode.input.dataFieldName, this.getDefault(currentNode.input));
    }
    currentNode.children?.map((child: Node) => this.setDefaults(child, defaults));
  };

  private getDefault = (input: AnyInput): InputType => {
    switch (input.type) {
      case "String":
        return (input as StringInput).defaultValue;
      case "Number":
        return (input as NumberInput).defaultValue;
      case "Boolean":
        return (input as BooleanInput).defaultValue;
      default:
        return (input as EnumInput).defaultKey;
    }
  };

  private renderInfo(info: Info): JSX.Element {
    return (
      <MessageBar>
        {info.message}
        {info.link && (
          <Link href={info.link.href} target="_blank">
            {info.link.text}
          </Link>
        )}
      </MessageBar>
    );
  }

  private onInputChange = (input: AnyInput, newValue: InputType) => {
    if (input.onChange) {
      const newValues = input.onChange(this.state.currentValues, newValue);
      this.setState({ currentValues: newValues });
    } else {
      const dataFieldName = input.dataFieldName;
      const { currentValues } = this.state;
      currentValues.set(dataFieldName, newValue);
      this.setState({ currentValues });
    }
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
            onChange={(_, newValue) => this.onInputChange(input, newValue)}
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

  private onValidate = (input: AnyInput, value: string, min: number, max: number): string => {
    const newValue = InputUtils.onValidateValueChange(value, min, max);
    const dataFieldName = input.dataFieldName;
    if (newValue) {
      this.onInputChange(input, newValue);
      this.clearError(dataFieldName);
      return newValue.toString();
    } else {
      const { errors } = this.state;
      errors.set(dataFieldName, `Invalid value ${value}: must be between ${min} and ${max}`);
      this.setState({ errors });
    }
    return undefined;
  };

  private onIncrement = (input: AnyInput, value: string, step: number, max: number): string => {
    const newValue = InputUtils.onIncrementValue(value, step, max);
    const dataFieldName = input.dataFieldName;
    if (newValue) {
      this.onInputChange(input, newValue);
      this.clearError(dataFieldName);
      return newValue.toString();
    }
    return undefined;
  };

  private onDecrement = (input: AnyInput, value: string, step: number, min: number): string => {
    const newValue = InputUtils.onDecrementValue(value, step, min);
    const dataFieldName = input.dataFieldName;
    if (newValue) {
      this.onInputChange(input, newValue);
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
            onValidate={newValue => this.onValidate(input, newValue, min, max)}
            onIncrement={newValue => this.onIncrement(input, newValue, step, max)}
            onDecrement={newValue => this.onDecrement(input, newValue, step, min)}
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
          onChange={newValue => this.onInputChange(input, newValue)}
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
              onSelect: () => this.onInputChange(input, false)
            },
            {
              label: input.trueLabel,
              key: "true",
              onSelect: () => this.onInputChange(input, true)
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
    const { label, defaultKey: defaultKey, dataFieldName, choices, placeholder } = input;
    return (
      <Dropdown
        label={label}
        selectedKey={
          this.state.currentValues.has(dataFieldName)
            ? (this.state.currentValues.get(dataFieldName) as string)
            : defaultKey
        }
        onChange={(_, item: IDropdownOption) => this.onInputChange(input, item.key.toString())}
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
      case "String":
        return this.renderStringInput(input as StringInput);
      case "Number":
        return this.renderNumberInput(input as NumberInput);
      case "Boolean":
        return this.renderBooleanInput(input as BooleanInput);
      default:
        return this.renderEnumInput(input as EnumInput);
    }
  }

  private renderNode(node: Node): JSX.Element {
    const containerStackTokens: IStackTokens = { childrenGap: 10 };

    return (
      <Stack tokens={containerStackTokens} className="widgetRendererContainer">
        {node.info && this.renderInfo(node.info)}
        {node.input && this.renderInput(node.input)}
        {node.children && node.children.map(child => <div key={child.id}>{this.renderNode(child)}</div>)}
      </Stack>
    );
  }

  render(): JSX.Element {
    const containerStackTokens: IStackTokens = { childrenGap: 20 };

    return (
      <Stack tokens={containerStackTokens}>
        {this.renderNode(this.props.descriptor.root)}
        <PrimaryButton
          styles={{ root: { width: 100 } }}
          text="submit"
          onClick={async () => await this.props.descriptor.onSubmit(this.state.currentValues)}
        />
      </Stack>
    );
  }
}
