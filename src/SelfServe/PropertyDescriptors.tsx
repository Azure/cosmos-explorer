import { ChoiceItem, Info, InputType, NumberInputType } from "../Explorer/Controls/SmartUi/SmartUiComponent";
import { addPropertyToMap } from "./SelfServeUtils";

interface Decorator {
  name: string;
  value: unknown;
}

const addToMap = (...decorators: Decorator[]): PropertyDecorator => {
  return (target, property) => {
    const className = (target as Function).name;
    const propertyType = (Reflect.getMetadata("design:type", target, property).name as string).toLowerCase();

    addPropertyToMap(target, property.toString(), className, "type", propertyType);
    addPropertyToMap(target, property.toString(), className, "dataFieldName", property.toString());

    if (!className) {
      throw new Error("property descriptor applied to non static field!");
    }
    decorators.map((decorator: Decorator) =>
      addPropertyToMap(target, property.toString(), className, decorator.name, decorator.value)
    );
  };
};

export const OnChange = (
  onChange: (currentState: Map<string, InputType>, newValue: InputType) => Map<string, InputType>
): PropertyDecorator => {
  return addToMap({ name: "onChange", value: onChange });
};

export const CustomElement = (
  customElement: ((currentValues: Map<string, InputType>) => Promise<JSX.Element>) | JSX.Element
): PropertyDecorator => {
  return addToMap({ name: "customElement", value: customElement });
};

export const PropertyInfo = (info: (() => Promise<Info>) | Info): PropertyDecorator => {
  return addToMap({ name: "info", value: info });
};

export const Placeholder = (placeholder: (() => Promise<string>) | string): PropertyDecorator => {
  return addToMap({ name: "placeholder", value: placeholder });
};

export const ParentOf = (children: string[]): PropertyDecorator => {
  return addToMap({ name: "parentOf", value: children });
};

export const Label = (label: (() => Promise<string>) | string): PropertyDecorator => {
  return addToMap({ name: "label", value: label });
};

export interface NumberInputOptions {
  min: (() => Promise<number>) | number;
  max: (() => Promise<number>) | number;
  step: (() => Promise<number>) | number;
  numberInputType: NumberInputType;
}

export const NumberInput = (numberInputOptions: NumberInputOptions): PropertyDecorator => {
  return addToMap(
    { name: "min", value: numberInputOptions.min },
    { name: "max", value: numberInputOptions.max },
    { name: "step", value: numberInputOptions.step },
    { name: "inputType", value: numberInputOptions.numberInputType }
  );
};

export interface BooleanInputOptions {
  trueLabel: (() => Promise<string>) | string;
  falseLabel: (() => Promise<string>) | string;
}

export const BooleanInput = (booleanInputOptions: BooleanInputOptions): PropertyDecorator => {
  return addToMap(
    { name: "trueLabel", value: booleanInputOptions.trueLabel },
    { name: "falseLabel", value: booleanInputOptions.falseLabel }
  );
};

export const ChoiceInput = (choices: (() => Promise<ChoiceItem[]>) | ChoiceItem[]): PropertyDecorator => {
  return addToMap({ name: "choices", value: choices });
};
