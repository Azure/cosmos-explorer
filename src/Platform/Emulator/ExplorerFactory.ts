import * as ViewModels from "../../Contracts/ViewModels";
import { AccountKind, TagNames, DefaultAccountExperience } from "../../Common/Constants";

import Explorer from "../../Explorer/Explorer";

import { NotificationsClient } from "./NotificationsClient";
import DocumentClientUtilityBase from "../../Common/DocumentClientUtilityBase";
import { DataAccessUtility } from "./DataAccessUtility";

export default class EmulatorExplorerFactory {
  public static createExplorer(): ViewModels.Explorer {
    DocumentClientUtilityBase;
    const documentClientUtility: DocumentClientUtilityBase = new DocumentClientUtilityBase(new DataAccessUtility());

    const explorer: Explorer = new Explorer({
      documentClientUtility: documentClientUtility,
      notificationsClient: new NotificationsClient(),
      isEmulator: true
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
