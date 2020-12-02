import { EnumItem, Info, InputType } from "../../../SmartUi/SmartUiComponent";
import { addPropertyToMap } from "./SelfServeUtils";

const addToMap = (descriptorName: string, descriptorValue: any): PropertyDecorator => {
  return (target, property) => {
    const className = (target as Function).name;
    var propertyType = Reflect.getMetadata("design:type", target, property);
    addPropertyToMap(target, property.toString(), className, "type", propertyType.name);

    if (!className) {
      throw new Error("property descriptor applied to non static field!");
    }
    addPropertyToMap(target, property.toString(), className, descriptorName, descriptorValue);
  };
};

export const OnChange = (
  onChange: (currentState: Map<string, InputType>, newValue: InputType) => Map<string, InputType>
): PropertyDecorator => {
  return addToMap("onChange", onChange);
};

export const PropertyInfo = (info: Info): PropertyDecorator => {
  return addToMap("info", info);
};

export const Placeholder = (placeholder: string): PropertyDecorator => {
  return addToMap("placeholder", placeholder);
};

export const ParentOf = (children: string[]): PropertyDecorator => {
  return addToMap("parentOf", children);
};

export const Label = (label: string): PropertyDecorator => {
  return addToMap("label", label);
};

export const DataFieldName = (dataFieldName: string): PropertyDecorator => {
  return addToMap("dataFieldName", dataFieldName);
};

export const Min = (min: number): PropertyDecorator => {
  return addToMap("min", min);
};

export const Max = (max: number): PropertyDecorator => {
  return addToMap("max", max);
};

export const Step = (step: number): PropertyDecorator => {
  return addToMap("step", step);
};

export const DefaultValue = (defaultValue: any): PropertyDecorator => {
  return addToMap("defaultValue", defaultValue);
};

export const TrueLabel = (trueLabel: string): PropertyDecorator => {
  return addToMap("trueLabel", trueLabel);
};

export const FalseLabel = (falseLabel: string): PropertyDecorator => {
  return addToMap("falseLabel", falseLabel);
};

export const Choices = (choices: EnumItem[]): PropertyDecorator => {
  return addToMap("choices", choices);
};

export const DefaultKey = (defaultKey: string): PropertyDecorator => {
  return addToMap("defaultKey", defaultKey);
};

export const NumberInputType = (numberInputType: string): PropertyDecorator => {
  return addToMap("inputType", numberInputType);
};
