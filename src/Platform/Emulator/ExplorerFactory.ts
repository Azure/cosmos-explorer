import { AccountKind, TagNames, DefaultAccountExperience } from "../../Common/Constants";

import Explorer from "../../Explorer/Explorer";

import { NotificationsClient } from "./NotificationsClient";

export default class EmulatorExplorerFactory {
  public static createExplorer(): Explorer {
    const explorer: Explorer = new Explorer({
      notificationsClient: new NotificationsClient()
    });
    explorer.databaseAccount({
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
    });
    explorer.isAccountReady(true);
    return explorer;
  }
}
