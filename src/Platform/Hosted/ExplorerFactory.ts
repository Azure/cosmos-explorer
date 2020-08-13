import Explorer from "../../Explorer/Explorer";

export default class HostedExplorerFactory {
  public createExplorer(): Explorer {
    return new Explorer();
  }

  public static reInitializeDocumentClientUtilityForExplorer(explorer: Explorer): void {
    if (!!explorer) {
      explorer.notificationConsoleData([]);
    }
  }
}
