/**
 * @module SelfServe/Decorators
 */

import { ChoiceItem, Description, Info, NumberUiType, OnChangeCallback, RefreshParams } from "./SelfServeTypes";
import { addPropertyToMap, buildSmartUiDescriptor, DecoratorProperties } from "./SelfServeUtils";

type ValueOf<T> = T[keyof T];
interface Decorator {
  name: keyof DecoratorProperties;
  value: ValueOf<DecoratorProperties>;
}

interface InputOptionsBase {
  /**
   * Translation key corresponding to the label of the UI element
   */
  labelTKey: string;
}

/**
 * Numeric input UI element is rendered.
 */
export interface NumberInputOptions extends InputOptionsBase {
  /**
   * Min value of the numeric input UI element
   */
  min: (() => Promise<number>) | number;
  /**
   * Max value of the numeric input UI element
   */
  max: (() => Promise<number>) | number;
  /**
   * Value by which the numeric input is incremented or decremented in the UI.
   */
  step: (() => Promise<number>) | number;
  /**
   * The type of the numeric input UI element
   */
  uiType: NumberUiType;
}

/**
 * Text box is rendered.
 */
export interface StringInputOptions extends InputOptionsBase {
  /**
   * Translation key corresponding to the place holder text of the text box.
   */
  placeholderTKey?: (() => Promise<string>) | string;
}

/**
 * Toggle is rendered.
 */
export interface BooleanInputOptions extends InputOptionsBase {
  /**
   * Translation key corresponding to the true label of the toggle
   */
  trueLabelTKey: (() => Promise<string>) | string;
  /**
   * Translation key corresponding to the false label of the toggle
   */
  falseLabelTKey: (() => Promise<string>) | string;
}

/**
 * Dropdown is rendered.
 */
export interface ChoiceInputOptions extends InputOptionsBase {
  /**
   * Choices to be shown in the dropdown
   */
  choices: (() => Promise<ChoiceItem[]>) | ChoiceItem[];
  /**
   * Translation key corresponding to the placeholder text of the dropdown.
   */
  placeholderTKey?: (() => Promise<string>) | string;
}

/**
 * Text is rendered.
 */
export interface DescriptionDisplayOptions {
  /**
   * Optional label for the text description
   */
  labelTKey?: string;
  /**
   * Static description to be shown as text.
   */
  description?: (() => Promise<Description>) | Description;
  /**
   * If true, Indicates that the Description will be populated dynamically and that it may not be present in some scenarios.
   */
  isDynamicDescription?: boolean;
}

export type InputOptions =
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
  return "description" in inputOptions || "isDynamicDescription" in inputOptions;
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

/**
 * Indicates the callback to be fired when the UI element corresponding to the property is changed.
 */
export const OnChange = (onChange: OnChangeCallback): PropertyDecorator => {
  return addToMap({ name: "onChange", value: onChange });
};

/**
 * Indicates that the UI element corresponding to the property should have an Info bubble.
 */
export const PropertyInfo = (info: (() => Promise<Info>) | Info): PropertyDecorator => {
  return addToMap({ name: "info", value: info });
};

/**
 * Indicates that this property should correspond to a UI element with the given parameters.
 */
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
      { name: "description", value: inputOptions.description },
      { name: "isDynamicDescription", value: inputOptions.isDynamicDescription }
    );
  } else {
    return addToMap(
      { name: "labelTKey", value: inputOptions.labelTKey },
      { name: "placeholderTKey", value: inputOptions.placeholderTKey }
    );
  }
};

/**
 * Indicates to the compiler that UI should be generated from this class.
 */
export const IsDisplayable = (): ClassDecorator => {
  return (target) => {
    buildSmartUiDescriptor(target.name, target.prototype);
  };
};

/**
 * Indicates how often the auto refresh of the component should take place
 */
export const RefreshOptions = (refreshParams: RefreshParams): ClassDecorator => {
  return (target) => {
    addPropertyToMap(target.prototype, "root", target.name, "refreshParams", refreshParams);
  };
};
