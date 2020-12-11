import {
  Label,
  ParentOf,
  PropertyInfo,
  OnChange,
  Placeholder,
  CustomElement,
  DefaultStringValue,
  ChoiceInput,
  BooleanInput,
  NumberInput
} from "../PropertyDescriptors";
import { SmartUi, ClassInfo, OnSubmit, Initialize } from "../ClassDescriptors";
import {
  getPromise,
  initializeSqlX,
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
@Initialize(initializeSqlX)
@OnSubmit(onSubmit)
export class SqlX extends SelfServeBase {

  @Label(getPromise("Description"))
  @CustomElement(renderText("This is the description part of SqlX"))
  static description: string;

  @Label(getPromise("Instance Size"))
  @PropertyInfo(getPromise(instanceSizeInfo))
  //@ChoiceInput(getPromise(instanceSizeOptions), getPromise(Sizes.OneCore4Gb))
  @ChoiceInput(getPromise(instanceSizeOptions))
  static instanceSize: ChoiceItem;

  @Label(getPromise("About"))
  @CustomElement(renderText("This is the about part of SqlX"))
  static about: string;

  @Label("Feature Allowed")
  //@BooleanInput("allowed", "not allowed", false)
  @BooleanInput("allowed", "not allowed")
  static isAllowed: boolean;

  @Label("Instance Name")
  @Placeholder("instance name")
  static instanceName: string;

  @Label(getPromise("Instance Count"))
  @OnChange(onInstanceCountChange)
  @ParentOf(["instanceSize", "about", "instanceName", "isAllowed", ])
  //@NumberInput(getPromise(1), getPromise(5), getPromise(1), "slider", getPromise(0))
  @NumberInput(getPromise(1), getPromise(5), getPromise(1), "slider")
  static instanceCount: number;
}
