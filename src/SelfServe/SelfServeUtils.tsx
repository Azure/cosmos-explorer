import "reflect-metadata";
import {
  Node,
  AnyDisplay,
  BooleanInput,
  ChoiceInput,
  ChoiceItem,
  Description,
  DescriptionDisplay,
  Info,
  InputType,
  InputTypeValue,
  NumberInput,
  SelfServeDescriptor,
  SmartUiInput,
  StringInput,
} from "./SelfServeTypes";

export enum SelfServeType {
  // No self serve type passed, launch explorer
  none = "none",
  // Unsupported self serve type passed as feature flag
  invalid = "invalid",
  // Add your self serve types here
  example = "example",
  sqlx = "sqlx",
}

export interface DecoratorProperties {
  id: string;
  info?: (() => Promise<Info>) | Info;
  type?: InputTypeValue;
  labelTKey?: (() => Promise<string>) | string;
  placeholderTKey?: (() => Promise<string>) | string;
  dataFieldName?: string;
  min?: (() => Promise<number>) | number;
  max?: (() => Promise<number>) | number;
  step?: (() => Promise<number>) | number;
  trueLabelTKey?: (() => Promise<string>) | string;
  falseLabelTKey?: (() => Promise<string>) | string;
  choices?: (() => Promise<ChoiceItem[]>) | ChoiceItem[];
  uiType?: string;
  errorMessage?: string;
  description?: (() => Promise<Description>) | Description;
  isDynamicDescription?: boolean;
  onChange?: (
    currentState: Map<string, SmartUiInput>,
    newValue: InputType,
    baselineValues: ReadonlyMap<string, SmartUiInput>
  ) => Map<string, SmartUiInput>;
}

const setValue = <T extends keyof DecoratorProperties, K extends DecoratorProperties[T]>(
  name: T,
  value: K,
  fieldObject: DecoratorProperties
): void => {
  fieldObject[name] = value;
};

const getValue = <T extends keyof DecoratorProperties>(name: T, fieldObject: DecoratorProperties): unknown => {
  return fieldObject[name];
};

export const addPropertyToMap = <T extends keyof DecoratorProperties, K extends DecoratorProperties[T]>(
  target: unknown,
  propertyName: string,
  className: string,
  descriptorName: keyof DecoratorProperties,
  descriptorValue: K
): void => {
  const context =
    (Reflect.getMetadata(className, target) as Map<string, DecoratorProperties>) ??
    new Map<string, DecoratorProperties>();
  updateContextWithDecorator(context, propertyName, className, descriptorName, descriptorValue);
  Reflect.defineMetadata(className, context, target);
};

export const updateContextWithDecorator = <T extends keyof DecoratorProperties, K extends DecoratorProperties[T]>(
  context: Map<string, DecoratorProperties>,
  propertyName: string,
  className: string,
  descriptorName: keyof DecoratorProperties,
  descriptorValue: K
): void => {
  if (!(context instanceof Map)) {
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
  const context = Reflect.getMetadata(className, target) as Map<string, DecoratorProperties>;
  const smartUiDescriptor = mapToSmartUiDescriptor(className, context);
  Reflect.defineMetadata(className, smartUiDescriptor, target);
};

export const mapToSmartUiDescriptor = (
  className: string,
  context: Map<string, DecoratorProperties>
): SelfServeDescriptor => {
  const inputNames: string[] = [];

  const smartUiDescriptor: SelfServeDescriptor = {
    root: {
      id: className,
      info: undefined,
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
  context: Map<string, DecoratorProperties>,
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

const getInput = (value: DecoratorProperties): AnyDisplay => {
  switch (value.type) {
    case "number":
      if (!value.labelTKey || !value.step || !value.uiType || !value.min || !value.max) {
        value.errorMessage = `label, step, min, max and uiType are required for number input '${value.id}'.`;
      }
      return value as NumberInput;
    case "string":
      if (value.description || value.isDynamicDescription) {
        if (value.description && value.isDynamicDescription) {
          value.errorMessage = `dynamic descriptions should not have defaults set here.`;
        }
        return value as DescriptionDisplay;
      }
      if (!value.labelTKey) {
        value.errorMessage = `label is required for string input '${value.id}'.`;
      }
      return value as StringInput;
    case "boolean":
      if (!value.labelTKey || !value.trueLabelTKey || !value.falseLabelTKey) {
        value.errorMessage = `label, truelabel and falselabel are required for boolean input '${value.id}'.`;
      }
      return value as BooleanInput;
    default:
      if (!value.labelTKey || !value.choices) {
        value.errorMessage = `label and choices are required for Choice input '${value.id}'.`;
      }
      return value as ChoiceInput;
  }
};
