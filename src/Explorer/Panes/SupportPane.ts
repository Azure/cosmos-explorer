import * as ViewModels from "../../Contracts/ViewModels";
import { ContextualPaneBase } from "./ContextualPaneBase";
import { SupportPaneComponentAdapter } from "../Controls/SupportPaneComponent/SupportPaneComponentAdapter";

export class SupportPane extends ContextualPaneBase {
  public supportPaneComponentAdapter: SupportPaneComponentAdapter;

  constructor(options: ViewModels.PaneOptions) {
    super(options);
    this.title("Cosmos DB Support");
    this.resetData();
    this.supportPaneComponentAdapter = new SupportPaneComponentAdapter(this.container);
  }

  public open() {
    super.open();
    this.supportPaneComponentAdapter.forceRender();
  }

  public close() {
    super.close();
    this.supportPaneComponentAdapter.forceRender();
  }

  public submit() {
    // override default behavior because this is not a form
  }
}
