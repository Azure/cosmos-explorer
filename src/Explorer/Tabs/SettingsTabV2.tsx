import * as ViewModels from "../../Contracts/ViewModels";
import TabsBase from "./TabsBase";
import { SettingsComponentAdapter } from "../Controls/Settings/SettingsComponentAdapter";
import { SettingsComponentProps } from "../Controls/Settings/SettingsComponent";
import Explorer from "../Explorer";

export default class SettingsTabV2 extends TabsBase {
  public settingsComponentAdapter: SettingsComponentAdapter;

  constructor(options: ViewModels.TabOptions) {
    super(options);
    this.tabId = "SettingsV2-" + this.tabId
    const props: SettingsComponentProps = {
      settingsTab: this
    };
    this.settingsComponentAdapter = new SettingsComponentAdapter(props);
  }

  public onActivate(): Q.Promise<unknown> {
    return super.onActivate().then(() => {
      this.collection.selectedSubnodeKind(ViewModels.CollectionTabKind.SettingsV2);
    });
  }

  public getSettingsTabContainer(): Explorer {
    return this.getContainer();
  }
}
