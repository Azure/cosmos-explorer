import Q from "q";
import * as HeadersUtility from "../../Common/HeadersUtility";
import { MinimalQueryIterator } from "../../Common/IteratorUtilities";
import { queryIterator } from "../../Common/MongoProxyClient";
import MongoUtility from "../../Common/MongoUtility";
import * as ViewModels from "../../Contracts/ViewModels";
import QueryTab from "./QueryTab";

export default class MongoQueryTab extends QueryTab {
  public collection: ViewModels.Collection;

  constructor(options: ViewModels.QueryTabOptions) {
    options.queryText = ""; // override sql query editor content for now so we only display mongo related help items
    super(options);
    this.isPreferredApiMongoDB = true;
    this.monacoSettings = new ViewModels.MonacoEditorSettings("plaintext", false);
  }
  /** Renders a Javascript object to be displayed inside Monaco Editor */
  protected renderObjectForEditor(value: any, replacer: any, space: string | number): string {
    return MongoUtility.tojson(value, null, false);
  }

  protected _initIterator(): Q.Promise<MinimalQueryIterator> {
    let options: any = {};
    options.enableCrossPartitionQuery = HeadersUtility.shouldEnableCrossPartitionKey();
    this._iterator = queryIterator(this.collection.databaseId, this.collection, this.sqlStatementToExecute());
    return Q(this._iterator);
  }
}
