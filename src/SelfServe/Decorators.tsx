import { ChoiceItem, Description, Info, InputType, NumberUiType, SmartUiInput } from "./SelfServeTypes";
import { addPropertyToMap, DecoratorProperties, buildSmartUiDescriptor } from "./SelfServeUtils";

type ValueOf<T> = T[keyof T];
interface Decorator {
  name: keyof DecoratorProperties;
  value: ValueOf<DecoratorProperties>;
}

interface InputOptionsBase {
  labelTKey: string;
}

export interface NumberInputOptions extends InputOptionsBase {
  min: (() => Promise<number>) | number;
  max: (() => Promise<number>) | number;
  step: (() => Promise<number>) | number;
  uiType: NumberUiType;
}

export interface StringInputOptions extends InputOptionsBase {
  placeholderTKey?: (() => Promise<string>) | string;
}

export interface BooleanInputOptions extends InputOptionsBase {
  trueLabelTKey: (() => Promise<string>) | string;
  falseLabelTKey: (() => Promise<string>) | string;
}

export interface ChoiceInputOptions extends InputOptionsBase {
  choices: (() => Promise<ChoiceItem[]>) | ChoiceItem[];
  placeholderTKey?: (() => Promise<string>) | string;
}

export interface DescriptionDisplayOptions {
  labelTKey?: string;
  description?: (() => Promise<Description>) | Description;
}

type InputOptions =
  | NumberInputOptions
  | StringInputOptions
  | BooleanInputOptions
  | ChoiceInputOptions
  | DescriptionDisplayOptions;

const isNumberInputOptions = (inputOptions: InputOptions): inputOptions is NumberInputOptions => {
  return "min" in inputOptions;
};

const isBooleanInputOptions = (inputOptions: InputOptions): inputOptions is BooleanInputOptions => {
  return "trueLabelTKey" in inputOptions;
};

const isChoiceInputOptions = (inputOptions: InputOptions): inputOptions is ChoiceInputOptions => {
  return "choices" in inputOptions;
};

const isDescriptionDisplayOptions = (inputOptions: InputOptions): inputOptions is DescriptionDisplayOptions => {
  return "description" in inputOptions;
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

    decorators.map((decorator: Decorator) =>
      addPropertyToMap(target, propertyName, className, decorator.name, decorator.value)
    );
  };
};

export const OnChange = (
  onChange: (
    currentState: Map<string, SmartUiInput>,
    newValue: InputType,
    baselineValues: ReadonlyMap<string, SmartUiInput>
  ) => Map<string, SmartUiInput>
): PropertyDecorator => {
  return addToMap({ name: "onChange", value: onChange });
};

export const PropertyInfo = (info: (() => Promise<Info>) | Info): PropertyDecorator => {
  return addToMap({ name: "info", value: info });
};

export const Values = (inputOptions: InputOptions): PropertyDecorator => {
  if (isNumberInputOptions(inputOptions)) {
    return addToMap(
      { name: "labelTKey", value: inputOptions.labelTKey },
      { name: "min", value: inputOptions.min },
      { name: "max", value: inputOptions.max },
      { name: "step", value: inputOptions.step },
      { name: "uiType", value: inputOptions.uiType }
    );
  } else if (isBooleanInputOptions(inputOptions)) {
    return addToMap(
      { name: "labelTKey", value: inputOptions.labelTKey },
      { name: "trueLabelTKey", value: inputOptions.trueLabelTKey },
      { name: "falseLabelTKey", value: inputOptions.falseLabelTKey }
    );
  } else if (isChoiceInputOptions(inputOptions)) {
    return addToMap(
      { name: "labelTKey", value: inputOptions.labelTKey },
      { name: "placeholderTKey", value: inputOptions.placeholderTKey },
      { name: "choices", value: inputOptions.choices }
    );
  } else if (isDescriptionDisplayOptions(inputOptions)) {
    return addToMap(
      { name: "labelTKey", value: inputOptions.labelTKey },
      { name: "description", value: inputOptions.description }
    );
  } else {
    return addToMap(
      { name: "labelTKey", value: inputOptions.labelTKey },
      { name: "placeholderTKey", value: inputOptions.placeholderTKey }
    );
  }
};

export const IsDisplayable = (): ClassDecorator => {
  return (target) => {
    buildSmartUiDescriptor(target.name, target.prototype);
  };
};

export const ClassInfo = (info: (() => Promise<Info>) | Info): ClassDecorator => {
  return (target) => {
    addPropertyToMap(target.prototype, "root", target.name, "info", info);
  };
};
