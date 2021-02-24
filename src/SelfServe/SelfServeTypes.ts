interface BaseInput {
  dataFieldName: string;
  errorMessage?: string;
  type: InputTypeValue;
  labelTKey?: (() => Promise<string>) | string;
  onChange?: (
    currentState: Map<string, SmartUiInput>,
    newValue: InputType,
    baselineValues: ReadonlyMap<string, SmartUiInput>
  ) => Map<string, SmartUiInput>;
  placeholderTKey?: (() => Promise<string>) | string;
}

export interface NumberInput extends BaseInput {
  min: (() => Promise<number>) | number;
  max: (() => Promise<number>) | number;
  step: (() => Promise<number>) | number;
  defaultValue?: number;
  uiType: NumberUiType;
}

export interface BooleanInput extends BaseInput {
  trueLabelTKey: (() => Promise<string>) | string;
  falseLabelTKey: (() => Promise<string>) | string;
  defaultValue?: boolean;
}

export interface StringInput extends BaseInput {
  defaultValue?: string;
}

export interface ChoiceInput extends BaseInput {
  choices: (() => Promise<ChoiceItem[]>) | ChoiceItem[];
  defaultKey?: string;
}

export interface DescriptionDisplay extends BaseInput {
  description: (() => Promise<Description>) | Description;
}

export interface Node {
  id: string;
  info?: (() => Promise<Info>) | Info;
  input?: AnyDisplay;
  children?: Node[];
}

export interface SelfServeDescriptor {
  root: Node;
  initialize?: () => Promise<Map<string, SmartUiInput>>;
  onSave?: (
    currentValues: Map<string, SmartUiInput>,
    baselineValues: ReadonlyMap<string, SmartUiInput>
  ) => Promise<OnSavePortalNotification>;
  inputNames?: string[];
  onRefresh?: () => Promise<RefreshResult>;
}

export type AnyDisplay = NumberInput | BooleanInput | StringInput | ChoiceInput | DescriptionDisplay;

export abstract class SelfServeBaseClass {
  public abstract initialize: () => Promise<Map<string, SmartUiInput>>;
  public abstract onSave: (
    currentValues: Map<string, SmartUiInput>,
    baselineValues: ReadonlyMap<string, SmartUiInput>
  ) => Promise<OnSavePortalNotification>;
  public abstract onRefresh: () => Promise<RefreshResult>;

  public toSelfServeDescriptor(): SelfServeDescriptor {
    const className = this.constructor.name;
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
      throw new Error(`@SmartUi decorator was not declared for the class '${className}'`);
    }

    selfServeDescriptor.initialize = this.initialize;
    selfServeDescriptor.onSave = this.onSave;
    selfServeDescriptor.onRefresh = this.onRefresh;
    return selfServeDescriptor;
  }
}

export type InputTypeValue = "number" | "string" | "boolean" | "object";

export enum NumberUiType {
  Spinner = "Spinner",
  Slider = "Slider",
}

export type ChoiceItem = { label: string; key: string };

export type InputType = number | string | boolean | ChoiceItem | Description;

export interface Info {
  messageTKey: string;
  link?: {
    href: string;
    textTKey: string;
  };
}

export interface Description {
  textTKey: string;
  link?: {
    href: string;
    textTKey: string;
  };
}

export interface SmartUiInput {
  value: InputType;
  hidden?: boolean;
  disabled?: boolean;
}

export enum PortalNotificationType {
  InProgress = "InProgress",
  Success = "Success",
  Failure = "Failure",
}

interface PortalNotification {
  titleTKey: string;
  messageTKey: string;
}

export interface OnSavePortalNotification extends PortalNotification {
  type: PortalNotificationType.InProgress | PortalNotificationType.Failure;
}

export interface OnRefreshPortalNotification extends PortalNotification {
  type: PortalNotificationType.Success | PortalNotificationType.Failure;
}

export interface RefreshResult {
  isUpdateInProgress: boolean;
  updateInProgressMessageTKey?: string;
  updateCompletedMessage?: OnRefreshPortalNotification;
}
