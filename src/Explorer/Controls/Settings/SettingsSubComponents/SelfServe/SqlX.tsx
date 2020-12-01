import {
  DataFieldName,
  Label,
  Min,
  Max,
  Step,
  DefaultKey,
  DefaultValue,
  Type,
  NumberInputType,
  Choices,
  ParentOf,
  PropertyInfo
} from "./PropertyDescriptors";
import { Descriptor, EnumItem, Info } from "../../../SmartUi/SmartUiComponent";
import { SmartUi, ClassInfo, SelfServeClass } from "./ClassDescriptors";

@SmartUi()
@SelfServeClass()
@ClassInfo(SqlX.sqlXInfo)
export class SqlX {
  @PropertyInfo(SqlX.instanceSizeInfo)
  @Label("Instance Size")
  @DataFieldName("instanceSize")
  @Choices(SqlX.instanceSizeOptions)
  @DefaultKey("1Core4Gb")
  @Type("enum")
  static instanceSize: any;

  @Label("Instance Count")
  @DataFieldName("instanceCount")
  @Min(1)
  @Max(5)
  @Step(1)
  @DefaultValue(1)
  @NumberInputType("slider")
  @Type("number")
  @ParentOf(["instanceSize"])
  static instanceCount: any;

  static instanceSizeOptions: EnumItem[] = [
    { label: "1Core4Gb", key: "1Core4Gb", value: "1Core4Gb" },
    { label: "2Core8Gb", key: "2Core8Gb", value: "2Core8Gb" },
    { label: "4Core16Gb", key: "4Core16Gb", value: "4Core16Gb" }
  ];

  static sqlXInfo: Info = {
    message: "SqlX is a self serve class"
  };

  static instanceSizeInfo: Info = {
    message: "instance size will be updated in the future"
  };

  public static toSmartUiDescriptor = (): Descriptor => {
    return Reflect.getMetadata(SqlX.name, SqlX) as Descriptor;
  };
}
