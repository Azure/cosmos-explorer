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
import { Link, MessageBar, MessageBarType, PrimaryButton, Spinner, SpinnerSize } from "office-ui-fabric-react";

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

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export type ChoiceItem = { label: string; key: string; value: any };

export type InputType = Number | String | Boolean | ChoiceItem;

interface BaseInput {
  label: (() => Promise<string>) | string;
  dataFieldName: string;
  type: InputTypeValue;
  onChange?: (currentState: Map<string, InputType>, newValue: InputType) => Map<string, InputType>;
  placeholder?: (() => Promise<string>) | string;
}

/**
 * For now, this only supports integers
 */
export interface NumberInput extends BaseInput {
  min?: (() => Promise<number>) | number;
  max?: (() => Promise<number>) | number
  step: (() => Promise<number>) | number
  defaultValue: (() => Promise<number>) | number
  inputType: "spin" | "slider";
}

export interface BooleanInput extends BaseInput {
  trueLabel: (() => Promise<string>) | string;
  falseLabel: (() => Promise<string>) | string;
  defaultValue: (() => Promise<boolean>) | boolean;
}

export interface StringInput extends BaseInput {
  defaultValue?: (() => Promise<string>) | string;
}

export interface ChoiceInput extends BaseInput {
  choices: (() => Promise<ChoiceItem[]>) | ChoiceItem[];
  defaultKey: (() => Promise<string>) | string;
}

export interface Info {
  message: string;
  link?: {
    href: string;
    text: string;
  };
}

export type AnyInput = NumberInput | BooleanInput | StringInput | ChoiceInput;

export interface Node {
  id: string;
  info?: (() => Promise<Info>) | Info;
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
      currentValues: undefined,
      errors: new Map()
    };

    this.setDefaultValues()
  }

  private setDefaultValues = async () : Promise<void> => {
    const defaults = new Map<string, InputType>()
    await this.setDefaults(this.props.descriptor.root, defaults)
    this.setState({currentValues: defaults})
  }

  private setDefaults = async (currentNode: Node, defaults: Map<string, InputType>) : Promise<void> => {
    if (currentNode.info && currentNode.info instanceof Function) {
      currentNode.info = await (currentNode.info as Function)()
    }

    if (currentNode.input) {
      currentNode.input = await this.getModifiedInput(currentNode.input)
      defaults.set(currentNode.input.dataFieldName, this.getDefaultValue(currentNode.input));
    }

    await Promise.all(currentNode.children?.map(async (child: Node) => await this.setDefaults(child, defaults)));
  };

  private getModifiedInput = async (input: AnyInput): Promise<AnyInput> => {

    if (input.label instanceof Function) {
      input.label = await (input.label as Function)()
    }

    if (input.placeholder instanceof Function) {
      input.placeholder = await (input.placeholder as Function)()
    }

    switch (input.type) {
      case "string":
        const stringInput = input as StringInput
        if (stringInput.defaultValue instanceof Function) {
          stringInput.defaultValue = await (stringInput.defaultValue as Function)()
        }
        return stringInput;
      case "number":
        const numberInput = input as NumberInput
        if (numberInput.defaultValue instanceof Function) {
          numberInput.defaultValue = await (numberInput.defaultValue as Function)()
        }
        if (numberInput.min instanceof Function) {
          numberInput.min = await (numberInput.min as Function)()
        }
        if (numberInput.max instanceof Function) {
          numberInput.max = await (numberInput.max as Function)()
        }
        if (numberInput.step instanceof Function) {
          numberInput.step = await (numberInput.step as Function)()
        }
        return numberInput;
      case "boolean":
        const booleanInput = input as BooleanInput
        if (booleanInput.defaultValue instanceof Function) {
          booleanInput.defaultValue = await (booleanInput.defaultValue as Function)()
        }
        if (booleanInput.trueLabel instanceof Function) {
          booleanInput.trueLabel = await (booleanInput.trueLabel as Function)()
        }
        if (booleanInput.falseLabel instanceof Function) {
          booleanInput.falseLabel = await (booleanInput.falseLabel as Function)()
        }
        return booleanInput;
      default:
        const enumInput = input as ChoiceInput
        if (enumInput.defaultKey instanceof Function) {
          enumInput.defaultKey = await (enumInput.defaultKey as Function)()
        }
        if (enumInput.choices instanceof Function) {
          enumInput.choices = await (enumInput.choices as Function)()
        }
        return enumInput
    }
  };

  private getDefaultValue = (input: AnyInput): InputType => {
    switch (input.type) {
      case "string":
        return (input as StringInput).defaultValue as string;
      case "number":
        return (input as NumberInput).defaultValue as number;
      case "boolean":
        return (input as BooleanInput).defaultValue as boolean;
      default:
        return (input as ChoiceInput).defaultKey as string;
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
            label={input.label as string}
            type="text"
            defaultValue={input.defaultValue as string}
            placeholder={input.placeholder as string}
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
    const props = { 
      label: label as string, 
      min: min as number, 
      max: max as number, 
      ariaLabel: label as string, 
      step: step as number 
    };

    if (input.inputType === "spin") {
      return (
        <div>
          <SpinButton
            {...props}
            defaultValue={(defaultValue as number).toString()}
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
        </div>
      );
    } else if (input.inputType === "slider") {
      return (
        <Slider
          // showValue={true}
          // valueFormat={}
          {...props}
          defaultValue={defaultValue as number}
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
              label: input.falseLabel as string,
              key: "false",
              onSelect: () => this.onInputChange(input, false)
            },
            {
              label: input.trueLabel as string,
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

  private renderEnumInput(input: ChoiceInput): JSX.Element {
    const { label, defaultKey: defaultKey, dataFieldName, choices, placeholder } = input;
    return (
      <Dropdown
        label={label as string}
        selectedKey={
          this.state.currentValues.has(dataFieldName)
            ? (this.state.currentValues.get(dataFieldName) as string)
            : defaultKey as string
        }
        onChange={(_, item: IDropdownOption) => this.onInputChange(input, item.key.toString())}
        placeholder={placeholder as string}
        options={(choices as ChoiceItem[]).map(c => ({
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
      default:
        return this.renderEnumInput(input as ChoiceInput);
    }
  }

  private renderNode(node: Node): JSX.Element {
    const containerStackTokens: IStackTokens = { childrenGap: 10 };

    return (
      <Stack tokens={containerStackTokens} className="widgetRendererContainer">
        {node.info && this.renderInfo(node.info as Info)}
        {node.input && this.renderInput(node.input)}
        {node.children && node.children.map(child => <div key={child.id}>{this.renderNode(child)}</div>)}
      </Stack>
    );
  }

  render(): JSX.Element {
    const containerStackTokens: IStackTokens = { childrenGap: 20 };
    return (
      this.state.currentValues && this.state.currentValues.size ?
      <Stack tokens={containerStackTokens}>
        {this.renderNode(this.props.descriptor.root)}
        <PrimaryButton
          styles={{ root: { width: 100 } }}
          text="submit"
          onClick={async () => await this.props.descriptor.onSubmit(this.state.currentValues)}
        />
      </Stack>
      :
      <Spinner size={SpinnerSize.large} />
    );
  }
}
