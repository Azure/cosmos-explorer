/**
 * @module SelfServe/SelfServeTypes
 */

import { SelfServeType } from "SelfServe/SelfServeUtils";
import { TelemetryData } from "../Shared/Telemetry/TelemetryProcessor";

interface BaseInput {
  dataFieldName: string;
  errorMessage?: string;
  type: InputTypeValue;
  labelTKey?: (() => Promise<string>) | string;
  onChange?: (
    newValue: InputType,
    currentState: Map<string, SmartUiInput>,
    baselineValues: ReadonlyMap<string, SmartUiInput>,
  ) => Map<string, SmartUiInput>;
  placeholderTKey?: (() => Promise<string>) | string;
}

/**@internal */
export interface NumberInput extends BaseInput {
  min: (() => Promise<number>) | number;
  max: (() => Promise<number>) | number;
  step: (() => Promise<number>) | number;
  defaultValue?: number;
  uiType: NumberUiType;
}

/**@internal */
export interface BooleanInput extends BaseInput {
  trueLabelTKey: (() => Promise<string>) | string;
  falseLabelTKey: (() => Promise<string>) | string;
  defaultValue?: boolean;
}

/**@internal */
export interface StringInput extends BaseInput {
  defaultValue?: string;
}

/**@internal */
export interface ChoiceInput extends BaseInput {
  choices: (() => Promise<ChoiceItem[]>) | ChoiceItem[];
  defaultKey?: string;
}

/**@internal */
export interface DescriptionDisplay extends BaseInput {
  description: (() => Promise<Description>) | Description;
}

/**@internal */
export interface Node {
  id: string;
  info?: (() => Promise<Info>) | Info;
  input?: AnyDisplay;
  children?: Node[];
}

/**@internal */
export interface SelfServeDescriptor {
  root: Node;
  initialize?: () => Promise<Map<string, SmartUiInput>>;
  onSave?: (
    currentValues: Map<string, SmartUiInput>,
    baselineValues: ReadonlyMap<string, SmartUiInput>,
  ) => Promise<OnSaveResult>;
  inputNames?: string[];
  onRefresh?: () => Promise<RefreshResult>;
  refreshParams?: RefreshParams;
}

/**@internal */
export enum SelfServeComponentTelemetryType {
  Load = "Load",
  Save = "Save",
}

/**@internal */
export type AnyDisplay = NumberInput | BooleanInput | StringInput | ChoiceInput | DescriptionDisplay;

/**@internal */
export type InputTypeValue = "number" | "string" | "boolean" | "object";

export type initializeCallback =
  /**
   * @returns Promise of Map of propertyName => {@linkcode SmartUiInput} which will become the current state of the UI.
   */
  () => Promise<Map<string, SmartUiInput>>;

export type onSaveCallback =
  /**
   * @param currentValues - The map of propertyName => {@linkcode SmartUiInput} corresponding to the current state of the UI
   * @param baselineValues - The map of propertyName => {@linkcode SmartUiInput} corresponding to the initial state of the UI
   */
  (
    currentValues: Map<string, SmartUiInput>,
    baselineValues: ReadonlyMap<string, SmartUiInput>,
  ) => Promise<OnSaveResult>;

/**
 * All SelfServe feature classes need to derive from the SelfServeBaseClass
 */
export abstract class SelfServeBaseClass {
  /**
   * Sets default values for the properties of the Self Serve Class. Typically, you can make rest calls here
   * to fetch the initial values for the properties. This is also called after the onSave callback, to reinitialize the defaults.
   */
  public abstract initialize: initializeCallback;

  /**
   * Callback that is triggerred when the submit button is clicked. You should perform your rest API
   * calls here using the data from the different inputs passed as a Map to this callback function.
   */
  public abstract onSave: onSaveCallback;

  /**
   * Callback that is triggered when the refresh button is clicked. Here, you should perform the your rest API
   * call to check if the update action is completed.
   */
  public abstract onRefresh: () => Promise<RefreshResult>;

  public abstract getSelfServeType: () => SelfServeType;
  public test: string = "hello";
  /**@internal */
  public toSelfServeDescriptor(): SelfServeDescriptor {
    const className: string = this.getSelfServeType();
    const selfServeDescriptor = Reflect.getMetadata(className, this) as SelfServeDescriptor;

    if (!this.initialize) {
      throw new Error(`initialize() was not declared for the class '${className}'`);
    }
    if (!this.onSave) {
      throw new Error(`onSave() was not declared for the class '${className}'`);
    }
    if (!this.onRefresh) {
      throw new Error(`onRefresh() was not declared for the class '${className}'`);
    }
    if (!selfServeDescriptor?.root) {
      throw new Error(`@IsDisplayable decorator was not declared for the class '${className}'`);
    }

    selfServeDescriptor.initialize = this.initialize;
    selfServeDescriptor.onSave = this.onSave;
    selfServeDescriptor.onRefresh = this.onRefresh;
    selfServeDescriptor.root.id = className;

    return selfServeDescriptor;
  }
}

/**
 * Function that dictates how the overall UI should transform when the UI element corresponding to a property, say prop1, is changed.
 * The callback can be used to\
 *           * Change the value (and reflect it in the UI) for another property, say prop2\
 *           * Change the visibility for prop2 in the UI\
 *           * Disable or enable the UI element corresponding to prop2\
 * depending on logic based on the newValue of prop1, the currentValues Map and baselineValues Map.
 */
export type OnChangeCallback =
  /**
   * @param newValue - The newValue that the property needs to be set to, after the change in the UI element corresponding to this property.
   * @param currentValues - The map of propertyName => {@linkcode SmartUiInput} corresponding to the current state of the UI.
   * @param baselineValues - The map of propertyName => {@linkcode SmartUiInput} corresponding to the initial state of the UI.
   * @returns A new Map of propertyName => {@linkcode SmartUiInput} corresponding to the new state of the overall UI
   */
  (
    newValue: InputType,
    currentValues: Map<string, SmartUiInput>,
    baselineValues: ReadonlyMap<string, SmartUiInput>,
  ) => Map<string, SmartUiInput>;

export enum NumberUiType {
  /**
   * The numeric input UI element corresponding to the property is a Spinner
   */
  Spinner = "Spinner",
  /**
   * The numeric input UI element corresponding to the property is a Slider
   */
  Slider = "Slider",
}

export type ChoiceItem = {
  /**
   * Key used to pickup the string corresponding to the label of the dropdown choice item, from the strings JSON file.
   */
  labelTKey: string;
  /**
   * Key used to pickup the string that uniquely identifies the dropdown choice item, from the strings JSON file.
   */
  key: string;
};

export type InputType = number | string | boolean | ChoiceItem | Description;

/**
 * Data to be shown within the info bubble of the property.
 */
export interface Info {
  /**
   * Key used to pickup the string corresponding to the text to be shown within the info bubble, from the strings JSON file.
   */
  messageTKey: string;
  /**
   * Optional link to be shown within the info bubble, after the text.
   */
  link?: {
    /**
     * The URL of the link
     */
    href: string;
    /**
     * Key used to pickup the string corresponding to the text of the link, from the strings JSON file.
     */
    textTKey: string;
  };
}

export enum DescriptionType {
  /**
   * Show the description as a text
   */
  Text,
  /**
   * Show the description as a Info Message bar.
   */
  InfoMessageBar,
  /**
   * Show the description as a Warning Message bar.
   */
  WarningMessageBar,
}

/**
 * Data to be shown as a description.
 */
export interface Description {
  /**
   * Key used to pickup the string corresponding to the text to be shown as part of the description, from the strings JSON file.
   */
  textTKey: string;
  type: DescriptionType;
  /**
   * Optional link to be shown as part of the description, after the text.
   */
  link?: {
    /**
     * The URL of the link
     */
    href: string;
    /**
     * Key used to pickup the string corresponding to the text of the link, from the strings JSON file.
     */
    textTKey: string;
  };
}

export interface SmartUiInput {
  /**
   * The value to be set for the UI element corresponding to the property
   */
  value: InputType;
  /**
   * Indicates whether the UI element corresponding to the property is hidden
   */
  hidden?: boolean;
  /**
   * Indicates whether the UI element corresponding to the property is disabled
   */
  disabled?: boolean;
}

export interface OnSaveResult {
  /**
   * The polling url returned by the RP call.
   */
  operationStatusUrl: string;
  /**
   * Notifications that need to be shown on the portal for different stages of a scenario (initialized, success/failure).
   */
  portalNotification?: {
    /**
     * Notification that need to be shown when the save operation has been triggered.
     */
    initialize: {
      /**
       * Key used to pickup the string corresponding to the notification title, from the strings JSON file.
       */
      titleTKey: string;
      /**
       * Key used to pickup the string corresponding to the notification message, from the strings JSON file.
       */
      messageTKey: string;
    };
    /**
     * Notification that need to be shown when the save operation has successfully completed.
     */
    success: {
      /**
       * Key used to pickup the string corresponding to the notification title, from the strings JSON file.
       */
      titleTKey: string;
      /**
       * Key used to pickup the string corresponding to the notification message, from the strings JSON file.
       */
      messageTKey: string;
    };
    /**
     * Notification that need to be shown when the save operation failed.
     */
    failure: {
      /**
       * Key used to pickup the string corresponding to the notification title, from the strings JSON file.
       */
      titleTKey: string;
      /**
       * Key used to pickup the string corresponding to the notification message, from the strings JSON file.
       */
      messageTKey: string;
    };
  };
}

export interface RefreshResult {
  /**
   * Indicate if the update is still ongoing
   */
  isUpdateInProgress: boolean;

  /**
   * Key used to pickup the string corresponding to the message that will be shown on the UI if the update is still ongoing, from the strings JSON file.
   * Will be shown only if {@linkcode isUpdateInProgress} is true.
   */
  updateInProgressMessageTKey: string;
}

export interface RefreshParams {
  /**
   * The time interval between refresh attempts when an update in ongoing
   */
  retryIntervalInMs: number;
}

export interface SelfServeTelemetryMessage extends TelemetryData {
  /**
   * The className used to identify a SelfServe telemetry record
   */
  selfServeClassName: string;
}
