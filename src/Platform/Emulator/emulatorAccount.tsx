import { AccountKind } from "../../Common/Constants";

export const emulatorAccount = {
  name: "",
  id: "",
  location: "",
  type: "",
  kind: AccountKind.DocumentDB,
  properties: {
    documentEndpoint: "",
    tableEndpoint: "",
    gremlinEndpoint: "",
    cassandraEndpoint: "",
    capabilities: [
      {
        name: "EnableNoSqlVectorSearch",
        description: "Enable Vector Search on NoSQL account",
      },
    ],
  },
};
