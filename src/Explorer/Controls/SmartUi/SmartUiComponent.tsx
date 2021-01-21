import * as React from "react";
import { Position } from "office-ui-fabric-react/lib/utilities/positioning";
import { Slider } from "office-ui-fabric-react/lib/Slider";
import { SpinButton } from "office-ui-fabric-react/lib/SpinButton";
import { Dropdown, IDropdownOption } from "office-ui-fabric-react/lib/Dropdown";
import { TextField } from "office-ui-fabric-react/lib/TextField";
import { Text } from "office-ui-fabric-react/lib/Text";
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

export type InputTypeValue = "number" | "string" | "boolean" | "object";

export enum UiType {
  Spinner = "Spinner",
  Slider = "Slider"
}

export type ChoiceItem = { label: string; key: string };

export type InputType = number | string | boolean | ChoiceItem;

export interface Info {
  message: string;
  link?: {
    href: string;
    text: string;
  };
}

interface BaseInput {
  label: string;
  dataFieldName: string;
  type: InputTypeValue;
  placeholder?: string;
  errorMessage?: string;
}

/**
 * For now, this only supports integers
 */
interface NumberInput extends BaseInput {
  min: number;
  max: number;
  step: number;
  defaultValue?: number;
  uiType: UiType;
}

interface BooleanInput extends BaseInput {
  trueLabel: string;
  falseLabel: string;
  defaultValue?: boolean;
}

interface StringInput extends BaseInput {
  defaultValue?: string;
}

interface ChoiceInput extends BaseInput {
  choices: ChoiceItem[];
  defaultKey?: string;
}

type AnyInput = NumberInput | BooleanInput | StringInput | ChoiceInput;

interface Node {
  id: string;
  info?: Info;
  input?: AnyInput;
  children?: Node[];
}

export interface SmartUiDescriptor {
  root: Node;
}

/************************** Component implementation starts here ************************************* */

export interface SmartUiComponentProps {
  descriptor: SmartUiDescriptor;
  currentValues: Map<string, InputType>;
  onInputChange: (input: AnyInput, newValue: InputType) => void;
}

interface SmartUiComponentState {
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
      errors: new Map()
    };
  }

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

  private renderTextInput(input: StringInput): JSX.Element {
    const value = this.props.currentValues.get(input.dataFieldName) as string;
    return (
      <div className="stringInputContainer">
        <TextField
          id={`${input.dataFieldName}-textBox-input`}
          label={input.label}
          type="text"
          value={value}
          placeholder={input.placeholder}
          onChange={(_, newValue) => this.props.onInputChange(input, newValue)}
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
      this.props.onInputChange(input, newValue);
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
      this.props.onInputChange(input, newValue);
      this.clearError(dataFieldName);
      return newValue.toString();
    }
    return undefined;
  };

  private onDecrement = (input: AnyInput, value: string, step: number, min: number): string => {
    const newValue = InputUtils.onDecrementValue(value, step, min);
    const dataFieldName = input.dataFieldName;
    if (newValue) {
      this.props.onInputChange(input, newValue);
      this.clearError(dataFieldName);
      return newValue.toString();
    }
    return undefined;
  };

  private renderNumberInput(input: NumberInput): JSX.Element {
    const { label, min, max, dataFieldName, step } = input;
    const props = {
      label: label,
      min: min,
      max: max,
      ariaLabel: label,
      step: step
    };

    const value = this.props.currentValues.get(dataFieldName) as number;
    if (input.uiType === UiType.Spinner) {
      return (
        <>
          <SpinButton
            {...props}
            id={`${input.dataFieldName}-spinner-input`}
            value={value?.toString()}
            onValidate={newValue => this.onValidate(input, newValue, props.min, props.max)}
            onIncrement={newValue => this.onIncrement(input, newValue, props.step, props.max)}
            onDecrement={newValue => this.onDecrement(input, newValue, props.step, props.min)}
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
        </>
      );
    } else if (input.uiType === UiType.Slider) {
      return (
        <div id={`${input.dataFieldName}-slider-input`}>
          <Slider
            {...props}
            value={value}
            onChange={newValue => this.props.onInputChange(input, newValue)}
            styles={{
              titleLabel: {
                ...SmartUiComponent.labelStyle,
                fontWeight: 600
              },
              valueLabel: SmartUiComponent.labelStyle
            }}
          />
        </div>
      );
    } else {
      return <>Unsupported number UI type {input.uiType}</>;
    }
  }

  private renderBooleanInput(input: BooleanInput): JSX.Element {
    const value = this.props.currentValues.get(input.dataFieldName) as boolean;
    const selectedKey = value || input.defaultValue ? "true" : "false";
    return (
      <div id={`${input.dataFieldName}-radioSwitch-input`}>
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
              onSelect: () => this.props.onInputChange(input, false)
            },
            {
              label: input.trueLabel,
              key: "true",
              onSelect: () => this.props.onInputChange(input, true)
            }
          ]}
          selectedKey={selectedKey}
        />
      </div>
    );
  }

  private renderChoiceInput(input: ChoiceInput): JSX.Element {
    const { label, defaultKey: defaultKey, dataFieldName, choices, placeholder } = input;
    const value = this.props.currentValues.get(dataFieldName) as string;
    return (
      <Dropdown
        id={`${input.dataFieldName}-dropown-input`}
        label={label}
        selectedKey={value ? value : defaultKey}
        onChange={(_, item: IDropdownOption) => this.props.onInputChange(input, item.key.toString())}
        placeholder={placeholder}
        options={choices.map(c => ({
          key: c.key,
          text: c.label
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

  private renderError(input: AnyInput): JSX.Element {
    return <MessageBar messageBarType={MessageBarType.error}>Error: {input.errorMessage}</MessageBar>;
  }

  private renderInput(input: AnyInput): JSX.Element {
    if (input.errorMessage) {
      return this.renderError(input);
    }
    switch (input.type) {
      case "string":
        return this.renderTextInput(input as StringInput);
      case "number":
        return this.renderNumberInput(input as NumberInput);
      case "boolean":
        return this.renderBooleanInput(input as BooleanInput);
      case "object":
        return this.renderChoiceInput(input as ChoiceInput);
      default:
        throw new Error(`Unknown input type: ${input.type}`);
    }
  }

  private renderNode(node: Node): JSX.Element {
    const containerStackTokens: IStackTokens = { childrenGap: 15 };

    return (
      <Stack tokens={containerStackTokens} className="widgetRendererContainer">
        <Stack.Item>
          {node.info && this.renderInfo(node.info as Info)}
          {node.input && this.renderInput(node.input)}
        </Stack.Item>
        {node.children && node.children.map(child => <div key={child.id}>{this.renderNode(child)}</div>)}
      </Stack>
    );
  }

  render(): JSX.Element {
    const containerStackTokens: IStackTokens = { childrenGap: 20 };
    return (
      <Stack tokens={containerStackTokens} styles={{ root: { width: 400, padding: 10 } }}>
        {this.renderNode(this.props.descriptor.root)}
      </Stack>
    );
  }
}
