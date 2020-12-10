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
  renderText,
  Sizes,
  sqlXInfo
} from "./SqlXApis";
import { SelfServeBase } from "../SelfServeUtils";
import { ChoiceItem } from "../../Explorer/Controls/SmartUi/SmartUiComponent";

@SmartUi()
@ClassInfo(getPromise(sqlXInfo))
@OnSubmit(onSubmit)
export class SqlX extends SelfServeBase {

  @Label(getPromise("Description"))
  @CustomElement(renderText("This is the description part of SqlX"))
  static description: string;

  @PropertyInfo(getPromise(instanceSizeInfo))
  @Label(getPromise("Instance Size"))
  @Choices(getPromise(instanceSizeOptions))
  @DefaultKey(getPromise(Sizes.OneCore4Gb))
  static instanceSize: ChoiceItem;

  @Label(getPromise("About"))
  @CustomElement(renderText("This is the about part of SqlX"))
  static about: string;

  @Label("Feature Allowed")
  @DefaultBooleanValue(false)
  @TrueLabel("allowed")
  @FalseLabel("not allowed")
  static isAllowed: boolean;

  @Label("Instance Name")
  @Placeholder("instance name")
  static instanceName: string;

  @OnChange(onInstanceCountChange)
  @Label(getPromise("Instance Count"))
  @Min(getPromise(0))
  @Max(getPromise(5))
  @Step(getPromise(1))
  @DefaultNumberValue(getPromise(1))
  @NumberInputType("slider")
  @ParentOf(["instanceSize", "about", "instanceName", "isAllowed", ])
  static instanceCount: number;
}
