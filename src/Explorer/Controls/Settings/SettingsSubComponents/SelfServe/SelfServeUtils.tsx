import "reflect-metadata";
import {
  ChoiceItem,
  Node,
  Info,
  InputTypeValue,
  Descriptor,
  AnyInput,
  NumberInput,
  StringInput,
  BooleanInput,
  ChoiceInput,
  InputType
} from "../../../SmartUi/SmartUiComponent";

export interface CommonInputTypes {
  id: string;
  info?: (() => Promise<Info>) | Info;
  parentOf?: string[];
  type?: InputTypeValue;
  label?: (() => Promise<string>) | string;
  placeholder?: (() => Promise<string>) | string;
  dataFieldName?: string;
  min?: (() => Promise<number>) | number;
  max?: (() => Promise<number>) | number;
  step?: (() => Promise<number>) | number;
  defaultValue?: any;
  trueLabel?: (() => Promise<string>) | string;
  falseLabel?: (() => Promise<string>) | string;
  choices?: (() => Promise<ChoiceItem[]>) | ChoiceItem[];
  defaultKey?: (() => Promise<string>) | string;
  inputType?: string;
  onChange?: (currentState: Map<string, InputType>, newValue: InputType) => Map<string, InputType>;
  onSubmit?: (currentValues: Map<string, InputType>) => Promise<void>;
}

const setValue = <T extends keyof CommonInputTypes, K extends CommonInputTypes[T]>(
  name: T,
  value: K,
  fieldObject: CommonInputTypes
): void => {
  fieldObject[name] = value;
};

const getValue = <T extends keyof CommonInputTypes, K extends CommonInputTypes[T]>(
  name: T,
  fieldObject: CommonInputTypes
): K => {
  return fieldObject[name];
};

export const addPropertyToMap = (
  target: Object,
  propertyKey: string,
  metadataKey: string,
  descriptorName: string,
  descriptorValue: any
): void => {
  const descriptorKey = descriptorName.toString() as keyof CommonInputTypes;
  let context = Reflect.getMetadata(metadataKey, target) as Map<String, CommonInputTypes>;

  if (!context) {
    context = new Map<String, CommonInputTypes>();
  }

  if (!(context instanceof Map)) {
    throw new Error("@SmartUi should be the first decorator for the class.");
  }

  let propertyObject = context.get(propertyKey);
  if (!propertyObject) {
    propertyObject = { id: propertyKey };
  }

  if (getValue(descriptorKey, propertyObject) && descriptorKey !== "type" && descriptorKey !== "dataFieldName") {
    throw new Error("duplicate descriptor");
  }

  setValue(descriptorKey, descriptorValue, propertyObject);
  context.set(propertyKey, propertyObject);

  Reflect.defineMetadata(metadataKey, context, target);
};

export const toSmartUiDescriptor = (metadataKey: string, target: Object): void => {
  const context = Reflect.getMetadata(metadataKey, target) as Map<String, CommonInputTypes>;
  Reflect.defineMetadata(metadataKey, context, target);

  const root = context.get("root");
  context.delete("root");

  if (!root?.onSubmit) {
    throw new Error(
      "@OnSubmit decorator not declared for the class. Please ensure @SmartUi is the first decorator used for the class."
    );
  }

  let smartUiDescriptor = {
    onSubmit: root.onSubmit,
    root: {
      id: "root",
      info: root.info,
      children: []
    } as Node
  } as Descriptor;

  while (context.size > 0) {
    const key = context.keys().next().value;
    addToDescriptor(context, smartUiDescriptor, smartUiDescriptor.root, key);
  }

  Reflect.defineMetadata(metadataKey, smartUiDescriptor, target);
};

const addToDescriptor = (
  context: Map<String, CommonInputTypes>,
  smartUiDescriptor: Descriptor,
  root: Node,
  key: String
): void => {
  let value = context.get(key);
  if (!value) {
    // should already be added to root
    const childNode = getChildFromRoot(key, smartUiDescriptor);
    if (!childNode) {
      // if not found at root level, error out
      throw new Error("Either child does not exist or child has been assigned to more than one parent");
    }
    root.children.push(childNode);
    return;
  }

  const childrenKeys = value.parentOf;
  const element = {
    id: value.id,
    info: value.info,
    input: getInput(value),
    children: []
  } as Node;
  context.delete(key);
  for (let childKey in childrenKeys) {
    addToDescriptor(context, smartUiDescriptor, element, childrenKeys[childKey]);
  }
  root.children.push(element);
};

const getChildFromRoot = (key: String, smartUiDescriptor: Descriptor): Node => {
  let i = 0;
  const children = smartUiDescriptor.root.children;
  for (; i < children.length; i++) {
    if (children[i].id === key) {
      const value = children[i];
      delete children[i];
      return value;
    }
  }
  return undefined;
};

const getInput = (value: CommonInputTypes): AnyInput => {
  if (!value.label || !value.type || !value.dataFieldName) {
    throw new Error("label, onChange, type and dataFieldName are required.");
  }

  switch (value.type) {
    case "number":
      if (!value.step || !value.defaultValue || !value.inputType) {
        throw new Error("step, defaultValue and inputType are needed for number type");
      }
      return value as NumberInput;
    case "string":
      return value as StringInput;
    case "boolean":
      if (!value.trueLabel || !value.falseLabel || value.defaultValue === undefined) {
        throw new Error("truelabel, falselabel and defaultValue are needed for boolean type");
      }
      return value as BooleanInput;
    default:
      if (!value.choices || !value.defaultKey) {
        throw new Error("choices and defaultKey are needed for enum type");
      }
      return value as ChoiceInput;
  }
};
