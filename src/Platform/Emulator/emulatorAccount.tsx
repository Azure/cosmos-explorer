import { AccountKind, DefaultAccountExperience, TagNames } from "../../Common/Constants";

export const emulatorAccount = {
  name: "",
  id: "",
  location: "",
  type: "",
  kind: AccountKind.DocumentDB,
  tags: {
    [TagNames.defaultExperience]: DefaultAccountExperience.DocumentDB
  },
  properties: {
    documentEndpoint: "",
    tableEndpoint: "",
    gremlinEndpoint: "",
    cassandraEndpoint: ""
  }
};
