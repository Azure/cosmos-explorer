import {
  Dropdown,
  IDropdownOption,
  IStackTokens,
  Label,
  Link,
  MessageBar,
  MessageBarType,
  Position,
  Slider,
  SpinButton,
  Stack,
  Text,
  TextField,
  Toggle,
} from "@fluentui/react";
import { TFunction } from "i18next";
import * as React from "react";
import {
  ChoiceItem,
  Description,
  DescriptionType,
  Info,
  InputType,
  InputTypeValue,
  NumberUiType,
  SmartUiInput,
} from "../../../SelfServe/SelfServeTypes";
import { ToolTipLabelComponent } from "../Settings/SettingsSubComponents/ToolTipLabelComponent";
import * as InputUtils from "./InputUtils";
import "./SmartUiComponent.less";

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
  description?: Description;
  isDynamicDescription?: boolean;
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
      info && (
        <Text>
          {this.props.getTranslation(info.messageTKey)}{" "}
          {info.link && (
            <Link href={info.link.href} target="_blank">
              {this.props.getTranslation(info.link.textTKey)}
            </Link>
          )}
        </Text>
      )
    );
  }

  private renderTextInput(input: StringInput, labelId: string, labelElement: JSX.Element): JSX.Element {
    const value = this.props.currentValues.get(input.dataFieldName)?.value as string;
    const disabled = this.props.disabled || this.props.currentValues.get(input.dataFieldName)?.disabled;
    return (
      <Stack>
        {labelElement}
        <TextField
          id={`${input.dataFieldName}-textField-input`}
          aria-labelledby={labelId}
          type="text"
          value={value || ""}
          placeholder={this.props.getTranslation(input.placeholderTKey)}
          disabled={disabled}
          onChange={(_, newValue) => this.props.onInputChange(input, newValue)}
          styles={{
            root: { width: 400 },
          }}
        />
      </Stack>
    );
  }

  private renderDescription(input: DescriptionDisplay, labelId: string, labelElement: JSX.Element): JSX.Element {
    const dataFieldName = input.dataFieldName;
    const description = input.description || (this.props.currentValues.get(dataFieldName)?.value as Description);
    if (!description) {
      if (!input.isDynamicDescription) {
        return this.renderError("Description is not provided.");
      }
      // If input is a dynamic description and description is not available, empty element is rendered
      return <></>;
    }
    const descriptionElement = (
      <Stack>
        {labelElement}
        <Text id={`${dataFieldName}-text-display`} aria-labelledby={labelId} style={{ whiteSpace: "pre" }}>
          {this.props.getTranslation(description.textTKey)}{" "}
          {description.link && (
            <Link target="_blank" href={description.link.href}>
              {this.props.getTranslation(description.link.textTKey)}
            </Link>
          )}
        </Text>
      </Stack>
    );

    if (description.type === DescriptionType.Text) {
      return descriptionElement;
    }
    const messageBarType =
      description.type === DescriptionType.InfoMessageBar ? MessageBarType.info : MessageBarType.warning;
    return <MessageBar messageBarType={messageBarType}>{descriptionElement}</MessageBar>;
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

  private renderNumberInput(input: NumberInput, labelId: string, labelElement: JSX.Element): JSX.Element {
    const { labelTKey, min, max, dataFieldName, step } = input;
    const props = {
      min: min,
      max: max,
      ariaLabel: this.props.getTranslation(labelTKey),
      step: step,
    };

    const value = this.props.currentValues.get(dataFieldName)?.value as number;
    const disabled = this.props.disabled || this.props.currentValues.get(dataFieldName)?.disabled;
    if (input.uiType === NumberUiType.Spinner) {
      return (
        <Stack>
          {labelElement}
          <Stack styles={{ root: { width: 400 } }} tokens={{ childrenGap: 2 }}>
            <SpinButton
              {...props}
              id={`${input.dataFieldName}-spinner-input`}
              value={value?.toString()}
              onValidate={(newValue) => this.onValidate(input, newValue, props.min, props.max)}
              onIncrement={(newValue) => this.onIncrement(input, newValue, props.step, props.max)}
              onDecrement={(newValue) => this.onDecrement(input, newValue, props.step, props.min)}
              labelPosition={Position.top}
              aria-labelledby={labelId}
              disabled={disabled}
            />
            {this.state.errors.has(dataFieldName) && (
              <MessageBar messageBarType={MessageBarType.error}>
                Error: {this.state.errors.get(dataFieldName)}
              </MessageBar>
            )}
          </Stack>
        </Stack>
      );
    } else if (input.uiType === NumberUiType.Slider) {
      return (
        <Stack>
          {labelElement}
          <div id={`${input.dataFieldName}-slider-input`}>
            <Slider
              {...props}
              value={value}
              disabled={disabled}
              onChange={(newValue) => this.props.onInputChange(input, newValue)}
              styles={{
                root: { width: 400 },
                valueLabel: SmartUiComponent.labelStyle,
              }}
            />
          </div>
        </Stack>
      );
    } else {
      return <>Unsupported number UI type {input.uiType}</>;
    }
  }

  private renderBooleanInput(input: BooleanInput, labelId: string, labelElement: JSX.Element): JSX.Element {
    const value = this.props.currentValues.get(input.dataFieldName)?.value as boolean;
    const disabled = this.props.disabled || this.props.currentValues.get(input.dataFieldName)?.disabled;
    return (
      <Stack>
        {labelElement}
        <Toggle
          id={`${input.dataFieldName}-toggle-input`}
          aria-labelledby={labelId}
          checked={value || false}
          onText={this.props.getTranslation(input.trueLabelTKey)}
          offText={this.props.getTranslation(input.falseLabelTKey)}
          disabled={disabled}
          onChange={(event, checked: boolean) => this.props.onInputChange(input, checked)}
          styles={{ root: { width: 400 } }}
        />
      </Stack>
    );
  }

  private renderChoiceInput(input: ChoiceInput, labelId: string, labelElement: JSX.Element): JSX.Element {
    const { defaultKey, dataFieldName, choices, placeholderTKey } = input;
    const value = this.props.currentValues.get(dataFieldName)?.value as string;
    const disabled = this.props.disabled || this.props.currentValues.get(dataFieldName)?.disabled;
    let selectedKey = value ? value : defaultKey;
    if (!selectedKey) {
      selectedKey = "";
    }
    return (
      <Stack>
        {labelElement}
        <Dropdown
          id={`${input.dataFieldName}-dropdown-input`}
          aria-labelledby={labelId}
          selectedKey={selectedKey}
          onChange={(_, item: IDropdownOption) => this.props.onInputChange(input, item.key.toString())}
          placeholder={this.props.getTranslation(placeholderTKey)}
          disabled={disabled}
          // Removed dropdownWidth="auto" as dropdown accept only number
          options={choices.map((c) => ({
            key: c.key,
            text: this.props.getTranslation(c.labelTKey),
          }))}
          styles={{
            root: { width: 400 },
            dropdown: SmartUiComponent.labelStyle,
          }}
        />
      </Stack>
    );
  }

  private renderError(errorMessage: string): JSX.Element {
    return <MessageBar messageBarType={MessageBarType.error}>Error: {errorMessage}</MessageBar>;
  }

  private renderElement(input: AnyDisplay, info: Info): JSX.Element {
    if (input.errorMessage) {
      return this.renderError(input.errorMessage);
    }
    const inputHidden = this.props.currentValues.get(input.dataFieldName)?.hidden;
    if (inputHidden) {
      return <></>;
    }
    const labelId = `${input.dataFieldName}-label`;
    const labelElement: JSX.Element = input.labelTKey && (
      <Label id={labelId}>
        <ToolTipLabelComponent
          label={this.props.getTranslation(input.labelTKey)}
          toolTipElement={this.renderInfo(info)}
        />
      </Label>
    );

    return <Stack>{this.renderControl(input, labelId, labelElement)}</Stack>;
  }

  private renderControl(input: AnyDisplay, labelId: string, labelElement: JSX.Element): JSX.Element {
    switch (input.type) {
      case "string":
        if ("description" in input || "isDynamicDescription" in input) {
          return this.renderDescription(input as DescriptionDisplay, labelId, labelElement);
        }
        return this.renderTextInput(input as StringInput, labelId, labelElement);
      case "number":
        return this.renderNumberInput(input as NumberInput, labelId, labelElement);
      case "boolean":
        return this.renderBooleanInput(input as BooleanInput, labelId, labelElement);
      case "object":
        return this.renderChoiceInput(input as ChoiceInput, labelId, labelElement);
      default:
        throw new Error(`Unknown input type: ${input.type}`);
    }
  }

  private renderNode(node: Node): JSX.Element {
    const containerStackTokens: IStackTokens = { childrenGap: 10 };

    return (
      <Stack tokens={containerStackTokens} className="widgetRendererContainer">
        <Stack.Item>{node.input && this.renderElement(node.input, node.info as Info)}</Stack.Item>
        {node.children && node.children.map((child) => <div key={child.id}>{this.renderNode(child)}</div>)}
      </Stack>
    );
  }

  render(): JSX.Element {
    return this.renderNode(this.props.descriptor.root);
  }
}
