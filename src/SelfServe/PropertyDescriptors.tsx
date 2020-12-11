import { ChoiceItem, Descriptor, Info, InputType } from "../Explorer/Controls/SmartUi/SmartUiComponent";
import { addPropertyToMap } from "./SelfServeUtils";

interface Decorator {
  name: string,
  value: any
}

const addToMap = (...decorators: Decorator[]): PropertyDecorator => {
  return (target, property) => {
    const className = (target as Function).name;
    var propertyType = (Reflect.getMetadata("design:type", target, property).name as string).toLowerCase();

    addPropertyToMap(target, property.toString(), className, "type", propertyType);
    addPropertyToMap(target, property.toString(), className, "dataFieldName", property.toString());

    if (!className) {
      throw new Error("property descriptor applied to non static field!");
    }
    decorators.map((decorator: Decorator) => addPropertyToMap(target, property.toString(), className, decorator.name, decorator.value));
  };
};

export const OnChange = (
  onChange: (currentState: Map<string, InputType>, newValue: InputType) => Map<string, InputType>
): PropertyDecorator => {
  return addToMap({name: "onChange", value: onChange});
};

export const CustomElement = (customElement: ((currentValues: Map<string, InputType>) => Promise<JSX.Element>) | JSX.Element): PropertyDecorator => {
  return addToMap({name: "customElement", value: customElement});
};

export const PropertyInfo = (info: (() => Promise<Info>) | Info): PropertyDecorator => {
  return addToMap({name: "info", value: info});
};

export const Placeholder = (placeholder: (() => Promise<string>) | string): PropertyDecorator => {
  return addToMap({name: "placeholder", value: placeholder});
};

export const ParentOf = (children: string[]): PropertyDecorator => {
  return addToMap({name: "parentOf", value: children});
};

export const Label = (label: (() => Promise<string>) | string): PropertyDecorator => {
  return addToMap({name: "label", value: label});
};

export const NumberInput = (min: (() => Promise<number>) | number,
max: (() => Promise<number>) | number,
step: (() => Promise<number>) | number,
numberInputType: string,
defaultNumberValue?: (() => Promise<number>) | number,
): PropertyDecorator => {
  return addToMap(
    {name: "min", value: min},
    {name: "max", value: max},
    {name: "step", value: step},
    {name: "defaultValue", value: defaultNumberValue},
    {name: "inputType", value: numberInputType}
  );
};

export const DefaultStringValue = (defaultStringValue: (() => Promise<string>) | string): PropertyDecorator => {
  return addToMap({name: "defaultValue", value: defaultStringValue});
};

export const BooleanInput = (trueLabel: (() => Promise<string>) | string,
falseLabel: (() => Promise<string>) | string,
defaultBooleanValue?: (() => Promise<boolean>) | boolean): PropertyDecorator => {
  return addToMap(
    {name: "defaultValue", value: defaultBooleanValue},
    {name: "trueLabel", value: trueLabel},
    {name: "falseLabel", value: falseLabel}
  );
};

export const ChoiceInput = (choices: (() => Promise<ChoiceItem[]>) | ChoiceItem[], 
defaultKey?: (() => Promise<string>) | string): PropertyDecorator => {
  return addToMap(
    {name: "choices", value: choices}, 
    {name: "defaultKey", value: defaultKey}
  );
};
