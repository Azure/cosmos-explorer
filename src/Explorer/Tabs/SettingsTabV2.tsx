import * as ViewModels from "../../Contracts/ViewModels";
import TabsBase from "./TabsBase";
import { SettingsComponentAdapter } from "../Controls/Settings/SettingsComponentAdapter";
import { SettingsComponentProps } from "../Controls/Settings/SettingsComponent";
import Explorer from "../Explorer";

export default class SettingsTabV2 extends TabsBase implements ViewModels.WaitsForTemplate {
  public settingsComponentAdapter: SettingsComponentAdapter;

  constructor(options: ViewModels.TabOptions) {
    super(options);
    const props: SettingsComponentProps = {
      settingsTab: this
    };
    this.settingsComponentAdapter = new SettingsComponentAdapter(props);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public onActivate(): Q.Promise<any> {
    return super.onActivate().then(() => {
      this.collection.selectedSubnodeKind(ViewModels.CollectionTabKind.Settings);
    });
  }

  public getSettingsTabContainer(): Explorer {
    return this.getContainer();
  }

  //for testing purposes
  public getTabId(): string {
    return this.tabId;
  }
}
