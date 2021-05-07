import * as Constants from "../../Common/Constants";
import { Action } from "../../Shared/Telemetry/TelemetryConstants";
import { traceSuccess } from "../../Shared/Telemetry/TelemetryProcessor";
import { SchemaAnalyzerComponentAdapter } from "../Notebook/SchemaAnalyzerComponent/SchemaAnalyzerComponentAdapter";
import NotebookTabBase, { NotebookTabBaseOptions } from "./NotebookTabBase";

export default class SchemaAnalyzerTab extends NotebookTabBase {
  public readonly html = '<div data-bind="react:schemaAnalyzerComponentAdapter" style="height: 100%"></div>';
  private schemaAnalyzerComponentAdapter: SchemaAnalyzerComponentAdapter;

  constructor(options: NotebookTabBaseOptions) {
    super(options);
    this.schemaAnalyzerComponentAdapter = new SchemaAnalyzerComponentAdapter(
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
