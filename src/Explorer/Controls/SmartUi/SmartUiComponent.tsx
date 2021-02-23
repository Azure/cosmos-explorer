import * as React from "react";
import { Position } from "office-ui-fabric-react/lib/utilities/positioning";
import { Slider } from "office-ui-fabric-react/lib/Slider";
import { SpinButton } from "office-ui-fabric-react/lib/SpinButton";
import { Dropdown, IDropdownOption } from "office-ui-fabric-react/lib/Dropdown";
import { TextField } from "office-ui-fabric-react/lib/TextField";
import { Text } from "office-ui-fabric-react/lib/Text";
import { Stack, IStackTokens } from "office-ui-fabric-react/lib/Stack";
import { Label, Link, MessageBar, MessageBarType, Toggle } from "office-ui-fabric-react";
import * as InputUtils from "./InputUtils";
import "./SmartUiComponent.less";
import {
  ChoiceItem,
  Description,
  Info,
  InputType,
  InputTypeValue,
  NumberUiType,
  SmartUiInput,
} from "../../../SelfServe/SelfServeTypes";
import { TFunction } from "i18next";

/**
 * Generic UX renderer
 * It takes:
 * - a JSON object as data
 * - a Map of callbacks
 * - a descriptor of the UX.
 */

interface BaseDisplay {
  labelTKey: string;
  dataFieldName: string;
  errorMessage?: string;
  type: InputTypeValue;
}

interface BaseInput extends BaseDisplay {
  placeholderTKey?: string;
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
  uiType: NumberUiType;
}

interface BooleanInput extends BaseInput {
  trueLabelTKey: string;
  falseLabelTKey: string;
  defaultValue?: boolean;
}

interface StringInput extends BaseInput {
  defaultValue?: string;
}

interface ChoiceInput extends BaseInput {
  choices: ChoiceItem[];
  defaultKey?: string;
}

interface DescriptionDisplay extends BaseDisplay {
  description: Description;
}

type AnyDisplay = NumberInput | BooleanInput | StringInput | ChoiceInput | DescriptionDisplay;

interface Node {
  id: string;
  info?: Info;
  input?: AnyDisplay;
  children?: Node[];
}

export interface SmartUiDescriptor {
  root: Node;
}

/************************** Component implementation starts here ************************************* */
export interface SmartUiComponentProps {
  descriptor: SmartUiDescriptor;
  currentValues: Map<string, SmartUiInput>;
  onInputChange: (input: AnyDisplay, newValue: InputType) => void;
  onError: (hasError: boolean) => void;
  disabled: boolean;
  getTranslation: TFunction;
}

interface SmartUiComponentState {
  errors: Map<string, string>;
}

export class SmartUiComponent extends React.Component<SmartUiComponentProps, SmartUiComponentState> {
  private shouldCheckErrors = true;
  private static readonly labelStyle = {
    color: "#393939",
    fontFamily: "wf_segoe-ui_normal, 'Segoe UI', 'Segoe WP', Tahoma, Arial, sans-serif",
    fontSize: 12,
  };

  componentDidUpdate(): void {
    if (!this.shouldCheckErrors) {
      this.shouldCheckErrors = true;
      return;
    }
    this.props.onError(this.state.errors.size > 0);
    this.shouldCheckErrors = false;
  }

  constructor(props: SmartUiComponentProps) {
    super(props);
    this.state = {
      errors: new Map(),
    };
  }

  private renderInfo(info: Info): JSX.Element {
    return (
      <MessageBar styles={{ root: { width: 400 } }}>
        {this.props.getTranslation(info.messageTKey)}
        {info.link && (
          <Link href={info.link.href} target="_blank">
            {this.props.getTranslation(info.link.textTKey)}
          </Link>
        )}
      </MessageBar>
    );
  }

  private renderTextInput(input: StringInput): JSX.Element {
    const value = this.props.currentValues.get(input.dataFieldName)?.value as string;
    const disabled = this.props.disabled || this.props.currentValues.get(input.dataFieldName)?.disabled;
    return (
      <div className="stringInputContainer">
        <TextField
          id={`${input.dataFieldName}-textField-input`}
          label={this.props.getTranslation(input.labelTKey)}
          type="text"
          value={value || ""}
          placeholder={this.props.getTranslation(input.placeholderTKey)}
          disabled={disabled}
          onChange={(_, newValue) => this.props.onInputChange(input, newValue)}
          styles={{
            root: { width: 400 },
            subComponentStyles: {
              label: {
                root: {
                  ...SmartUiComponent.labelStyle,
                  fontWeight: 600,
                },
              },
            },
          }}
        />
      </div>
    );
  }

  private renderDescription(input: DescriptionDisplay): JSX.Element {
    const description = input.description;
    return (
      <>
        {input.labelTKey && <Label>{this.props.getTranslation(input.labelTKey)}</Label>}
        <Text id={`${input.dataFieldName}-text-display`}>
          {this.props.getTranslation(input.description.textTKey)}{" "}
          {description.link && (
            <Link target="_blank" href={input.description.link.href}>
              {this.props.getTranslation(input.description.link.textTKey)}
            </Link>
          )}
        </Text>
      </>
    );
  }

  private clearError(dataFieldName: string): void {
    const { errors } = this.state;
    errors.delete(dataFieldName);
    this.setState({ errors });
  }

  private onValidate = (input: NumberInput, value: string, min: number, max: number): string => {
    const newValue = InputUtils.onValidateValueChange(value, min, max);
    const dataFieldName = input.dataFieldName;
    if (newValue) {
      this.props.onInputChange(input, newValue);
      this.clearError(dataFieldName);
      return newValue.toString();
    } else {
      const { errors } = this.state;
      errors.set(dataFieldName, `Invalid value '${value}'. It must be between ${min} and ${max}`);
      this.setState({ errors });
    }
    return undefined;
  };

  private onIncrement = (input: NumberInput, value: string, step: number, max: number): string => {
    const newValue = InputUtils.onIncrementValue(value, step, max);
    const dataFieldName = input.dataFieldName;
    if (newValue) {
      this.props.onInputChange(input, newValue);
      this.clearError(dataFieldName);
      return newValue.toString();
    }
    return undefined;
  };

  private onDecrement = (input: NumberInput, value: string, step: number, min: number): string => {
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
    const { labelTKey, min, max, dataFieldName, step } = input;
    const props = {
      label: this.props.getTranslation(labelTKey),
      min: min,
      max: max,
      ariaLabel: labelTKey,
      step: step,
    };

    const value = this.props.currentValues.get(dataFieldName)?.value as number;
    const disabled = this.props.disabled || this.props.currentValues.get(dataFieldName)?.disabled;
    if (input.uiType === NumberUiType.Spinner) {
      return (
        <Stack styles={{ root: { width: 400 } }} tokens={{ childrenGap: 2 }}>
          <SpinButton
            {...props}
            id={`${input.dataFieldName}-spinner-input`}
            value={value?.toString()}
            onValidate={(newValue) => this.onValidate(input, newValue, props.min, props.max)}
            onIncrement={(newValue) => this.onIncrement(input, newValue, props.step, props.max)}
            onDecrement={(newValue) => this.onDecrement(input, newValue, props.step, props.min)}
            labelPosition={Position.top}
            disabled={disabled}
            styles={{
              label: {
                ...SmartUiComponent.labelStyle,
                fontWeight: 600,
              },
            }}
          />
          {this.state.errors.has(dataFieldName) && (
            <MessageBar messageBarType={MessageBarType.error}>Error: {this.state.errors.get(dataFieldName)}</MessageBar>
          )}
        </Stack>
      );
    } else if (input.uiType === NumberUiType.Slider) {
      return (
        <div id={`${input.dataFieldName}-slider-input`}>
          <Slider
            {...props}
            value={value}
            disabled={disabled}
            onChange={(newValue) => this.props.onInputChange(input, newValue)}
            styles={{
              root: { width: 400 },
              titleLabel: {
                ...SmartUiComponent.labelStyle,
                fontWeight: 600,
              },
              valueLabel: SmartUiComponent.labelStyle,
            }}
          />
        </div>
      );
    } else {
      return <>Unsupported number UI type {input.uiType}</>;
    }
  }

  private renderBooleanInput(input: BooleanInput): JSX.Element {
    const value = this.props.currentValues.get(input.dataFieldName)?.value as boolean;
    const disabled = this.props.disabled || this.props.currentValues.get(input.dataFieldName)?.disabled;
    return (
      <Toggle
        id={`${input.dataFieldName}-toggle-input`}
        label={this.props.getTranslation(input.labelTKey)}
        checked={value || false}
        onText={this.props.getTranslation(input.trueLabelTKey)}
        offText={this.props.getTranslation(input.falseLabelTKey)}
        disabled={disabled}
        onChange={(event, checked: boolean) => this.props.onInputChange(input, checked)}
        styles={{ root: { width: 400 } }}
      />
    );
  }

  private renderChoiceInput(input: ChoiceInput): JSX.Element {
    const { labelTKey, defaultKey, dataFieldName, choices, placeholderTKey } = input;
    const value = this.props.currentValues.get(dataFieldName)?.value as string;
    const disabled = this.props.disabled || this.props.currentValues.get(dataFieldName)?.disabled;
    let selectedKey = value ? value : defaultKey;
    if (!selectedKey) {
      selectedKey = "";
    }
    return (
      <Dropdown
        id={`${input.dataFieldName}-dropdown-input`}
        label={this.props.getTranslation(labelTKey)}
        selectedKey={selectedKey}
        onChange={(_, item: IDropdownOption) => this.props.onInputChange(input, item.key.toString())}
        placeholder={this.props.getTranslation(placeholderTKey)}
        disabled={disabled}
        options={choices.map((c) => ({
          key: c.key,
          text: this.props.getTranslation(c.label),
        }))}
        styles={{
          root: { width: 400 },
          label: {
            ...SmartUiComponent.labelStyle,
            fontWeight: 600,
          },
          dropdown: SmartUiComponent.labelStyle,
        }}
      />
    );
  }

  private renderError(input: AnyDisplay): JSX.Element {
    return <MessageBar messageBarType={MessageBarType.error}>Error: {input.errorMessage}</MessageBar>;
  }

  private renderDisplay(input: AnyDisplay): JSX.Element {
    if (input.errorMessage) {
      return this.renderError(input);
    }
    const inputHidden = this.props.currentValues.get(input.dataFieldName)?.hidden;
    if (inputHidden) {
      return <></>;
    }
    switch (input.type) {
      case "string":
        if ("description" in input) {
          return this.renderDescription(input as DescriptionDisplay);
        }
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
    const containerStackTokens: IStackTokens = { childrenGap: 10 };

    return (
      <Stack tokens={containerStackTokens} className="widgetRendererContainer">
        <Stack.Item>
          {node.info && this.renderInfo(node.info as Info)}
          {node.input && this.renderDisplay(node.input)}
        </Stack.Item>
        {node.children && node.children.map((child) => <div key={child.id}>{this.renderNode(child)}</div>)}
      </Stack>
    );
  }

  render(): JSX.Element {
    return this.renderNode(this.props.descriptor.root);
  }
}
