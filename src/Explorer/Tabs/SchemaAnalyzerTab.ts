import { SchemaAnalyzerComponentAdapter } from "../Notebook/SchemaAnalyzerComponent/SchemaAnalyzerComponentAdapter";
import NotebookTabBase, { NotebookTabBaseOptions } from "./NotebookTabBase";
import template from "./SchemaAnalyzerTab.html";

export default class SchemaAnalyzerTab extends NotebookTabBase {
  public static readonly component = { name: "schema-analyzer-tab", template };

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

  protected buildCommandBarOptions(): void {
    this.updateNavbarWithTabsButtons();
  }
}
