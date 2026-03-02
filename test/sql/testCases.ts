import { DocumentTestCase } from "../testData";

export const documentTestCases: DocumentTestCase[] = [
  {
    name: "System Partition Key",
    databaseId: "e2etests-sql-readonly",
    containerId: "systemPartitionKey",
    documents: [
      {
        documentId: "systempartition",
        partitionKeys: [{ key: "/_partitionKey", value: "partitionKey" }],
        skipCreateDelete: true,
      },
      {
        documentId: "systempartition_empty",
        partitionKeys: [{ key: "/_partitionKey", value: "" }],
        skipCreateDelete: true,
      },
      {
        documentId: "systempartition_null",
        partitionKeys: [{ key: "/_partitionKey", value: null }],
        skipCreateDelete: true,
      },
      { documentId: "systempartition_missing", partitionKeys: [] },
    ],
  },
  {
    name: "Single Partition Key",
    databaseId: "e2etests-sql-readonly",
    containerId: "singlePartitionKey",
    documents: [
      {
        documentId: "singlePartitionKey",
        partitionKeys: [{ key: "/singlePartitionKey", value: "singlePartitionKey" }],
      },
      {
        documentId: "singlePartitionKey_empty_string",
        partitionKeys: [{ key: "/singlePartitionKey", value: "" }],
      },
      {
        documentId: "singlePartitionKey_null",
        partitionKeys: [{ key: "/singlePartitionKey", value: null }],
      },
      {
        documentId: "singlePartitionKey_missing",
        partitionKeys: [],
      },
    ],
  },
  {
    name: "Single Nested Partition Key",
    databaseId: "e2etests-sql-readonly",
    containerId: "singleNestedPartitionKey",
    documents: [
      {
        documentId: "singlePartitionKey_nested",
        partitionKeys: [{ key: "/singlePartitionKey/nested", value: "nestedValue" }],
      },
      {
        documentId: "singlePartitionKey_nested_empty_string",
        partitionKeys: [{ key: "/singlePartitionKey/nested", value: "" }],
      },
      {
        documentId: "singlePartitionKey_nested_null",
        partitionKeys: [{ key: "/singlePartitionKey/nested", value: null }],
      },
      {
        documentId: "singlePartitionKey_nested_missing",
        partitionKeys: [],
      },
    ],
  },
  {
    name: "2-Level Hierarchical Partition Key",
    databaseId: "e2etests-sql-readonly",
    containerId: "twoLevelPartitionKey",
    documents: [
      {
        documentId: "twoLevelPartitionKey_value_empty",
        partitionKeys: [
          { key: "/twoLevelPartitionKey_1", value: "value" },
          { key: "/twoLevelPartitionKey_2", value: "" },
        ],
      },
      {
        documentId: "twoLevelPartitionKey_value_null",
        partitionKeys: [
          { key: "/twoLevelPartitionKey_1", value: "value" },
          { key: "/twoLevelPartitionKey_2", value: null },
        ],
      },
      {
        documentId: "twoLevelPartitionKey_value_missing",
        partitionKeys: [{ key: "/twoLevelPartitionKey_1", value: "value" }],
      },
      {
        documentId: "twoLevelPartitionKey_empty_null",
        partitionKeys: [
          { key: "/twoLevelPartitionKey_1", value: "" },
          { key: "/twoLevelPartitionKey_2", value: null },
        ],
      },
      {
        documentId: "twoLevelPartitionKey_null_missing",
        partitionKeys: [{ key: "/twoLevelPartitionKey_1", value: null }],
      },
      {
        documentId: "twoLevelPartitionKey_missing_value",
        partitionKeys: [{ key: "/twoLevelPartitionKey_2", value: "value" }],
      },
    ],
  },
  {
    name: "2-Level Hierarchical Nested Partition Key",
    databaseId: "e2etests-sql-readonly",
    containerId: "twoLevelNestedPartitionKey",
    documents: [
      {
        documentId: "twoLevelNestedPartitionKey_nested_value_empty",
        partitionKeys: [
          { key: "/twoLevelNestedPartitionKey/nested", value: "value" },
          { key: "/twoLevelNestedPartitionKey/nested_value/nested", value: "" },
        ],
      },
      {
        documentId: "twoLevelNestedPartitionKey_nested_null_missing",
        partitionKeys: [{ key: "/twoLevelNestedPartitionKey/nested", value: null }],
      },
      {
        documentId: "twoLevelNestedPartitionKey_nested_missing_value",
        partitionKeys: [{ key: "/twoLevelNestedPartitionKey/nested_value/nested", value: "value" }],
      },
    ],
  },
  {
    name: "3-Level Hierarchical Partition Key",
    databaseId: "e2etests-sql-readonly",
    containerId: "threeLevelPartitionKey",
    documents: [
      {
        documentId: "threeLevelPartitionKey_value_empty_null",
        partitionKeys: [
          { key: "/threeLevelPartitionKey_1", value: "value" },
          { key: "/threeLevelPartitionKey_2", value: "" },
          { key: "/threeLevelPartitionKey_3", value: null },
        ],
      },
      {
        documentId: "threeLevelPartitionKey_value_null_missing",
        partitionKeys: [
          { key: "/threeLevelPartitionKey_1", value: "value" },
          { key: "/threeLevelPartitionKey_2", value: null },
        ],
      },
      {
        documentId: "threeLevelPartitionKey_value_missing_null",
        partitionKeys: [
          { key: "/threeLevelPartitionKey_1", value: "value" },
          { key: "/threeLevelPartitionKey_3", value: null },
        ],
      },
      {
        documentId: "threeLevelPartitionKey_null_empty_value",
        partitionKeys: [
          { key: "/threeLevelPartitionKey_1", value: null },
          { key: "/threeLevelPartitionKey_2", value: "" },
          { key: "/threeLevelPartitionKey_3", value: "value" },
        ],
      },
      {
        documentId: "threeLevelPartitionKey_missing_value_value",
        partitionKeys: [
          { key: "/threeLevelPartitionKey_2", value: "value" },
          { key: "/threeLevelPartitionKey_3", value: "value" },
        ],
      },
      {
        documentId: "threeLevelPartitionKey_empty_value_missing",
        partitionKeys: [
          { key: "/threeLevelPartitionKey_1", value: "" },
          { key: "/threeLevelPartitionKey_2", value: "value" },
        ],
      },
    ],
  },
  {
    name: "3-Level Nested Hierarchical Partition Key",
    databaseId: "e2etests-sql-readonly",
    containerId: "threeLevelNestedPartitionKey",
    documents: [
      {
        documentId: "threeLevelNestedPartitionKey_nested_empty_value_null",
        partitionKeys: [
          { key: "/threeLevelPartitionKey_1/nested/nested_key", value: "" },
          { key: "/threeLevelPartitionKey_1/nested/nested_2/nested_key", value: "value" },
          { key: "/threeLevelPartitionKey_1/nested/nested_2/nested_3/nested_key", value: null },
        ],
      },
      {
        documentId: "threeLevelNestedPartitionKey_nested_null_value_missing",
        partitionKeys: [
          { key: "/threeLevelPartitionKey_1/nested/nested_key", value: null },
          { key: "/threeLevelPartitionKey_1/nested/nested_2/nested_key", value: "value" },
        ],
      },
      {
        documentId: "threeLevelNestedPartitionKey_nested_missing_value_null",
        partitionKeys: [
          { key: "/threeLevelPartitionKey_1/nested/nested_2/nested_key", value: "value" },
          { key: "/threeLevelPartitionKey_1/nested/nested_2/nested_3/nested_key", value: null },
        ],
      },
      {
        documentId: "threeLevelNestedPartitionKey_nested_null_empty_missing",
        partitionKeys: [
          { key: "/threeLevelPartitionKey_1/nested/nested_key", value: null },
          { key: "/threeLevelPartitionKey_1/nested/nested_2/nested_key", value: "" },
        ],
      },
      {
        documentId: "threeLevelNestedPartitionKey_nested_value_missing_empty",
        partitionKeys: [
          { key: "/threeLevelPartitionKey_1/nested/nested_key", value: "value" },
          { key: "/threeLevelPartitionKey_1/nested/nested_2/nested_3/nested_key", value: "" },
        ],
      },
      {
        documentId: "threeLevelNestedPartitionKey_nested_missing_null_empty",
        partitionKeys: [
          { key: "/threeLevelPartitionKey_1/nested/nested_2/nested_key", value: null },
          { key: "/threeLevelPartitionKey_1/nested/nested_2/nested_3/nested_key", value: "" },
        ],
      },
      {
        documentId: "threeLevelNestedPartitionKey_nested_empty_null_value",
        partitionKeys: [
          { key: "/threeLevelPartitionKey_1/nested/nested_key", value: "" },
          { key: "/threeLevelPartitionKey_1/nested/nested_2/nested_key", value: null },
          { key: "/threeLevelPartitionKey_1/nested/nested_2/nested_3/nested_key", value: "value" },
        ],
      },
      {
        documentId: "threeLevelNestedPartitionKey_nested_value_null_empty",
        partitionKeys: [
          { key: "/threeLevelPartitionKey_1/nested/nested_key", value: "value" },
          { key: "/threeLevelPartitionKey_1/nested/nested_2/nested_key", value: null },
          { key: "/threeLevelPartitionKey_1/nested/nested_2/nested_3/nested_key", value: "" },
        ],
      },
    ],
  },
  {
    name: "Single Double-Quoted Partition Key",
    databaseId: "e2etests-sql-readonly",
    containerId: "doubleQuotedPartitionKey",
    documents: [
      {
        documentId: "doubleQuotedPartitionKey",
        partitionKeys: [{ key: "/partition-key", value: "doubleQuotedValue" }],
      },
      {
        documentId: "doubleQuotedPartitionKey_empty_string",
        partitionKeys: [{ key: "/partition-key", value: "" }],
      },
      {
        documentId: "doubleQuotedPartitionKey_null",
        partitionKeys: [{ key: "/partition-key", value: null }],
      },
      {
        documentId: "doubleQuotedPartitionKey_missing",
        partitionKeys: [],
      },
    ],
  },
];
