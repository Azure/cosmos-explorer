import * as Constants from "../../Common/Constants";
import { Action } from "../../Shared/Telemetry/TelemetryConstants";
import { traceSuccess } from "../../Shared/Telemetry/TelemetryProcessor";
import { DataUploaderAdapter } from "../Notebook/DataUploader/DataUploaderAdapter";
import NotebookTabBase, { NotebookTabBaseOptions } from "./NotebookTabBase";

export default class DataUploaderTab extends NotebookTabBase {
  public readonly html = '<div data-bind="react:DataUploaderAdapter" style="height: 100%"></div>';
  private DataUploaderAdapter: DataUploaderAdapter;

  constructor(options: NotebookTabBaseOptions) {
    super(options);
    this.DataUploaderAdapter = new DataUploaderAdapter(
      {
        contentRef: undefined,
        notebookClient: NotebookTabBase.clientManager,
      },
      options.collection?.databaseId,
      options.collection?.id()
    );
  }

  public onActivate(): void {
    traceSuccess(
      Action.Tab,
      {
        databaseName: this.collection?.databaseId,
        collectionName: this.collection?.id,
        dataExplorerArea: Constants.Areas.Tab,
        tabTitle: "Upload",
      },
      this.onLoadStartKey
    );

    super.onActivate();
  }

  protected buildCommandBarOptions(): void {
    this.updateNavbarWithTabsButtons();
  }
}
