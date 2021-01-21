import React from "react";
import { CommandBar, ICommandBarItemProps, IStackTokens, MessageBar, MessageBarType, PrimaryButton, Spinner, SpinnerSize, Stack } from "office-ui-fabric-react";
import {
  ChoiceItem,
  InputType,
  InputTypeValue,
  SmartUiComponent,
  NumberUiType,
  SmartUiDescriptor,
  Info,
  SmartUiInput,
  Description
} from "../Explorer/Controls/SmartUi/SmartUiComponent";

export interface BaseInput {
  dataFieldName: string;
  errorMessage?: string;
  type: InputTypeValue;
  label?: (() => Promise<string>) | string;
  onChange?: (currentState: Map<string, SmartUiInput>, newValue: InputType) => Map<string, SmartUiInput>;
  placeholder?: (() => Promise<string>) | string;
}

export interface NumberInput extends BaseInput {
  min: (() => Promise<number>) | number;
  max: (() => Promise<number>) | number;
  step: (() => Promise<number>) | number;
  defaultValue?: number;
  uiType: NumberUiType;
}

export interface BooleanInput extends BaseInput {
  trueLabel: (() => Promise<string>) | string;
  falseLabel: (() => Promise<string>) | string;
  defaultValue?: boolean;
}

export interface StringInput extends BaseInput {
  defaultValue?: string;
}

export interface ChoiceInput extends BaseInput {
  choices: (() => Promise<ChoiceItem[]>) | ChoiceItem[];
  defaultKey?: string;
}

export interface DescriptionDisplay extends BaseInput {
  description: (() => Promise<Description>) | Description
}

export interface Node {
  id: string;
  info?: (() => Promise<Info>) | Info;
  input?: AnyInput;
  children?: Node[];
}

export interface SelfServeDescriptor {
  root: Node;
  initialize?: () => Promise<Map<string, SmartUiInput>>;
  onSubmit?: (currentValues: Map<string, SmartUiInput>) => Promise<string>;
  inputNames?: string[];
  validate?: (currentValues: Map<string, SmartUiInput>) => string
}

export type AnyInput = NumberInput | BooleanInput | StringInput | ChoiceInput | DescriptionDisplay;

export interface SelfServeComponentProps {
  descriptor: SelfServeDescriptor;
}

interface Notification {
  message: string,
  type: MessageBarType
}

export interface SelfServeComponentState {
  root: SelfServeDescriptor;
  currentValues: Map<string, SmartUiInput>;
  baselineValues: Map<string, SmartUiInput>;
  isRefreshing: boolean;
  hasErrors: boolean,
  compileErrorMessage: string,
  notification: Notification
}

export class SelfServeComponent extends React.Component<SelfServeComponentProps, SelfServeComponentState> {
  componentDidMount(): void {
    this.initializeSmartUiComponent();
  }

  constructor(props: SelfServeComponentProps) {
    super(props);
    this.state = {
      root: this.props.descriptor,
      currentValues: new Map(),
      baselineValues: new Map(),
      isRefreshing: true,
      hasErrors: false,
      compileErrorMessage: undefined,
      notification: undefined
    };
  }

  private onError = (hasErrors: boolean) : void => {
    this.setState({hasErrors})
  }

  private initializeSmartUiComponent = async (): Promise<void> => {
    this.setState({ isRefreshing: true });
    await this.setDefaults();
    const {currentValues , baselineValues} = this.state
    await this.initializeSmartUiNode(this.props.descriptor.root, currentValues, baselineValues);
    this.setState({ isRefreshing: false, currentValues, baselineValues });
  };

  private setDefaults = async (): Promise<void> => {
    let { currentValues, baselineValues } = this.state;

    const initialValues = await this.props.descriptor.initialize();
    this.props.descriptor.inputNames.map((inputName) => {
      let initialValue = initialValues.get(inputName)
      if (!initialValue) {
        initialValue = {value: undefined, hidden: false}
      }
      currentValues = currentValues.set(inputName, initialValue);
      baselineValues = baselineValues.set(inputName, initialValue);
      initialValues.delete(inputName)
    })

    if (initialValues.size > 0) {
      const keys = []
      for (const key of initialValues.keys()) {
        keys.push(key)
      }

      this.setState({ 
        compileErrorMessage: `The following fields have default values set but are not input properties of this class: ${keys.join(", ")}`
      });
    }
    this.setState({ currentValues, baselineValues });
  };

  public discard = (): void => {
    let { currentValues } = this.state;
    const { baselineValues } = this.state;
    for (const key of currentValues.keys()) {
      const baselineValue = baselineValues.get(key)
      const newValue = {value: baselineValue.value, hidden: baselineValue.hidden}
      currentValues = currentValues.set(key, newValue);
    }
    this.setState({ currentValues });
  };

  private initializeSmartUiNode = async (currentNode: Node, currentValues: Map<string, SmartUiInput>, baselineValues: Map<string, SmartUiInput>): Promise<void> => {
    currentNode.info = await this.getResolvedValue(currentNode.info);

    if (currentNode.input) {
      currentNode.input = await this.getResolvedInput(currentNode.input, currentValues, baselineValues);
    }

    const promises = currentNode.children?.map(async (child: Node) => await this.initializeSmartUiNode(child, currentValues, baselineValues));
    if (promises) {
      await Promise.all(promises);
    }
  };

  private getResolvedInput = async (input: AnyInput, currentValues: Map<string, SmartUiInput>, baselineValues: Map<string, SmartUiInput>): Promise<AnyInput> => {
    input.label = await this.getResolvedValue(input.label);
    input.placeholder = await this.getResolvedValue(input.placeholder);

    switch (input.type) {
      case "string": {
        if ("description" in input) {
          const descriptionDisplay = input as DescriptionDisplay
          descriptionDisplay.description = await this.getResolvedValue(descriptionDisplay.description)
        }
        return input as StringInput;
      }
      case "number": {
        const numberInput = input as NumberInput;
        numberInput.min = await this.getResolvedValue(numberInput.min);
        numberInput.max = await this.getResolvedValue(numberInput.max);
        numberInput.step = await this.getResolvedValue(numberInput.step);

        const dataFieldName = numberInput.dataFieldName
        const defaultValue = currentValues.get(dataFieldName)?.value

        if (!defaultValue) {
          const newDefaultValue = {value: numberInput.min, hidden: currentValues.get(dataFieldName)?.hidden}
          currentValues.set(dataFieldName, newDefaultValue)
          baselineValues.set(dataFieldName, newDefaultValue)
        }

        return numberInput;
      }
      case "boolean": {
        const booleanInput = input as BooleanInput;
        booleanInput.trueLabel = await this.getResolvedValue(booleanInput.trueLabel);
        booleanInput.falseLabel = await this.getResolvedValue(booleanInput.falseLabel);
        return booleanInput;
      }
      default: {
        const choiceInput = input as ChoiceInput;
        choiceInput.choices = await this.getResolvedValue(choiceInput.choices);
        return choiceInput;
      }
    }
  };

  public async getResolvedValue<T>(value: T | (() => Promise<T>)): Promise<T> {
    if (value instanceof Function) {
      return value();
    }
    return value;
  }

  private onInputChange = (input: AnyInput, newValue: InputType) => {
    if (input.onChange) {
      const newValues = input.onChange(this.state.currentValues, newValue);
      this.setState({ currentValues: newValues });
    } else {
      const dataFieldName = input.dataFieldName;
      const { currentValues } = this.state;
      const currentInputValue = currentValues.get(dataFieldName)
      currentValues.set(dataFieldName, {value: newValue, hidden: currentInputValue?.hidden});
      this.setState({ currentValues });
    }
  };

  public onSubmitButtonClick = () : void => {
    const errorMessage = this.props.descriptor.validate(this.state.currentValues)
    this.setState({notification: { message: errorMessage, type: MessageBarType.error}})
    if (errorMessage) {
      return
    }
    this.setState({isRefreshing: true})
    const onSubmitPromise = this.props.descriptor.onSubmit(this.state.currentValues)
    onSubmitPromise.catch((error) => {
      this.setState({
        isRefreshing: false, 
        notification: { 
          message: `Update failed. Error: ${error.message}`, 
          type: MessageBarType.error
        }
      })
    })
    onSubmitPromise.then((successMessage: string) => {
      this.setDefaults();
      this.setState({
        isRefreshing: false,
        notification: { 
          message: successMessage,
          type: MessageBarType.success
        }
      })
    })
  }

  public isDiscardButtonDisabled = () : boolean => {
    for (const key of this.state.currentValues.keys()) {
      const currentValue = JSON.stringify(this.state.currentValues.get(key))
      const baselineValue = JSON.stringify(this.state.baselineValues.get(key))

      if (currentValue !== baselineValue) {
        return false
      }
    }
    return true
  }

  public isSaveButtonDisabled = () : boolean => {
    if (this.state.hasErrors) {
      return true
    }
    for (const key of this.state.currentValues.keys()) {
      const currentValue = JSON.stringify(this.state.currentValues.get(key))
      const baselineValue = JSON.stringify(this.state.baselineValues.get(key))

      if (currentValue !== baselineValue) {
        return false
      }
    }
    return true
  }

  private getCommandBarItems = () : ICommandBarItemProps[] => {
    return [
      {
        key: 'save',
        text: 'Save',
        iconProps: { iconName: 'Save' },
        split: true,
        disabled: this.isSaveButtonDisabled(),
        onClick: this.onSubmitButtonClick,
        id: "submitButton"
      },
      {
        key: 'discard',
        text: 'Discard',
        iconProps: { iconName: 'Undo' },
        split: true,
        disabled: this.isDiscardButtonDisabled(),
        onClick: () => {this.discard()},
        id: "discardButton"
      }
    ]
  }

  public render(): JSX.Element {
    const containerStackTokens: IStackTokens = { childrenGap: 20 };
    if (this.state.compileErrorMessage) {
      return (
        <MessageBar messageBarType={MessageBarType.error}>
          {this.state.compileErrorMessage}
        </MessageBar>
      )
    }
    if (this.state.isRefreshing) {
      return (
        <Spinner
          size={SpinnerSize.large}
          styles={{ root: { textAlign: "center", justifyContent: "center", width: "100%", height: "100%" } }}
        />
      )
    }
    return (
      <div style={{ overflowX: "auto" }}>
        <Stack tokens={containerStackTokens} styles={{ root: { padding: 10 } }}>
          <CommandBar styles={{root: {paddingLeft: 10}}} items={this.getCommandBarItems()} />
          {this.state.notification && 
            <MessageBar 
            messageBarType={this.state.notification.type} 
            styles={{root: {width: 400}}}
            onDismiss={() => this.setState({notification: undefined})}>
              {this.state.notification.message}
            </MessageBar>
          }
          <SmartUiComponent
            descriptor={this.state.root as SmartUiDescriptor}
            currentValues={this.state.currentValues}
            onInputChange={this.onInputChange}
            onError={this.onError}
          />
        </Stack>
      </div>
    ) 
  }
}
