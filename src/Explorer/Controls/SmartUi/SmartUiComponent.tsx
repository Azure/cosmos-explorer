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

export enum UiType {
  Spinner = "Spinner",
  Slider = "Slider"
}

type numberPromise = () => Promise<number>;
type stringPromise = () => Promise<string>;
type dropdownItemPromise = () => Promise<DropdownItem[]>;
type infoPromise = () => Promise<Info>;

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export type DropdownItem = { label: string; key: string };

export type InputType = number | string | boolean | DropdownItem | JSX.Element;

export interface BaseInput {
  label: (() => Promise<string>) | string;
  dataFieldName: string;
  type: InputTypeValue;
  onChange?: (currentState: Map<string, InputType>, newValue: InputType) => Map<string, InputType>;
  placeholder?: (() => Promise<string>) | string;
  errorMessage?: string;
}

/**
 * For now, this only supports integers
 */
export interface NumberInput extends BaseInput {
  min: (() => Promise<number>) | number;
  max: (() => Promise<number>) | number;
  step: (() => Promise<number>) | number;
  defaultValue?: number;
  uiType: UiType;
}

export interface BooleanInput extends BaseInput {
  trueLabel: (() => Promise<string>) | string;
  falseLabel: (() => Promise<string>) | string;
  defaultValue?: boolean;
}

export interface StringInput extends BaseInput {
  defaultValue?: string;
}

export interface DropdownInput extends BaseInput {
  choices: (() => Promise<DropdownItem[]>) | DropdownItem[];
  defaultKey?: string;
}

export interface Info {
  message: string;
  link?: {
    href: string;
    text: string;
  };
}

export type AnyInput = NumberInput | BooleanInput | StringInput | DropdownInput;

export interface Node {
  id: string;
  info?: (() => Promise<Info>) | Info;
  input?: AnyInput;
  children?: Node[];
}

export interface Descriptor {
  root: Node;
  initialize?: () => Promise<Map<string, InputType>>;
  onSubmit?: (currentValues: Map<string, InputType>) => Promise<void>;
  inputNames?: string[];
}

/************************** Component implementation starts here ************************************* */

export interface SmartUiComponentProps {
  descriptor: Descriptor;
}

interface SmartUiComponentState {
  currentValues: Map<string, InputType>;
  baselineValues: Map<string, InputType>;
  errors: Map<string, string>;
  isRefreshing: boolean;
}

export class SmartUiComponent extends React.Component<SmartUiComponentProps, SmartUiComponentState> {
  private static readonly labelStyle = {
    color: "#393939",
    fontFamily: "wf_segoe-ui_normal, 'Segoe UI', 'Segoe WP', Tahoma, Arial, sans-serif",
    fontSize: 12
  };

  componentDidMount(): void {
    this.setDefaultValues();
  }

  constructor(props: SmartUiComponentProps) {
    super(props);
    this.state = {
      baselineValues: new Map(),
      currentValues: new Map(),
      errors: new Map(),
      isRefreshing: false
    };
  }

  private setDefaultValues = async (): Promise<void> => {
    this.setState({ isRefreshing: true });
    await this.setDefaults(this.props.descriptor.root);
    this.setState({ isRefreshing: false });
    await this.initialize();
  };

  private initialize = async (): Promise<void> => {
    this.setState({ isRefreshing: true });
    let { currentValues, baselineValues } = this.state;
    const initialValues = await this.props.descriptor.initialize();
    for (const key of initialValues.keys()) {
      if (this.props.descriptor.inputNames.indexOf(key) === -1) {
        console.log(this.props.descriptor.inputNames);
        this.setState({ isRefreshing: false });
        throw new Error(`${key} is not an input property of this class.`);
      }
      currentValues = currentValues.set(key, initialValues.get(key));
      baselineValues = baselineValues.set(key, initialValues.get(key));
    }
    this.setState({ currentValues: currentValues, baselineValues: baselineValues, isRefreshing: false });
  };

  private discard = (): void => {
    let { currentValues } = this.state;
    const { baselineValues } = this.state;
    for (const key of baselineValues.keys()) {
      currentValues = currentValues.set(key, baselineValues.get(key));
    }
    this.setState({ currentValues: currentValues });
  };

  private setDefaults = async (currentNode: Node): Promise<void> => {
    if (currentNode.info && currentNode.info instanceof Function) {
      currentNode.info = await (currentNode.info as infoPromise)();
    }

    if (currentNode.input) {
      currentNode.input = await this.getModifiedInput(currentNode.input);
    }
    const promises = currentNode.children?.map(async (child: Node) => await this.setDefaults(child));
    if (promises) {
      await Promise.all(promises);
    }
  };

  private getModifiedInput = async (input: AnyInput): Promise<AnyInput> => {
    if (input.label instanceof Function) {
      input.label = await (input.label as stringPromise)();
    }

    if (input.placeholder instanceof Function) {
      input.placeholder = await (input.placeholder as stringPromise)();
    }

    switch (input.type) {
      case "string": {
        return input as StringInput;
      }
      case "number": {
        const numberInput = input as NumberInput;
        if (numberInput.min instanceof Function) {
          numberInput.min = await (numberInput.min as numberPromise)();
        }
        if (numberInput.max instanceof Function) {
          numberInput.max = await (numberInput.max as numberPromise)();
        }
        if (numberInput.step instanceof Function) {
          numberInput.step = await (numberInput.step as numberPromise)();
        }
        return numberInput;
      }
      case "boolean": {
        const booleanInput = input as BooleanInput;
        if (booleanInput.trueLabel instanceof Function) {
          booleanInput.trueLabel = await (booleanInput.trueLabel as stringPromise)();
        }
        if (booleanInput.falseLabel instanceof Function) {
          booleanInput.falseLabel = await (booleanInput.falseLabel as stringPromise)();
        }
        return booleanInput;
      }
      default: {
        const enumInput = input as DropdownInput;
        if (enumInput.choices instanceof Function) {
          enumInput.choices = await (enumInput.choices as dropdownItemPromise)();
        }
        return enumInput;
      }
    }
  };

  private getDefaultValue = (input: AnyInput): InputType => {
    switch (input.type) {
      case "string": {
        const stringInput = input as StringInput;
        return stringInput.defaultValue ? (stringInput.defaultValue as string) : "";
      }
      case "number": {
        return (input as NumberInput).defaultValue as number;
      }
      case "boolean": {
        return (input as BooleanInput).defaultValue as boolean;
      }
      default: {
        return (input as DropdownInput).defaultKey as string;
      }
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
    const value = this.state.currentValues.get(input.dataFieldName) as string;
    return (
      <div className="stringInputContainer">
        <div>
          <TextField
            id={`${input.dataFieldName}-input`}
            label={input.label as string}
            type="text"
            value={value}
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
    const { label, min, max, dataFieldName, step } = input;
    const props = {
      label: label as string,
      min: min as number,
      max: max as number,
      ariaLabel: label as string,
      step: step as number
    };

    const value = this.state.currentValues.get(dataFieldName) as number;
    if (input.uiType === UiType.Spinner) {
      return (
        <div>
          <SpinButton
            {...props}
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
        </div>
      );
    } else if (input.uiType === UiType.Slider) {
      return (
        <Slider
          {...props}
          value={value}
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
      return <>Unsupported number UI type {input.uiType}</>;
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

  private renderEnumInput(input: DropdownInput): JSX.Element {
    const { label, defaultKey: defaultKey, dataFieldName, choices, placeholder } = input;
    return (
      <Dropdown
        label={label as string}
        selectedKey={
          this.state.currentValues.has(dataFieldName)
            ? (this.state.currentValues.get(dataFieldName) as string)
            : (defaultKey as string)
        }
        onChange={(_, item: IDropdownOption) => this.onInputChange(input, item.key.toString())}
        placeholder={placeholder as string}
        options={(choices as DropdownItem[]).map(c => ({
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
        return this.renderStringInput(input as StringInput);
      case "number":
        return this.renderNumberInput(input as NumberInput);
      case "boolean":
        return this.renderBooleanInput(input as BooleanInput);
      default:
        return this.renderEnumInput(input as DropdownInput);
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
    return !this.state.isRefreshing ? (
      <div style={{ overflowX: "auto" }}>
        <Stack tokens={containerStackTokens} styles={{ root: { width: 400, padding: 10 } }}>
          {this.renderNode(this.props.descriptor.root)}
          <Stack horizontal tokens={{ childrenGap: 10 }}>
            <PrimaryButton
              styles={{ root: { width: 100 } }}
              text="submit"
              onClick={async () => {
                await this.props.descriptor.onSubmit(this.state.currentValues);
                this.initialize();
              }}
            />
            <PrimaryButton styles={{ root: { width: 100 } }} text="discard" onClick={() => this.discard()} />
          </Stack>
        </Stack>
      </div>
    ) : (
      <Spinner
        size={SpinnerSize.large}
        styles={{ root: { textAlign: "center", justifyContent: "center", width: "100%", height: "100%" } }}
      />
    );
  }
}
