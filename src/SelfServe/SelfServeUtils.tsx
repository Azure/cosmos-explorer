/**
 * @module SelfServe/SelfServeUtils
 */

import "reflect-metadata";
import { userContext } from "../UserContext";
import {
  AnyDisplay,
  BooleanInput,
  ChoiceInput,
  ChoiceItem,
  Description,
  DescriptionDisplay,
  Info,
  InputType,
  InputTypeValue,
  Node,
  NumberInput,
  RefreshParams,
  SelfServeDescriptor,
  SmartUiInput,
  StringInput,
} from "./SelfServeTypes";

/**
 * The type used to identify the Self Serve Class
 */
export enum SelfServeType {
  // Unsupported self serve type passed as feature flag
  invalid = "invalid",
  // Add your self serve types here
  // NOTE: text and casing of the enum's value must match the corresponding file in Localization\en\
  example = "SelfServeExample",
  sqlx = "SqlX",
  graphapicompute = "GraphAPICompute",
  materializedviewsbuilder = "MaterializedViewsBuilder",
}

/**
 * Portal Blade types
 */
export enum BladeType {
  /**
   * Keys blade of a Azure Cosmos DB for NoSQL account.
   */
  SqlKeys = "keys",
  /**
   * Keys blade of a Azure Cosmos DB for MongoDB account.
   */
  MongoKeys = "mongoDbKeys",
  /**
   * Keys blade of a Azure Cosmos DB for Apache Cassandra account.
   */
  CassandraKeys = "cassandraDbKeys",
  /**
   * Keys blade of a Azure Cosmos DB for Apache Gremlin account.
   */
  // TODO This is a obviously a bug, but for now, let's ignore the eslint error
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  GremlinKeys = "keys",
  /**
   * Keys blade of a Azure Cosmos DB for Table account.
   */
  TableKeys = "tableKeys",
  /**
   * Metrics blade of an Azure Cosmos DB account.
   */
  Metrics = "metrics",
}

/**
 * Generate the URL corresponding to the portal blade for the current Azure Cosmos DB account
 */
export const generateBladeLink = (blade: BladeType): string => {
  const subscriptionId = userContext.subscriptionId;
  const resourceGroupName = userContext.resourceGroup;
  const databaseAccountName = userContext.databaseAccount.name;
  return `${document.referrer}#@microsoft.onmicrosoft.com/resource/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDb/databaseAccounts/${databaseAccountName}/${blade}`;
};

/**@internal */
export interface DecoratorProperties {
  id: string;
  info?: (() => Promise<Info>) | Info;
  type?: InputTypeValue;
  labelTKey?: (() => Promise<string>) | string;
  placeholderTKey?: (() => Promise<string>) | string;
  dataFieldName?: string;
  min?: (() => Promise<number>) | number;
  max?: (() => Promise<number>) | number;
  step?: (() => Promise<number>) | number;
  trueLabelTKey?: (() => Promise<string>) | string;
  falseLabelTKey?: (() => Promise<string>) | string;
  choices?: (() => Promise<ChoiceItem[]>) | ChoiceItem[];
  uiType?: string;
  errorMessage?: string;
  description?: (() => Promise<Description>) | Description;
  isDynamicDescription?: boolean;
  refreshParams?: RefreshParams;
  onChange?: (
    newValue: InputType,
    currentState: Map<string, SmartUiInput>,
    baselineValues: ReadonlyMap<string, SmartUiInput>,
  ) => Map<string, SmartUiInput>;
}

/**@internal */
const setValue = <T extends keyof DecoratorProperties, K extends DecoratorProperties[T]>(
  name: T,
  value: K,
  fieldObject: DecoratorProperties,
): void => {
  fieldObject[name] = value;
};

/**@internal */
const getValue = <T extends keyof DecoratorProperties>(name: T, fieldObject: DecoratorProperties): unknown => {
  return fieldObject[name];
};

/**@internal */
export const addPropertyToMap = <T extends keyof DecoratorProperties, K extends DecoratorProperties[T]>(
  target: unknown,
  propertyName: string,
  className: string,
  descriptorName: keyof DecoratorProperties,
  descriptorValue: K,
): void => {
  const context =
    (Reflect.getMetadata(className, target) as Map<string, DecoratorProperties>) ??
    new Map<string, DecoratorProperties>();
  updateContextWithDecorator(context, propertyName, className, descriptorName, descriptorValue);
  Reflect.defineMetadata(className, context, target);
};

/**@internal */
export const updateContextWithDecorator = <T extends keyof DecoratorProperties, K extends DecoratorProperties[T]>(
  context: Map<string, DecoratorProperties>,
  propertyName: string,
  className: string,
  descriptorName: keyof DecoratorProperties,
  descriptorValue: K,
): void => {
  console.log(context);
  console.log(propertyName);
  console.log(className);
  if (!(context instanceof Map)) {
    throw new Error(`@IsDisplayable should be the first decorator for the class '${className}'.`);
  }

  const propertyObject = context.get(propertyName) ?? { id: propertyName };

  if (getValue(descriptorName, propertyObject) && descriptorName !== "type" && descriptorName !== "dataFieldName") {
    throw new Error(
      `Duplicate value passed for '${descriptorName}' on property '${propertyName}' of class '${className}'`,
    );
  }

  setValue(descriptorName, descriptorValue, propertyObject);
  context.set(propertyName, propertyObject);
};

/**@internal */
export const buildSmartUiDescriptor = (className: string, target: unknown): void => {
  const context = Reflect.getMetadata(className, target) as Map<string, DecoratorProperties>;
  const smartUiDescriptor = mapToSmartUiDescriptor(context);
  Reflect.defineMetadata(className, smartUiDescriptor, target);
};

/**@internal */
export const mapToSmartUiDescriptor = (context: Map<string, DecoratorProperties>): SelfServeDescriptor => {
  const inputNames: string[] = [];
  const root = context.get("root");
  context.delete("root");

  const smartUiDescriptor: SelfServeDescriptor = {
    root: {
      id: undefined,
      info: undefined,
      children: [],
    },
    refreshParams: root?.refreshParams,
  };

  while (context.size > 0) {
    const key = context.keys().next().value;
    addToDescriptor(context, smartUiDescriptor.root, key, inputNames);
  }
  smartUiDescriptor.inputNames = inputNames;

  return smartUiDescriptor;
};

/**@internal */
const addToDescriptor = (
  context: Map<string, DecoratorProperties>,
  root: Node,
  key: string,
  inputNames: string[],
): void => {
  const value = context.get(key);
  inputNames.push(value.id);
  const element = {
    id: value.id,
    info: value.info,
    input: getInput(value),
    children: [],
  } as Node;
  context.delete(key);
  root.children.push(element);
};

/**@internal */
const getInput = (value: DecoratorProperties): AnyDisplay => {
  switch (value.type) {
    case "number":
      if (!value.labelTKey || !value.uiType || !value.step || !value.max || value.min === undefined) {
        value.errorMessage = `labelTkey, step, min, max and uiType are required for number input '${value.id}'.`;
      }
      return value as NumberInput;
    case "string":
      if (value.description || value.isDynamicDescription) {
        if (value.description && value.isDynamicDescription) {
          value.errorMessage = `dynamic descriptions should not have defaults set here.`;
        }
        return value as DescriptionDisplay;
      }
      if (!value.labelTKey) {
        value.errorMessage = `labelTKey is required for string input '${value.id}'.`;
      }
      return value as StringInput;
    case "boolean":
      if (!value.labelTKey || !value.trueLabelTKey || !value.falseLabelTKey) {
        value.errorMessage = `labelTkey, trueLabelTKey and falseLabelTKey are required for boolean input '${value.id}'.`;
      }
      return value as BooleanInput;
    default:
      if (!value.labelTKey || !value.choices) {
        value.errorMessage = `labelTKey and choices are required for Choice input '${value.id}'.`;
      }
      return value as ChoiceInput;
  }
};
