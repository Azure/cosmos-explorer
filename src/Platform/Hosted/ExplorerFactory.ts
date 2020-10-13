import Explorer from "../../Explorer/Explorer";

export default class HostedExplorerFactory {
  public createExplorer(): Explorer {
    const explorer = new Explorer();

    return explorer;
  }

  public static reInitializeDocumentClientUtilityForExplorer(explorer: Explorer): void {
    if (!!explorer) {
      explorer.notificationConsoleData([]);
    }
  }
}
