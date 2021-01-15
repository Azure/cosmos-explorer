import React from "react";
import { IStackTokens, PrimaryButton, Spinner, SpinnerSize, Stack } from "office-ui-fabric-react";
import {
  ChoiceItem,
  InputType,
  InputTypeValue,
  SmartUiComponent,
  UiType,
  SmartUiDescriptor,
  Info
} from "../Explorer/Controls/SmartUi/SmartUiComponent";

export interface BaseInput {
  label: (() => Promise<string>) | string;
  dataFieldName: string;
  type: InputTypeValue;
  onChange?: (currentState: Map<string, InputType>, newValue: InputType) => Map<string, InputType>;
  placeholder?: (() => Promise<string>) | string;
  errorMessage?: string;
}

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

export interface ChoiceInput extends BaseInput {
  choices: (() => Promise<ChoiceItem[]>) | ChoiceItem[];
  defaultKey?: string;
}

export interface Node {
  id: string;
  info?: (() => Promise<Info>) | Info;
  input?: AnyInput;
  children?: Node[];
}

export interface SelfServeDescriptor {
  root: Node;
  initialize?: () => Promise<Map<string, InputType>>;
  onSubmit?: (currentValues: Map<string, InputType>) => Promise<void>;
  inputNames?: string[];
}

export type AnyInput = NumberInput | BooleanInput | StringInput | ChoiceInput;

export interface SelfServeComponentProps {
  descriptor: SelfServeDescriptor;
}

export interface SelfServeComponentState {
  root: SelfServeDescriptor;
  currentValues: Map<string, InputType>;
  baselineValues: Map<string, InputType>;
  isRefreshing: boolean;
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
      isRefreshing: false
    };
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
    this.setState({ currentValues: currentValues, baselineValues: baselineValues, isRefreshing: false });
  };

  public discard = (): void => {
    console.log("discarding");
    let { currentValues } = this.state;
    const { baselineValues } = this.state;
    for (const key of baselineValues.keys()) {
      currentValues = currentValues.set(key, baselineValues.get(key));
    }
    this.setState({ currentValues: currentValues });
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
      currentValues.set(dataFieldName, newValue);
      this.setState({ currentValues });
    }
  };

  public render(): JSX.Element {
    const containerStackTokens: IStackTokens = { childrenGap: 20 };
    return !this.state.isRefreshing ? (
      <div style={{ overflowX: "auto" }}>
        <Stack tokens={containerStackTokens} styles={{ root: { width: 400, padding: 10 } }}>
          <SmartUiComponent
            descriptor={this.state.root as SmartUiDescriptor}
            currentValues={this.state.currentValues}
            onInputChange={this.onInputChange}
          />

          <Stack horizontal tokens={{ childrenGap: 10 }}>
            <PrimaryButton
              id="submitButton"
              styles={{ root: { width: 100 } }}
              text="submit"
              onClick={async () => {
                await this.props.descriptor.onSubmit(this.state.currentValues);
                this.setDefaults();
              }}
            />
            <PrimaryButton
              id="discardButton"
              styles={{ root: { width: 100 } }}
              text="discard"
              onClick={() => this.discard()}
            />
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
