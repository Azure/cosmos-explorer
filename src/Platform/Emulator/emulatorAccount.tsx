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
  },
};
