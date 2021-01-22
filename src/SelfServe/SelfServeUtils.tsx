import "reflect-metadata";
import {
  ChoiceItem,
  Info,
  InputTypeValue,
  InputType,
  SmartUiInput,
  Description,
} from "../Explorer/Controls/SmartUi/SmartUiComponent";
import {
  BooleanInput,
  ChoiceInput,
  SelfServeDescriptor,
  NumberInput,
  StringInput,
  Node,
  AnyInput,
  DescriptionDisplay,
  SelfServeNotification,
  RefreshResult,
} from "./SelfServeComponent";

export enum SelfServeType {
  // No self serve type passed, launch explorer
  none = "none",
  // Unsupported self serve type passed as feature flag
  invalid = "invalid",
  // Add your self serve types here
  example = "example",
  sqlx = "sqlx",
}

export abstract class SelfServeBaseClass {
  public abstract onSubmit: (currentValues: Map<string, SmartUiInput>) => Promise<SelfServeNotification>;
  public abstract initialize: () => Promise<Map<string, SmartUiInput>>;
  public abstract validate: (currentvalues: Map<string, SmartUiInput>) => string;
  public abstract onRefresh: () => Promise<RefreshResult>;

  public toSelfServeDescriptor(): SelfServeDescriptor {
    const className = this.constructor.name;
    const selfServeDescriptor = Reflect.getMetadata(className, this) as SelfServeDescriptor;

    if (!this.initialize) {
      throw new Error(`initialize() was not declared for the class '${className}'`);
    }
    if (!this.onSubmit) {
      throw new Error(`onSubmit() was not declared for the class '${className}'`);
    }
    if (!selfServeDescriptor?.root) {
      throw new Error(`@SmartUi decorator was not declared for the class '${className}'`);
    }

    selfServeDescriptor.initialize = this.initialize;
    selfServeDescriptor.onSubmit = this.onSubmit;
    selfServeDescriptor.validate = this.validate;
    selfServeDescriptor.onRefresh = this.onRefresh;
    return selfServeDescriptor;
  }
}

export interface CommonInputTypes {
  id: string;
  info?: (() => Promise<Info>) | Info;
  type?: InputTypeValue;
  label?: (() => Promise<string>) | string;
  placeholder?: (() => Promise<string>) | string;
  dataFieldName?: string;
  min?: (() => Promise<number>) | number;
  max?: (() => Promise<number>) | number;
  step?: (() => Promise<number>) | number;
  trueLabel?: (() => Promise<string>) | string;
  falseLabel?: (() => Promise<string>) | string;
  choices?: (() => Promise<ChoiceItem[]>) | ChoiceItem[];
  uiType?: string;
  errorMessage?: string;
  description?: (() => Promise<Description>) | Description;
  onChange?: (currentState: Map<string, SmartUiInput>, newValue: InputType) => Map<string, SmartUiInput>;
  onSubmit?: (currentValues: Map<string, SmartUiInput>) => Promise<void>;
  initialize?: () => Promise<Map<string, SmartUiInput>>;
}

const setValue = <T extends keyof CommonInputTypes, K extends CommonInputTypes[T]>(
  name: T,
  value: K,
  fieldObject: CommonInputTypes
): void => {
  fieldObject[name] = value;
};

const getValue = <T extends keyof CommonInputTypes>(name: T, fieldObject: CommonInputTypes): unknown => {
  return fieldObject[name];
};

export const addPropertyToMap = <T extends keyof CommonInputTypes, K extends CommonInputTypes[T]>(
  target: unknown,
  propertyName: string,
  className: string,
  descriptorName: keyof CommonInputTypes,
  descriptorValue: K
): void => {
  const context =
    (Reflect.getMetadata(className, target) as Map<string, CommonInputTypes>) ?? new Map<string, CommonInputTypes>();
  updateContextWithDecorator(context, propertyName, className, descriptorName, descriptorValue);
  Reflect.defineMetadata(className, context, target);
};

export const updateContextWithDecorator = <T extends keyof CommonInputTypes, K extends CommonInputTypes[T]>(
  context: Map<string, CommonInputTypes>,
  propertyName: string,
  className: string,
  descriptorName: keyof CommonInputTypes,
  descriptorValue: K
): void => {
  if (!(context instanceof Map)) {
    console.log(context);
    throw new Error(`@SmartUi should be the first decorator for the class '${className}'.`);
  }

  const propertyObject = context.get(propertyName) ?? { id: propertyName };

  if (getValue(descriptorName, propertyObject) && descriptorName !== "type" && descriptorName !== "dataFieldName") {
    throw new Error(
      `Duplicate value passed for '${descriptorName}' on property '${propertyName}' of class '${className}'`
    );
  }

  setValue(descriptorName, descriptorValue, propertyObject);
  context.set(propertyName, propertyObject);
};

export const buildSmartUiDescriptor = (className: string, target: unknown): void => {
  const context = Reflect.getMetadata(className, target) as Map<string, CommonInputTypes>;
  const smartUiDescriptor = mapToSmartUiDescriptor(context);
  Reflect.defineMetadata(className, smartUiDescriptor, target);
};

export const mapToSmartUiDescriptor = (context: Map<string, CommonInputTypes>): SelfServeDescriptor => {
  const root = context.get("root");
  context.delete("root");
  const inputNames: string[] = [];

  const smartUiDescriptor: SelfServeDescriptor = {
    root: {
      id: "root",
      info: root?.info,
      children: [],
    },
  };

  while (context.size > 0) {
    const key = context.keys().next().value;
    addToDescriptor(context, smartUiDescriptor.root, key, inputNames);
  }
  smartUiDescriptor.inputNames = inputNames;

  return smartUiDescriptor;
};

const addToDescriptor = (
  context: Map<string, CommonInputTypes>,
  root: Node,
  key: string,
  inputNames: string[]
): void => {
  const value = context.get(key);
  inputNames.push(value.id);
  const element = {
    id: value.id,
    info: value.info,
    input: getInput(value),
    children: [],
  } as Node;
  context.delete(key);
  root.children.push(element);
};

const getInput = (value: CommonInputTypes): AnyInput => {
  switch (value.type) {
    case "number":
      if (!value.label || !value.step || !value.uiType || !value.min || !value.max) {
        value.errorMessage = `label, step, min, max and uiType are required for number input '${value.id}'.`;
      }
      return value as NumberInput;
    case "string":
      if (value.description) {
        return value as DescriptionDisplay;
      }
      if (!value.label) {
        value.errorMessage = `label is required for string input '${value.id}'.`;
      }
      return value as StringInput;
    case "boolean":
      if (!value.label || !value.trueLabel || !value.falseLabel) {
        value.errorMessage = `label, truelabel and falselabel are required for boolean input '${value.id}'.`;
      }
      return value as BooleanInput;
    default:
      if (!value.label || !value.choices) {
        value.errorMessage = `label and choices are required for Choice input '${value.id}'.`;
      }
      return value as ChoiceInput;
  }
};
