type ContainerTestCase = {
  name: string;
  databaseId: string;
  containerId: string;
  expectedDocumentIds: string[];
};

export const documentTestCases: ContainerTestCase[] = [
  {
    name: "System Partition Key",
    databaseId: "e2etests-sql-readonly",
    containerId: "systemPartitionKey",
    expectedDocumentIds: ["systempartition"],
  },
  {
    name: "Single Partition Key",
    databaseId: "e2etests-sql-readonly",
    containerId: "singlePartitionKey",
    expectedDocumentIds: [
      "singlePartitionKey",
      "singlePartitionKey_empty_string",
      "singlePartitionKey_null",
      "singlePartitionKey_missing",
    ],
  },
  {
    name: "Single Nested Partition Key",
    databaseId: "e2etests-sql-readonly",
    containerId: "singleNestedPartitionKey",
    expectedDocumentIds: [
      "singlePartitionKey_nested",
      "singlePartitionKey_nested_empty_string",
      "singlePartitionKey_nested_null",
      "singlePartitionKey_nested_missing",
    ],
  },
  {
    name: "2-Level Hierarchical Partition Key",
    databaseId: "e2etests-sql-readonly",
    containerId: "twoLevelPartitionKey",
    expectedDocumentIds: [
      "twoLevelPartitionKey_value_empty",
      "twoLevelPartitionKey_value_null",
      "twoLevelPartitionKey_value_missing",
      "twoLevelPartitionKey_empty_null",
      "twoLevelPartitionKey_null_missing",
      "twoLevelPartitionKey_missing_value",
    ],
  },
  {
    name: "2-Level Hierarchical Nested Partition Key",
    databaseId: "e2etests-sql-readonly",
    containerId: "twoLevelNestedPartitionKey",
    expectedDocumentIds: [
      "twoLevelNestedPartitionKey_nested_value_empty",
      "twoLevelNestedPartitionKey_nested_null_missing",
      "twoLevelNestedPartitionKey_nested_missing_value",
    ],
  },
  {
    name: "3-Level Hierarchical Partition Key",
    databaseId: "e2etests-sql-readonly",
    containerId: "threeLevelPartitionKey",
    expectedDocumentIds: [
      "threeLevelPartitionKey_value_empty_null",
      "threeLevelPartitionKey_value_null_missing",
      "threeLevelPartitionKey_value_missing_null",
      "threeLevelPartitionKey_null_empty_value",
      "threeLevelPartitionKey_missing_value_value",
      "threeLevelPartitionKey_empty_value_missing",
    ],
  },
  {
    name: "3-Level Nested Hierarchical Partition Key",
    databaseId: "e2etests-sql-readonly",
    containerId: "threeLevelNestedPartitionKey",
    expectedDocumentIds: [
      "threeLevelNestedPartitionKey_nested_empty_value_null",
      "threeLevelNestedPartitionKey_nested_null_value_missing",
      "threeLevelNestedPartitionKey_nested_missing_value_null",
      "threeLevelNestedPartitionKey_nested_null_empty_missing",
      "threeLevelNestedPartitionKey_nested_value_missing_empty",
      "threeLevelNestedPartitionKey_nested_missing_null_empty",
      "threeLevelNestedPartitionKey_nested_empty_null_value",
      "threeLevelNestedPartitionKey_nested_value_null_empty",
    ],
  },
];
