import { IImageProps, IStackProps } from "@fluentui/react";
import * as _ from "underscore";
import * as TableConstants from "../../../Tables/Constants";
import * as Entities from "../../../Tables/Entities";
import * as Utilities from "../../../Tables/Utilities";

export const defaultStringPlaceHolder = "Enter identifier value.";
export const defaultEntities = [
  {
    property: "PartitionKey",
    type: "String",
    value: "",
    isPropertyTypeDisable: true,
    isDeleteOptionVisible: false,
    id: 1,
    entityValuePlaceholder: defaultStringPlaceHolder,
    isEntityTypeDate: false,
  },
  {
    property: "RowKey",
    type: "String",
    value: "",
    isPropertyTypeDisable: true,
    isDeleteOptionVisible: false,
    id: 2,
    entityValuePlaceholder: defaultStringPlaceHolder,
    isEntityTypeDate: false,
  },
];

// Dropdown options
const { String, Boolean, Binary, DateTime, Double, Guid, Int32, Int64 } = TableConstants.TableType;
export const options = [
  { key: String, text: String },
  { key: Boolean, text: Boolean },
  { key: Binary, text: Binary, disabled: true },
  { key: DateTime, text: DateTime },
  { key: Double, text: Double },
  { key: Guid, text: Guid },
  { key: Int32, text: Int32 },
  { key: Int64, text: Int64 },
];

const {
  Text,
  Ascii,
  Bigint,
  Blob,
  Decimal,
  Float,
  Int,
  Uuid,
  Varchar,
  Varint,
  Inet,
  Smallint,
  Tinyint,
} = TableConstants.CassandraType;
export const cassandraOptions = [
  { key: Text, text: Text },
  { key: Ascii, text: Ascii },
  { key: Bigint, text: Bigint },
  { key: Blob, text: Blob },
  { key: Boolean, text: Boolean },
  { key: Decimal, text: Decimal },
  { key: Double, text: Double },
  { key: Float, text: Float },
  { key: Int, text: Int },
  { key: Uuid, text: Uuid },
  { key: Varchar, text: Varchar },
  { key: Varint, text: Varint },
  { key: Inet, text: Inet },
  { key: Smallint, text: Smallint },
  { key: Tinyint, text: Tinyint },
];

export const imageProps: IImageProps = {
  width: 16,
  height: 30,
};

export const backImageProps: IImageProps = {
  width: 16,
  height: 16,
  className: "backImageIcon",
};
/* Labels */
export const attributeNameLabel = "Property Name";
export const dataTypeLabel = "Type";
export const attributeValueLabel = "Value";
export const addButtonLabel = "Add Property";

// add table entity placeholders
export const detailedHelp = "Enter a name up to 255 characters in size. Most valid C# identifiers are allowed.";
export const booleanPlaceHolder = "Enter true or false.";
export const stringPlaceholder = "Enter a value up to 64 KB in size.";
export const datePlaceholder = "Enter a date and time.";
export const doublePlaceholder = "Enter a 64-bit floating point value.";
export const guidPlaceholder = "Enter a 16-byte (128-bit) GUID value.";
export const intPlaceholder = "Enter a signed 32-bit integer.";
export const int64Placeholder = "Enter a signed 64-bit integer, in the range (-2^53 - 1, 2^53 - 1).";

export const columnProps: Partial<IStackProps> = {
  tokens: { childrenGap: 10 },
  styles: { root: { width: 680 } },
};

// helper functions
export const entityFromAttributes = (entities: EntityRowType[]): Entities.ITableEntity => {
  const entity: { [key: string]: { _: string; $: string } } = {};
  entities.forEach((entityRow: EntityRowType) => {
    if (entityRow) {
      let value = entityRow.value;
      if (entityRow.type === TableConstants.TableType.DateTime && entityRow.entityTimeValue) {
        // Add time in date as time has seperate textfield
        const [hours, minuntes] = entityRow.entityTimeValue.split(":");
        const entityDate = new Date(value);
        entityDate.setHours(+hours);
        entityDate.setMinutes(+minuntes);
        value = entityDate.toString();
      }
      if (entityRow.type === TableConstants.TableType.Int64) {
        value = Utilities.padLongWithZeros(value);
      }
      entity[entityRow.property] = {
        _: value,
        $: entityRow.type,
      };
    }
  });
  return entity;
};

// GetPlaceholder according to entity type
export const getEntityValuePlaceholder = (entityType: string | number): string => {
  switch (entityType) {
    case "String":
      return stringPlaceholder;
    case "Boolean":
      return booleanPlaceHolder;
    case "DateTime":
      return datePlaceholder;
    case "Double":
      return doublePlaceholder;
    case "Guid":
      return guidPlaceholder;
    case "Int32":
      return intPlaceholder;
    case "Int64":
      return int64Placeholder;
    default:
      return "";
  }
};

export const isValidEntities = (entities: EntityRowType[]): boolean => {
  for (let i = 0; i < entities.length; i++) {
    const { property } = entities[i];
    if (property === "" || property === undefined) {
      return false;
    }
  }
  return true;
};

const isEntityPropertyTypeDisable = (header: string): boolean => {
  if (header === "PartitionKey" || header === "RowKey") {
    return true;
  }
  return false;
};

export const getDefaultEntities = (headers: string[], entityTypes: { [key: string]: string }): EntityRowType[] => {
  const defaultEntities: EntityRowType[] = [];
  headers.forEach((header: string) => {
    if (header !== "Timestamp") {
      const entityType = !_.isEmpty(entityTypes) ? entityTypes[header] : "String";
      const entityRow = {
        property: header,
        type: entityType,
        value: "",
        isPropertyTypeDisable: isEntityPropertyTypeDisable(header),
        isDeleteOptionVisible: !isEntityPropertyTypeDisable(header),
        id: 1,
        entityValuePlaceholder: defaultStringPlaceHolder,
        isEntityTypeDate: entityType === "DateTime",
      };
      defaultEntities.push(entityRow);
    }
  });
  return defaultEntities;
};

export const getPanelTitle = (apiType: string): string => {
  if (apiType === "Cassandra") {
    return "Add Table Row";
  }
  return "Add Table Row";
};

export const getAddButtonLabel = (apiType: string): string => {
  if (apiType === "Cassandra") {
    return "Add Row";
  }
  return addButtonLabel;
};

export const getButtonLabel = (apiType: string): string => {
  if (apiType === "Cassandra") {
    return "Add Row";
  }
  return "Add Entity";
};

export const getCassandraDefaultEntities = (
  headers: string[],
  entityTypes: { [key: string]: string }
): EntityRowType[] => {
  const defaultEntities: EntityRowType[] = [];
  headers.forEach((header: string) => {
    const entityRow = {
      property: header,
      type: entityTypes[header],
      value: "",
      isPropertyTypeDisable: true,
      isDeleteOptionVisible: true,
      id: 1,
      entityValuePlaceholder: defaultStringPlaceHolder,
      isEntityTypeDate: entityTypes[header] === "DateTime",
    };
    defaultEntities.push(entityRow);
  });
  return defaultEntities;
};

// Type of entity row
export interface EntityRowType {
  property: string;
  type: string;
  value: string;
  isPropertyTypeDisable: boolean;
  isDeleteOptionVisible: boolean;
  id: number;
  entityValuePlaceholder: string;
  isEntityTypeDate: boolean;
  entityTimeValue?: string;
}
