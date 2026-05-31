/**
 * @module SelfServe/Decorators
 */

import { TFunction } from "i18next";
import { ChoiceItem, Description, Info, NumberUiType, OnChangeCallback, RefreshParams } from "./SelfServeTypes";
import { addPropertyToMap, buildSmartUiDescriptor, DecoratorProperties, SelfServeType } from "./SelfServeUtils";

type ValueOf<T> = T[keyof T];
interface Decorator {
  name: keyof DecoratorProperties;
  value: ValueOf<DecoratorProperties>;
}

interface InputOptionsBase {
  /**
   * Key used to pickup the string corresponding to the label of the UI element, from the strings JSON file.
   */
  labelTKey: string;
}

/**
 * Numeric input UI element is rendered. The current options are to render it as a slider or a spinner.
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
   * Key used to pickup the string corresponding to the place holder text of the text box, from the strings JSON file.
   */
  placeholderTKey?: (() => Promise<string>) | string;
}

/**
 * Toggle is rendered.
 */
export interface BooleanInputOptions extends InputOptionsBase {
  /**
   * Key used to pickup the string corresponding to the true label of the toggle, from the strings JSON file.
   */
  trueLabelTKey: (() => Promise<string>) | string;
  /**
   * Key used to pickup the string corresponding to the false label of the toggle, from the strings JSON file.
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
   * Key used to pickup the string corresponding to the placeholder text of the dropdown, from the strings JSON file.
   */
  placeholderTKey?: (() => Promise<string>) | string;
}

/**
 * Text is rendered.
 */
export interface DescriptionDisplayOptions {
  /**
   * Optional heading for the text displayed by this description element.
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

/**
 * Interprets the type of the UI element and correspondingly renders
 * - slider or spinner
 * - text box
 * - toggle
 * - drop down
 * - plain text or message bar
 */
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
  console.log(decorators);
  return async (target, property) => {
    let className: string = getTargetName(target);
    const propertyName = property.toString();
    if (className === "Function") {
      //eslint-disable-next-line @typescript-eslint/ban-types
      className = (target as Function).name;
      throw new Error(`Property '${propertyName}' in class '${className}'should be not be static.`);
    }

    const propertyType = (Reflect.getMetadata("design:type", target, property)?.name as string)?.toLowerCase();
    console.log(propertyType);
    addPropertyToMap(target, propertyName, className, "type", propertyType);
    addPropertyToMap(target, propertyName, className, "dataFieldName", propertyName);

    decorators.map((decorator: Decorator) =>
      addPropertyToMap(target, propertyName, className, decorator.name, decorator.value),
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
 * Indicates that the UI element corresponding to the property should have an Info bubble. The Info
 * bubble is the icon that looks like an "i" which users click on to get more information about the UI element.
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
      { name: "uiType", value: inputOptions.uiType },
    );
  } else if (isBooleanInputOptions(inputOptions)) {
    return addToMap(
      { name: "labelTKey", value: inputOptions.labelTKey },
      { name: "trueLabelTKey", value: inputOptions.trueLabelTKey },
      { name: "falseLabelTKey", value: inputOptions.falseLabelTKey },
    );
  } else if (isChoiceInputOptions(inputOptions)) {
    return addToMap(
      { name: "labelTKey", value: inputOptions.labelTKey },
      { name: "placeholderTKey", value: inputOptions.placeholderTKey },
      { name: "choices", value: inputOptions.choices },
    );
  } else if (isDescriptionDisplayOptions(inputOptions)) {
    return addToMap(
      { name: "labelTKey", value: inputOptions.labelTKey },
      { name: "description", value: inputOptions.description },
      { name: "isDynamicDescription", value: inputOptions.isDynamicDescription },
    );
  } else {
    return addToMap(
      { name: "labelTKey", value: inputOptions.labelTKey },
      { name: "placeholderTKey", value: inputOptions.placeholderTKey },
    );
  }
};

/**
 * Indicates to the compiler that UI should be generated from this class.
 */
export const IsDisplayable = (): ClassDecorator => {
  return (target) => {
    let targetName: string = getTargetName(target);
    buildSmartUiDescriptor(targetName, target.prototype);
  };
};

/**
 * If there is a long running operation in your page after the {@linkcode onSave} action, the page can
 * optionally auto refresh itself using the {@linkcode onRefresh} action. The 'RefreshOptions' indicate
 * how often the auto refresh of the page occurs.
 */
export const RefreshOptions = (refreshParams: RefreshParams): ClassDecorator => {
  console.log(refreshParams);
  return (target) => {
    let targetName: string = getTargetName(target);
    addPropertyToMap(target.prototype, "root", targetName, "refreshParams", refreshParams);
  };
};

const getTargetName = (target: TFunction | Object): string => {
  const targetString: string = target.toString();
  let targetName: string;
  if (targetString.includes(SelfServeType.example)) {
    targetName = SelfServeType.example;
  } else if (targetString.includes(SelfServeType.graphapicompute)) {
    targetName = SelfServeType.graphapicompute;
  } else if (targetString.includes(SelfServeType.materializedviewsbuilder)) {
    targetName = SelfServeType.materializedviewsbuilder;
  } else if (targetString.includes(SelfServeType.sqlx)) {
    targetName = SelfServeType.sqlx;
  } else {
    targetName = target.constructor.name;
  }
  return targetName;
};
