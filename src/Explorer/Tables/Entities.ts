import { ItemDefinition, QueryIterator, Resource } from "@azure/cosmos";

export interface ITableEntity {
  [property: string]: ITableEntityAttribute;
}

export interface ITableEntityForTablesAPI extends ITableEntity {
  PartitionKey: ITableEntityAttribute;
  RowKey: ITableEntityAttribute;
  Timestamp: ITableEntityAttribute;
}

export interface ITableEntityAttribute {
  _: string; // Value of a property
  $?: string; // Edm Type
}

export interface IListTableEntitiesResult {
  Results: ITableEntity[];
  //eslint-disable-next-line
  ContinuationToken: any;
  iterator?: QueryIterator<ItemDefinition & Resource>;
}

export interface IProperty {
  key: string;
  subkey?: string;
  value: string;
}

export interface ITableQuery {
  select?: string[];
  filter?: string;
  top?: number;
}

export interface ITableEntityIdentity {
  RowKey: string;
  PartitionKey?: string;
}
