import { ChoiceItem, Info, InputType, UiType } from "../Explorer/Controls/SmartUi/SmartUiComponent";
import { addPropertyToMap, CommonInputTypes } from "./SelfServeUtils";

type ValueOf<T> = T[keyof T];
interface Decorator {
  name: keyof CommonInputTypes;
  value: ValueOf<CommonInputTypes>;
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

const isNumberInputOptions = (inputOptions: InputOptions): inputOptions is NumberInputOptions => {
  return "min" in inputOptions;
};

const isBooleanInputOptions = (inputOptions: InputOptions): inputOptions is BooleanInputOptions => {
  return "trueLabel" in inputOptions;
};

const isChoiceInputOptions = (inputOptions: InputOptions): inputOptions is ChoiceInputOptions => {
  return "choices" in inputOptions;
};

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

    decorators.map(decorator => addPropertyToMap(target, propertyName, className, decorator.name, decorator.value));
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
    return addToMap(
      { name: "label", value: inputOptions.label },
      { name: "min", value: inputOptions.min },
      { name: "max", value: inputOptions.max },
      { name: "step", value: inputOptions.step },
      { name: "uiType", value: inputOptions.uiType }
    );
  } else if (isBooleanInputOptions(inputOptions)) {
    return addToMap(
      { name: "label", value: inputOptions.label },
      { name: "trueLabel", value: inputOptions.trueLabel },
      { name: "falseLabel", value: inputOptions.falseLabel }
    );
  } else if (isChoiceInputOptions(inputOptions)) {
    return addToMap({ name: "label", value: inputOptions.label }, { name: "choices", value: inputOptions.choices });
  } else {
    return addToMap(
      { name: "label", value: inputOptions.label },
      { name: "placeholder", value: inputOptions.placeholder }
    );
  }
};
