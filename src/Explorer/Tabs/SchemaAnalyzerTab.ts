import * as Constants from "../../Common/Constants";
import { Action } from "../../Shared/Telemetry/TelemetryConstants";
import { traceSuccess } from "../../Shared/Telemetry/TelemetryProcessor";
import { SchemaAnalyzerAdapter } from "../Notebook/SchemaAnalyzer/SchemaAnalyzerAdapter";
import NotebookTabBase, { NotebookTabBaseOptions } from "./NotebookTabBase";

export default class SchemaAnalyzerTab extends NotebookTabBase {
  public readonly html = '<div data-bind="react:schemaAnalyzerAdapter" style="height: 100%"></div>';
  private schemaAnalyzerAdapter: SchemaAnalyzerAdapter;

  constructor(options: NotebookTabBaseOptions) {
    super(options);
    this.schemaAnalyzerAdapter = new SchemaAnalyzerAdapter(
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
        tabTitle: "Schema",
      },
      this.onLoadStartKey
    );

    super.onActivate();
  }

  protected buildCommandBarOptions(): void {
    this.updateNavbarWithTabsButtons();
  }
}
