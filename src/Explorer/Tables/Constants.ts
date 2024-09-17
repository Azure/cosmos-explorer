export const TableType = {
  String: "String",
  Boolean: "Boolean",
  Binary: "Binary",
  DateTime: "DateTime",
  Double: "Double",
  Guid: "Guid",
  Int32: "Int32",
  Int64: "Int64",
};

export const CassandraType = {
  Ascii: "Ascii",
  Bigint: "Bigint",
  Blob: "Blob",
  Boolean: "Boolean",
  Date: "Date",
  Decimal: "Decimal",
  Double: "Double",
  Float: "Float",
  Int: "Int",
  Text: "Text",
  Timestamp: "Timestamp",
  Uuid: "Uuid",
  Varchar: "Varchar",
  Varint: "Varint",
  Inet: "Inet",
  Smallint: "Smallint",
  Tinyint: "Tinyint",

  List_Ascii: "List<Ascii>",
  List_Bigint: "List<Bigint>",
  List_Blob: "List<Blob>",
  List_Boolean: "List<Boolean>",
  List_Date: "List<Date>",
  List_Decimal: "List<Decimal>",
  List_Double: "List<Double>",
  List_Float: "List<Float>",
  List_Int: "List<Int>",
  List_Text: "List<Text>",
  List_Timestamp: "List<Timestamp>",
  List_Uuid: "List<Uuid>",
  List_Varchar: "List<Varchar>",
  List_Varint: "List<Varint>",
  List_Inet: "List<Inet>",
  List_Smallint: "List<Smallint>",
  List_Tinyint: "List<Tinyint>",

  Map_Ascii: "Map<Ascii>",
  Map_Bigint: "Map<Bigint>",
  Map_Blob: "Map<Blob>",
  Map_Boolean: "Map<Boolean>",
  Map_Date: "Map<Date>",
  Map_Decimal: "Map<Decimal>",
  Map_Double: "Map<Double>",
  Map_Float: "Map<Float>",
  Map_Int: "Map<Int>",
  Map_Text: "Map<Text>",
  Map_Timestamp: "Map<Timestamp>",
  Map_Uuid: "Map<Uuid>",
  Map_Varchar: "Map<Varchar>",
  Map_Varint: "Map<Varint>",
  Map_Inet: "Map<Inet>",
  Map_Smallint: "Map<Smallint>",
  Map_Tinyint: "Map<Tinyint>",

  Set_Ascii: "Set<Ascii>",
  Set_Bigint: "Set<Bigint>",
  Set_Blob: "Set<Blob>",
  Set_Boolean: "Set<Boolean>",
  Set_Date: "Set<Date>",
  Set_Decimal: "Set<Decimal>",
  Set_Double: "Set<Double>",
  Set_Float: "Set<Float>",
  Set_Int: "Set<Int>",
  Set_Text: "Set<Text>",
  Set_Timestamp: "Set<Timestamp>",
  Set_Uuid: "Set<Uuid>",
  Set_Varchar: "Set<Varchar>",
  Set_Varint: "Set<Varint>",
  Set_Inet: "Set<Inet>",
  Set_Smallint: "Set<Smallint>",
  Set_Tinyint: "Set<Tinyint>",
};

export const ClauseRule = {
  And: "And",
  Or: "Or",
};

export const Operator = {
  EqualTo: "==",
  GreaterThan: ">",
  GreaterThanOrEqualTo: ">=",
  LessThan: "<",
  LessThanOrEqualTo: "<=",
  NotEqualTo: "<>",
  Equal: "=",
};

export const ODataOperator = {
  EqualTo: "eq",
  GreaterThan: "gt",
  GreaterThanOrEqualTo: "ge",
  LessThan: "lt",
  LessThanOrEqualTo: "le",
  NotEqualTo: "ne",
};

export const timeOptions = {
  lastHour: "Last hour",
  last24Hours: "Last 24 hours",
  last7Days: "Last 7 days",
  last31Days: "Last 31 days",
  last365Days: "Last 365 days",
  currentMonth: "Current month",
  currentYear: "Current year",
  custom: "Custom...",
};

export const htmlSelectors = {
  dataTableSelector: "#storageTable",
  dataTableAllRowsSelector: "#storageTable tbody tr",
  dataTableHeadRowSelector: ".dataTable thead tr",
  dataTableBodyRowSelector: ".dataTable tbody tr",
  dataTableScrollBodySelector: ".dataTables_scrollBody",
  dataTableScrollContainerSelector: ".dataTables_scroll",
  dataTableHeaderTypeSelector: "table thead th",
  dataTablePaginationButtonSelector: ".paginate_button",
  dataTableHeaderTableSelector: "#storageTable_wrapper .dataTables_scrollHeadInner table",
  dataTableBodyTableSelector: "#storageTable_wrapper .dataTables_scrollBody table",
  searchInputField: ".search-input",
  uploadDropdownSelector: "#upload-dropdown",
  navigationDropdownSelector: "#navigation-dropdown",
  addressBarInputSelector: "#address-bar",
  breadCrumbsSelector: "#breadcrumb-list",
  breadCrumbItemsSelector: ".breadcrumb li a",
  paginateSelector: "#storageTable_paginate",
  dataTablesInfoSelector: "#storageTable_info",
  selectAllDropdownSelector: "#select-all-dropdown",
};

export const defaultHeader = " ";

export const EntityKeyNames = {
  PartitionKey: "PartitionKey",
  RowKey: "RowKey",
  Timestamp: "Timestamp",
  Metadata: ".metadata",
  Etag: "etag",
};

export const htmlAttributeNames = {
  dataTableNameAttr: "name_attr",
  dataTableContentTypeAttr: "contentType_attr",
  dataTableSnapshotAttr: "snapshot_attr",
  dataTableRowKeyAttr: "rowKey_attr",
  dataTablePartitionKeyAttr: "partKey_attr",
  dataTableMessageIdAttr: "messageId_attr",
  dataTableHeaderIndex: "data-column-index",
};

export const cssColors = {
  commonControlsButtonActive: "#B4C7DC" /* A darker shade of [{common-controls-button-hover-background}] */,
};

export const clauseGroupColors = ["#ffe1ff", "#fffacd", "#f0ffff", "#ffefd5", "#f0fff0"];
export const transparentColor = "transparent";

export const keyCodes = {
  RightClick: 3,
  Enter: 13,
  Esc: 27,
  Tab: 9,
  LeftArrow: 37,
  UpArrow: 38,
  RightArrow: 39,
  DownArrow: 40,
  Delete: 46,
  A: 65,
  B: 66,
  C: 67,
  D: 68,
  E: 69,
  F: 70,
  G: 71,
  H: 72,
  I: 73,
  J: 74,
  K: 75,
  L: 76,
  M: 77,
  N: 78,
  O: 79,
  P: 80,
  Q: 81,
  R: 82,
  S: 83,
  T: 84,
  U: 85,
  V: 86,
  W: 87,
  X: 88,
  Y: 89,
  Z: 90,
  Period: 190,
  DecimalPoint: 110,
  F1: 112,
  F2: 113,
  F3: 114,
  F4: 115,
  F5: 116,
  F6: 117,
  F7: 118,
  F8: 119,
  F9: 120,
  F10: 121,
  F11: 122,
  F12: 123,
  Dash: 189,
};

export const InputType = {
  Text: "text",
  // Chrome doesn't support datetime, instead, datetime-local is supported.
  DateTime: "datetime-local",
  Number: "number",
};

export const labelToLoadingItemName: Record<string, string> = {
  "Add Row": "Adding row to table",
  "Add Entity": "Adding entity to table",
};
