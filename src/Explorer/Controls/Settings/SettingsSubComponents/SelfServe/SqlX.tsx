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
  DefaultStringValue
} from "./PropertyDescriptors";
import { Descriptor, ChoiceItem, Info, InputType } from "../../../SmartUi/SmartUiComponent";
import { SmartUi, ClassInfo, SelfServeClass, OnSubmit } from "./ClassDescriptors";

const getPromise = <T extends (number | string | boolean | ChoiceItem[] | Info)>(value: T) : () => Promise<T> => {
  const f = async () : Promise<T> => {
    console.log("delay start")
    await SqlX.delay(100)
    console.log("delay end")
    return value
  }
  return f
}
enum Sizes {
  OneCore4Gb = "OneCore4Gb",
  TwoCore8Gb = "TwoCore8Gb",
  FourCore16Gb = "FourCore16Gb"
}

@SmartUi()
@SelfServeClass()
@ClassInfo(getPromise(SqlX.sqlXInfo))
@OnSubmit(SqlX.onSubmit)
export class SqlX {

  public static toSmartUiDescriptor = (): Descriptor => {
    return Reflect.getMetadata(SqlX.name, SqlX) as Descriptor;
  };

  @PropertyInfo(getPromise(SqlX.instanceSizeInfo))
  @Label(getPromise("Instance Size"))
  @Choices(getPromise(SqlX.instanceSizeOptions))
  @DefaultKey(getPromise(Sizes.OneCore4Gb))
  static instanceSize: ChoiceItem;

  @OnChange(SqlX.onInstanceCountChange)
  @Label(getPromise("Instance Count"))
  @Min(getPromise(0))
  @Max(getPromise(5))
  @Step(getPromise(1))
  @DefaultNumberValue(getPromise(1))
  @NumberInputType("slider")
  @ParentOf(["instanceSize", "instanceName", "isAllowed"])
  static instanceCount: number;

  @Label(getPromise("Feature Allowed"))
  @DefaultBooleanValue(getPromise(false))
  @TrueLabel(getPromise("allowed"))
  @FalseLabel(getPromise("not allowed"))
  static isAllowed: boolean;

  @Label(getPromise("Instance Name"))
  @DefaultStringValue(getPromise("asdf"))
  @Placeholder(getPromise("instance name"))
  static instanceName: string;

  static instanceSizeOptions: ChoiceItem[] = [
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

  static delay = (ms: number) => {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }
}

