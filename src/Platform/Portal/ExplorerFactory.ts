import Explorer from "../../Explorer/Explorer";

export default class PortalExplorerFactory {
  public createExplorer(): Explorer {
    var explorer = new Explorer();

    return explorer;
  }
}
