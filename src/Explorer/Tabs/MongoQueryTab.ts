import * as ViewModels from "../../Contracts/ViewModels";
import Q from "q";
import MongoUtility from "../../Common/MongoUtility";
import QueryTab from "./QueryTab";
import * as HeadersUtility from "../../Common/HeadersUtility";
import { queryIterator } from "../../Common/MongoProxyClient";
import { MinimalQueryIterator } from "../../Common/IteratorUtilities";

export default class MongoQueryTab extends QueryTab {
public override collection: ViewModels.Collection;

  constructor(options: ViewModels.QueryTabOptions) {
    options.queryText = ""; // override sql query editor content for now so we only display mongo related help items
    super(options);
    this.isPreferredApiMongoDB = true;
    this.monacoSettings = new ViewModels.MonacoEditorSettings("plaintext", false);
  }
  /** Renders a Javascript object to be displayed inside Monaco Editor */
  protected override renderObjectForEditor(value: any, replacer: any, space: string | number): string {
    return MongoUtility.tojson(value, null, false);
  }

  protected override _initIterator(): Q.Promise<MinimalQueryIterator> {
    let options: any = {};
    options.enableCrossPartitionQuery = HeadersUtility.shouldEnableCrossPartitionKey();
    this._iterator = queryIterator(this.collection.databaseId, this.collection, this.sqlStatementToExecute());
    return Q(this._iterator);
  }
}
