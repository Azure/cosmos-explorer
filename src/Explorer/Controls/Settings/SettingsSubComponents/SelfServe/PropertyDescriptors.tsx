import { ChoiceItem, Info, InputType } from "../../../SmartUi/SmartUiComponent";
import { addPropertyToMap } from "./SelfServeUtils";

const addToMap = (descriptorName: string, descriptorValue: any): PropertyDecorator => {
  return (target, property) => {
    const className = (target as Function).name;
    var propertyType = (Reflect.getMetadata("design:type", target, property).name as string).toLowerCase();

    addPropertyToMap(target, property.toString(), className, "type", propertyType);
    addPropertyToMap(target, property.toString(), className, "dataFieldName", property.toString());

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

export const PropertyInfo = (info: (() => Promise<Info>) | Info): PropertyDecorator => {
  return addToMap("info", info);
};

export const Placeholder = (placeholder: (() => Promise<string>) | string): PropertyDecorator => {
  return addToMap("placeholder", placeholder);
};

export const ParentOf = (children: string[]): PropertyDecorator => {
  return addToMap("parentOf", children);
};

export const Label = (label: (() => Promise<string>) | string): PropertyDecorator => {
  return addToMap("label", label);
};

export const Min = (min: (() => Promise<number>) | number): PropertyDecorator => {
  return addToMap("min", min);
};

export const Max = (max: (() => Promise<number>) | number): PropertyDecorator => {
  return addToMap("max", max);
};

export const Step = (step: (() => Promise<number>) | number): PropertyDecorator => {
  return addToMap("step", step);
};

export const DefaultStringValue = (defaultStringValue: (() => Promise<string>) | string): PropertyDecorator => {
  return addToMap("defaultValue", defaultStringValue);
};

export const DefaultNumberValue = (defaultNumberValue: (() => Promise<number>) | number): PropertyDecorator => {
  return addToMap("defaultValue", defaultNumberValue);
};

export const DefaultBooleanValue = (defaultBooleanValue: (() => Promise<boolean>) | boolean): PropertyDecorator => {
  return addToMap("defaultValue", defaultBooleanValue);
};

export const TrueLabel = (trueLabel: (() => Promise<string>) | string): PropertyDecorator => {
  return addToMap("trueLabel", trueLabel);
};

export const FalseLabel = (falseLabel: (() => Promise<string>) | string): PropertyDecorator => {
  return addToMap("falseLabel", falseLabel);
};

export const Choices = (choices: (() => Promise<ChoiceItem[]>) | ChoiceItem[]): PropertyDecorator => {
  return addToMap("choices", choices);
};

export const DefaultKey = (defaultKey: (() => Promise<string>) | string): PropertyDecorator => {
  return addToMap("defaultKey", defaultKey);
};

export const NumberInputType = (numberInputType: string): PropertyDecorator => {
  return addToMap("inputType", numberInputType);
};
