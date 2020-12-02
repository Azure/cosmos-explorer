import {
  DataFieldName,
  Label,
  Min,
  Max,
  Step,
  DefaultKey,
  DefaultValue,
  NumberInputType,
  Choices,
  ParentOf,
  PropertyInfo,
  OnChange,
  TrueLabel,
  FalseLabel,
  Placeholder
} from "./PropertyDescriptors";
import { Descriptor, EnumItem, Info, InputType } from "../../../SmartUi/SmartUiComponent";
import { SmartUi, ClassInfo, SelfServeClass, OnSubmit } from "./ClassDescriptors";

enum Sizes {
  OneCore4Gb = "OneCore4Gb",
  TwoCore8Gb = "TwoCore8Gb",
  FourCore16Gb = "FourCore16Gb"
}

@SmartUi()
@ClassInfo(SqlX.sqlXInfo)
@OnSubmit(SqlX.onSubmit)
@SelfServeClass()
export class SqlX {
  @PropertyInfo(SqlX.instanceSizeInfo)
  @Label("Instance Size")
  @DataFieldName("instanceSize")
  @Choices(SqlX.instanceSizeOptions)
  @DefaultKey(Sizes.OneCore4Gb)
  static instanceSize: EnumItem;

  @OnChange(SqlX.onInstanceCountChange)
  @Label("Instance Count")
  @DataFieldName("instanceCount")
  @Min(1)
  @Max(5)
  @Step(1)
  @DefaultValue(1)
  @NumberInputType("slider")
  @ParentOf(["instanceSize", "instanceName", "isAllowed"])
  static instanceCount: number;

  @Label("Feature Allowed")
  @DataFieldName("isAllowed")
  @DefaultValue(false)
  @TrueLabel("allowed")
  @FalseLabel("not allowed")
  static isAllowed: boolean;

  @Label("Instance Name")
  @DataFieldName("instanceName")
  @Placeholder("instance name")
  static instanceName: string;

  static instanceSizeOptions: EnumItem[] = [
    { label: Sizes.OneCore4Gb, key: Sizes.OneCore4Gb, value: Sizes.OneCore4Gb },
    { label: Sizes.TwoCore8Gb, key: Sizes.TwoCore8Gb, value: Sizes.TwoCore8Gb },
    { label: Sizes.FourCore16Gb, key: Sizes.FourCore16Gb, value: Sizes.FourCore16Gb }
  ];

  static sqlXInfo: Info = {
    message: "SqlX is a self serve class"
  };

  static instanceSizeInfo: Info = {
    message: "instance size will be updated in the future"
  };

  static onInstanceCountChange = (
    currentState: Map<string, InputType>,
    newValue: InputType
  ): Map<string, InputType> => {
    currentState.set("instanceCount", newValue);
    if ((newValue as number) === 1) {
      currentState.set("isAllowed", false);
    }
    return currentState;
  };

  static onSubmit = async (currentValues: Map<string, InputType>): Promise<void> => {
    console.log(
      "instanceCount:" +
        currentValues.get("instanceCount") +
        ", instanceSize:" +
        currentValues.get("instanceSize") +
        ", instanceName:" +
        currentValues.get("instanceName") +
        ", isAllowed:" +
        currentValues.get("isAllowed")
    );
  };

  public static toSmartUiDescriptor = (): Descriptor => {
    return Reflect.getMetadata(SqlX.name, SqlX) as Descriptor;
  };
}
