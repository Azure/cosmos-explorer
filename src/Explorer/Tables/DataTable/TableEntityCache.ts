import * as Utilities from "../Utilities";
import * as Entities from "../Entities";
import CacheBase from "./CacheBase";

export default class TableEntityCache extends CacheBase<Entities.ITableEntity> {
  private _tableQuery: Entities.ITableQuery;

  constructor() {
    super();
    this.data = null;
    this._tableQuery = null;
    this.serverCallInProgress = false;
    this.sortOrder = null;
  }

  public get tableQuery(): Entities.ITableQuery {
    return Utilities.copyTableQuery(this._tableQuery);
  }

  public set tableQuery(tableQuery: Entities.ITableQuery) {
    this._tableQuery = Utilities.copyTableQuery(tableQuery);
  }

  public preClear() {
    this.tableQuery = null;
  }
}
