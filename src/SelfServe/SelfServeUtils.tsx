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
} from "../Explorer/Controls/SmartUi/SmartUiComponent";

const SelfServeType = "selfServeType";

export class SelfServeBase {
  public static toSmartUiDescriptor(): Descriptor {
    return Reflect.getMetadata(this.name, this) as Descriptor;
  }
}

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
  trueLabel?: (() => Promise<string>) | string;
  falseLabel?: (() => Promise<string>) | string;
  choices?: (() => Promise<ChoiceItem[]>) | ChoiceItem[];
  inputType?: string;
  onChange?: (currentState: Map<string, InputType>, newValue: InputType) => Map<string, InputType>;
  onSubmit?: (currentValues: Map<string, InputType>) => Promise<void>;
  initialize?: () => Promise<Map<string, InputType>>;
  customElement?: ((currentValues: Map<string, InputType>) => Promise<JSX.Element>) | JSX.Element;
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

export const addPropertyToMap = (
  target: Object,
  propertyKey: string,
  metadataKey: string,
  descriptorName: string,
  descriptorValue: any
): void => {
  const descriptorKey = descriptorName.toString() as keyof CommonInputTypes;
  let context = Reflect.getMetadata(metadataKey, target) as Map<string, CommonInputTypes>;

  if (!context) {
    context = new Map<string, CommonInputTypes>();
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
  const context = Reflect.getMetadata(metadataKey, target) as Map<string, CommonInputTypes>;
  Reflect.defineMetadata(metadataKey, context, target);

  const root = context.get("root");
  context.delete("root");

  if (!root?.onSubmit) {
    throw new Error(
      "@OnSubmit decorator not declared for the class. Please ensure @SmartUi is the first decorator used for the class."
    );
  }

  if (!root?.initialize) {
    throw new Error(
      "@Initialize decorator not declared for the class. Please ensure @SmartUi is the first decorator used for the class."
    );
  }

  const smartUiDescriptor = {
    onSubmit: root.onSubmit,
    initialize: root.initialize,
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
  context: Map<string, CommonInputTypes>,
  smartUiDescriptor: Descriptor,
  root: Node,
  key: string
): void => {
  const value = context.get(key);
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
  for (const childKey in childrenKeys) {
    addToDescriptor(context, smartUiDescriptor, element, childrenKeys[childKey]);
  }
  root.children.push(element);
};

const getChildFromRoot = (key: string, smartUiDescriptor: Descriptor): Node => {
  let i = 0;
  const children = smartUiDescriptor.root.children;
  while (i < children.length) {
    if (children[i]?.id === key) {
      const value = children[i];
      delete children[i];
      return value;
    } else {
      i++;
    }
  }
  return undefined;
};

const getInput = (value: CommonInputTypes): AnyInput => {
  if (!value.label && !value.customElement) {
    throw new Error("label is required.");
  }

  switch (value.type) {
    case "number":
      if (!value.step || !value.inputType || !value.min || !value.max) {
        throw new Error("step, min, miax and inputType are needed for number type");
      }
      return value as NumberInput;
    case "string":
      return value as StringInput;
    case "boolean":
      if (!value.trueLabel || !value.falseLabel) {
        throw new Error("truelabel and falselabel are needed for boolean type");
      }
      return value as BooleanInput;
    default:
      if (!value.choices) {
        throw new Error("choices are needed for enum type");
      }
      return value as ChoiceInput;
  }
};

export enum SelfServeTypes {
  none = "none",
  invalid = "invalid",
  example = "example"
}

export const getSelfServeType = (search: string): SelfServeTypes => {
  const params = new URLSearchParams(search);
  const selfServeTypeParam = params.get(SelfServeType)?.toLowerCase();
  return SelfServeTypes[selfServeTypeParam as keyof typeof SelfServeTypes];
};
