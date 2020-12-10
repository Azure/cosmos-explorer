import Explorer from "../../Explorer/Explorer";
import { AccountKind, DefaultAccountExperience, TagNames } from "../../Common/Constants";

export function initializeExplorer(): Explorer {
  const explorer = new Explorer();
  explorer.databaseAccount({
    name: "",
    id: "",
    location: "",
    type: "",
    kind: AccountKind.DocumentDB,
    tags: {
      [TagNames.defaultExperience]: DefaultAccountExperience.DocumentDB,
    },
    properties: {
      documentEndpoint: "",
      tableEndpoint: "",
      gremlinEndpoint: "",
      cassandraEndpoint: "",
    },
  });
  explorer.isAccountReady(true);
  return explorer;
}
