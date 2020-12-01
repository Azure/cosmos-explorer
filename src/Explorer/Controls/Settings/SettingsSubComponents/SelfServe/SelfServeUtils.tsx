import "reflect-metadata";
import {
  EnumItem,
  Node,
  Info,
  InputTypeValue,
  Descriptor,
  AnyInput,
  NumberInput,
  StringInput,
  BooleanInput,
  EnumInput
} from "../../../SmartUi/SmartUiComponent";

export interface CommonInputTypes {
  id: string;
  info?: Info;
  parentOf?: string[];
  type?: InputTypeValue;
  label?: string;
  placeholder?: string;
  dataFieldName?: string;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: any;
  trueLabel?: string;
  falseLabel?: string;
  choices?: EnumItem[];
  defaultKey?: string;
  inputType?: string;
}

export enum DescriptorType {
  ClassDescriptor,
  PropertyDescriptor
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
  property: string,
  metadataKey: string,
  descriptorName: string,
  descriptorValue: any,
  descriptorType: DescriptorType
): void => {
  const propertyKey = property.toString();
  const descriptorKey = descriptorName.toString() as keyof CommonInputTypes;
  let context = Reflect.getMetadata(metadataKey, target) as Map<String, CommonInputTypes>;

  if (!context) {
    context = new Map<String, CommonInputTypes>();
  }

  let propertyObject = context.get(propertyKey);
  if (!propertyObject) {
    propertyObject = { id: propertyKey };
  }

  if (getValue(descriptorKey, propertyObject)) {
    throw new Error("duplicate descriptor");
  }

  setValue(descriptorKey, descriptorValue, propertyObject);
  context.set(propertyKey, propertyObject);

  Reflect.defineMetadata(metadataKey, context, target);
};

/*
const modifyParentProperty = (children: {[key: string]: any}, parentProperty: string, property: string | symbol) : any => {
    if (parentProperty in children) {
        children[parentProperty][property] ={id: property, input: {}}
        return children
    } else {
        const keys = Object.keys(children)
        for(var i =0; i< keys.length; i++) {
            children[keys[i]] = modifyParentProperty(children[keys[i]], parentProperty, property)
            return children
        }
    }
    return children
}

export const PropertyParser = (metadataKey: string, parentProperty?: string): PropertyDecorator => {
    return (target, property) => {
      let context = Reflect.getMetadata(metadataKey, target)
      if(!context) {
        context = {id: "root", info: undefined,  input: undefined, children: {} }
        context.children[property] = {id: property, input: {}}
      }
      if (parentProperty) {
          const prevContextValue  = JSON.stringify(context) 
          context.children = modifyParentProperty(context.children, parentProperty, property)
          if (JSON.stringify(context) === prevContextValue) {
              throw new Error(`${parentProperty} not defined. declare it before the child property with @Property decorator.`)
          }
      } else {
          context.children[property] = {id: property, input: {}}
      }
      Reflect.defineMetadata(metadataKey, context, target)
    };
};
*/

export const toSmartUiDescriptor = (metadataKey: string, target: Object): void => {
  const context = Reflect.getMetadata(metadataKey, target) as Map<String, CommonInputTypes>;
  Reflect.defineMetadata(metadataKey, context, target);

  const root = context.get("root");
  context.delete("root");

  let smartUiDescriptor = {
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
    value = getChildFromRoot(key, smartUiDescriptor);
    if (!value) {
      // if not found at root level, error out
      throw new Error("Either child does not exist or child has been assigned to more than one parent");
    }
    root.children.push(value);
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

const getChildFromRoot = (key: String, smartUiDescriptor: Descriptor): CommonInputTypes => {
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
  switch (value.type) {
    case "number":
      if (!value.step || !value.defaultValue || !value.inputType) {
        throw new Error("step, defaultValue and inputType are needed for number type");
      }
      return value as NumberInput;
    case "string":
      return value as StringInput;
    case "boolean":
      if (!value.trueLabel || !value.falseLabel || !value.defaultValue) {
        throw new Error("truelabel, falselabel and defaultValue are needed for boolean type");
      }
      return value as BooleanInput;
    case "enum":
      if (!value.choices || !value.defaultKey) {
        throw new Error("choices and defaultKey are needed for enum type");
      }
      return value as EnumInput;
    default:
      throw new Error("Unknown type");
  }
};
