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

  protected buildCommandBarOptions(): void {
    this.updateNavbarWithTabsButtons();
  }
}
