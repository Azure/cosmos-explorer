import {
  Label,
  Min,
  Max,
  Step,
  DefaultKey,
  NumberInputType,
  Choices,
  ParentOf,
  PropertyInfo,
  OnChange,
  TrueLabel,
  FalseLabel,
  Placeholder,
  DefaultNumberValue,
  DefaultBooleanValue,
  CustomElement
} from "../PropertyDescriptors";
import { SmartUi, ClassInfo, OnSubmit } from "../ClassDescriptors";
import {
  getPromise,
  instanceSizeInfo,
  instanceSizeOptions,
  onInstanceCountChange,
  onSubmit,
  renderTextInput,
  Sizes,
  sqlXInfo
} from "./SqlXApis";
import { SelfServeBase } from "../SelfServeUtils";
import { ChoiceItem } from "../../Explorer/Controls/SmartUi/SmartUiComponent";

@SmartUi()
@ClassInfo(getPromise(sqlXInfo))
@OnSubmit(onSubmit)
export class SqlX extends SelfServeBase {
  @Label(getPromise("About"))
  @CustomElement(renderTextInput)
  static about: string;

  @PropertyInfo(getPromise(instanceSizeInfo))
  @Label(getPromise("Instance Size"))
  @Choices(getPromise(instanceSizeOptions))
  @DefaultKey(getPromise(Sizes.OneCore4Gb))
  static instanceSize: ChoiceItem;

  @OnChange(onInstanceCountChange)
  @Label(getPromise("Instance Count"))
  @Min(getPromise(0))
  @Max(getPromise(5))
  @Step(getPromise(1))
  @DefaultNumberValue(getPromise(1))
  @NumberInputType("slider")
  @ParentOf(["instanceSize", "instanceName", "isAllowed"])
  static instanceCount: number;

  @Label("Feature Allowed")
  @DefaultBooleanValue(false)
  @TrueLabel("allowed")
  @FalseLabel("not allowed")
  static isAllowed: boolean;

  @Label("Instance Name")
  @Placeholder("instance name")
  static instanceName: string;
}
