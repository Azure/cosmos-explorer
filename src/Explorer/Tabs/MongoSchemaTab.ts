import { MongoSchemaComponentAdapter } from "../Notebook/MongoSchemaComponent/MongoSchemaComponentAdapter";
import template from "./MongoSchemaTab.html";
import NotebookTabBase, { NotebookTabBaseOptions } from "./NotebookTabBase";

export default class MongoSchemaTab extends NotebookTabBase {
  public static readonly component = { name: "mongo-schema-tab", template };

  private mongoSchemaComponentAdapter: MongoSchemaComponentAdapter;

  constructor(options: NotebookTabBaseOptions) {
    super(options);
    this.mongoSchemaComponentAdapter = new MongoSchemaComponentAdapter(
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
