import { DataFieldName, Label, Min, Max, Step, DefaultKey, DefaultValue, Property, Type, NumberInputType, Choices } from "./SelfServeTypes";
import { EnumItem } from "../../../SmartUi/SmartUiComponent";
const SqlXRoot = 'SqlXRoot';

export class SqlX {
    @Label(SqlXRoot, "Instance Count")
    @DataFieldName(SqlXRoot, "instanceCount")
    @Min(SqlXRoot, 1)
    @Max(SqlXRoot, 5)
    @Step(SqlXRoot, 1)
    @DefaultValue(SqlXRoot, 1)
    @NumberInputType(SqlXRoot, "slider")
    @Type(SqlXRoot, "number")
    @Property(SqlXRoot)
    static instanceCount: any;

    @Label(SqlXRoot, "Instance Size")
    @DataFieldName(SqlXRoot, "instanceSize")
    @Choices(SqlXRoot, SqlX.instanceTypeOptions)
    @DefaultKey(SqlXRoot, "1Core4Gb")
    @Type(SqlXRoot, "enum")
    @Property(SqlXRoot)
    static instanceType: any;

    static instanceTypeOptions : EnumItem[] = [
        { label: "1Core4Gb", key: "1Core4Gb", value: "1Core4Gb" },
        { label: "2Core8Gb", key: "2Core8Gb", value: "2Core8Gb" },
        { label: "4Core16Gb", key: "4Core16Gb", value: "4Core16Gb" }
      ]
      
    public static toJson = () : any => {
        return Reflect.getMetadata(SqlXRoot, SqlX)
    }
}