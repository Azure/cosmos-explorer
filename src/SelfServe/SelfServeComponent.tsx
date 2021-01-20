import React from "react";
import { CommandBar, ICommandBarItemProps, IStackTokens, PrimaryButton, Spinner, SpinnerSize, Stack } from "office-ui-fabric-react";
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
  onSubmit?: (currentValues: Map<string, SmartUiInput>) => Promise<void>;
  inputNames?: string[];
}

export type AnyInput = NumberInput | BooleanInput | StringInput | ChoiceInput | DescriptionDisplay;

export interface SelfServeComponentProps {
  descriptor: SelfServeDescriptor;
}

export interface SelfServeComponentState {
  root: SelfServeDescriptor;
  currentValues: Map<string, SmartUiInput>;
  baselineValues: Map<string, SmartUiInput>;
  isRefreshing: boolean;
  hasErrors: boolean,
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
      hasErrors: false
    };
  }

  private onError = (hasErrors: boolean) : void => {
    this.setState({hasErrors})
  }

  private initializeSmartUiComponent = async (): Promise<void> => {
    this.setState({ isRefreshing: true });
    await this.initializeSmartUiNode(this.props.descriptor.root);
    await this.setDefaults();
    this.setState({ isRefreshing: false });
  };

  private setDefaults = async (): Promise<void> => {
    this.setState({ isRefreshing: true });
    let { currentValues, baselineValues } = this.state;

    const initialValues = await this.props.descriptor.initialize();
    for (const key of initialValues.keys()) {
      if (this.props.descriptor.inputNames.indexOf(key) === -1) {
        this.setState({ isRefreshing: false });
        throw new Error(`${key} is not an input property of this class.`);
      }

      currentValues = currentValues.set(key, initialValues.get(key));
      baselineValues = baselineValues.set(key, initialValues.get(key));
    }
    this.setState({ currentValues, baselineValues, isRefreshing: false });
  };

  public discard = (): void => {
    let { currentValues } = this.state;
    const { baselineValues } = this.state;
    for (const key of baselineValues.keys()) {
      currentValues = currentValues.set(key, baselineValues.get(key));
    }
    this.setState({ currentValues });
  };

  private initializeSmartUiNode = async (currentNode: Node): Promise<void> => {
    currentNode.info = await this.getResolvedValue(currentNode.info);

    if (currentNode.input) {
      currentNode.input = await this.getResolvedInput(currentNode.input);
    }

    const promises = currentNode.children?.map(async (child: Node) => await this.initializeSmartUiNode(child));
    if (promises) {
      await Promise.all(promises);
    }
  };

  private getResolvedInput = async (input: AnyInput): Promise<AnyInput> => {
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
      currentValues.set(dataFieldName, {value: newValue, hidden: currentInputValue.hidden});
      this.setState({ currentValues });
    }
  };

  
  onSubmitButtonClick = () : void => {
    this.setState({isRefreshing: true})
    this.props.descriptor.onSubmit(this.state.currentValues)
    .then(() => {
      this.setState({isRefreshing: false})
      this.setDefaults();
    });
  }

  isDiscardButtonDisabled = () : boolean => {
    for (const key of this.state.currentValues.keys()) {
      if (this.state.currentValues.get(key) !== this.state.baselineValues.get(key)) {
        return false
      }
    }
    return true
  }

  isSaveButtonDisabled = () : boolean => {
    if (this.state.hasErrors) {
      return true
    }
    for (const key of this.state.currentValues.keys()) {
      if (this.state.currentValues.get(key) !== this.state.baselineValues.get(key)) {
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
        onClick: this.onSubmitButtonClick
      },
      {
        key: 'discard',
        text: 'Discard',
        iconProps: { iconName: 'Undo' },
        split: true,
        disabled: this.isDiscardButtonDisabled(),
        onClick: () => {this.discard()}
      }
    ]
  }

  public render(): JSX.Element {
    const containerStackTokens: IStackTokens = { childrenGap: 20 };
    return !this.state.isRefreshing ? (
      <div style={{ overflowX: "auto" }}>
        <Stack tokens={containerStackTokens} styles={{ root: { width: 400, padding: 10 } }}>
          <CommandBar items={this.getCommandBarItems()} />
          <SmartUiComponent
            descriptor={this.state.root as SmartUiDescriptor}
            currentValues={this.state.currentValues}
            onInputChange={this.onInputChange}
            onError={this.onError}
          />
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
