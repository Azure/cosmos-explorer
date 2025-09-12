import { DocumentTestCase } from "../testData";

export const documentTestCases: DocumentTestCase[] = [
  {
    name: "Unsharded Collection",
    databaseId: "e2etests-mongo-readonly",
    containerId: "unsharded",
    documents: [
      {
        documentId: "unsharded",
        partitionKeys: [],
      },
    ],
  },
  {
    name: "Sharded Collection",
    databaseId: "e2etests-mongo-readonly",
    containerId: "sharded",
    documents: [
      {
        documentId: "sharded",
        partitionKeys: [
          {
            key: "/shardKey",
            value: "shardKey",
          },
        ],
      },
    ],
  },
];
