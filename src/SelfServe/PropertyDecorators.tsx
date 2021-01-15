import { ChoiceItem, Info, InputType, UiType } from "../Explorer/Controls/SmartUi/SmartUiComponent";
import { addPropertyToMap } from "./SelfServeUtils";

interface Decorator {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
}

interface InputOptionsBase {
  label: string;
}

export interface NumberInputOptions extends InputOptionsBase {
  min: (() => Promise<number>) | number;
  max: (() => Promise<number>) | number;
  step: (() => Promise<number>) | number;
  uiType: UiType;
}

export interface StringInputOptions extends InputOptionsBase {
  placeholder?: (() => Promise<string>) | string;
}

export interface BooleanInputOptions extends InputOptionsBase {
  trueLabel: (() => Promise<string>) | string;
  falseLabel: (() => Promise<string>) | string;
}

export interface ChoiceInputOptions extends InputOptionsBase {
  choices: (() => Promise<ChoiceItem[]>) | ChoiceItem[];
}

type InputOptions = NumberInputOptions | StringInputOptions | BooleanInputOptions | ChoiceInputOptions;

function isNumberInputOptions(inputOptions: InputOptions): inputOptions is NumberInputOptions {
  return !!(inputOptions as NumberInputOptions).min;
}

function isBooleanInputOptions(inputOptions: InputOptions): inputOptions is BooleanInputOptions {
  return !!(inputOptions as BooleanInputOptions).trueLabel;
}

function isChoiceInputOptions(inputOptions: InputOptions): inputOptions is ChoiceInputOptions {
  return !!(inputOptions as ChoiceInputOptions).choices;
}

const addToMap = (...decorators: Decorator[]): PropertyDecorator => {
  return (target, property) => {
    let className = target.constructor.name;
    const propertyName = property.toString();
    if (className === "Function") {
      //eslint-disable-next-line @typescript-eslint/ban-types
      className = (target as Function).name;
      throw new Error(`Property '${propertyName}' in class '${className}'should be not be static.`);
    }

    const propertyType = (Reflect.getMetadata("design:type", target, property)?.name as string)?.toLowerCase();
    addPropertyToMap(target, propertyName, className, "type", propertyType);
    addPropertyToMap(target, propertyName, className, "dataFieldName", propertyName);

    decorators.map((decorator: Decorator) =>
      addPropertyToMap(target, propertyName, className, decorator.name, decorator.value)
    );
  };
};

export const OnChange = (
  onChange: (currentState: Map<string, InputType>, newValue: InputType) => Map<string, InputType>
): PropertyDecorator => {
  return addToMap({ name: "onChange", value: onChange });
};

export const PropertyInfo = (info: (() => Promise<Info>) | Info): PropertyDecorator => {
  return addToMap({ name: "info", value: info });
};

export const Values = (inputOptions: InputOptions): PropertyDecorator => {
  if (isNumberInputOptions(inputOptions)) {
    const numberInputOptions = inputOptions as NumberInputOptions;
    return addToMap(
      { name: "label", value: numberInputOptions.label },
      { name: "min", value: numberInputOptions.min },
      { name: "max", value: numberInputOptions.max },
      { name: "step", value: numberInputOptions.step },
      { name: "uiType", value: numberInputOptions.uiType }
    );
  } else if (isBooleanInputOptions(inputOptions)) {
    const booleanInputOptions = inputOptions as BooleanInputOptions;
    return addToMap(
      { name: "label", value: booleanInputOptions.label },
      { name: "trueLabel", value: booleanInputOptions.trueLabel },
      { name: "falseLabel", value: booleanInputOptions.falseLabel }
    );
  } else if (isChoiceInputOptions(inputOptions)) {
    const choiceInputOptions = inputOptions as ChoiceInputOptions;
    return addToMap(
      { name: "label", value: choiceInputOptions.label },
      { name: "choices", value: choiceInputOptions.choices }
    );
  } else {
    const stringInputOptions = inputOptions as StringInputOptions;
    return addToMap(
      { name: "label", value: stringInputOptions.label },
      { name: "placeholder", value: stringInputOptions.placeholder }
    );
  }
};
