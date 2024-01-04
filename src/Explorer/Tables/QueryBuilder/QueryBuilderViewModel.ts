import * as DataTable from "datatables.net-dt";
import * as ko from "knockout";
import { KeyCodes } from "../../../Common/Constants";
import { userContext } from "../../../UserContext";
import * as Constants from "../Constants";
import { getQuotedCqlIdentifier } from "../CqlUtilities";
import * as DataTableUtilities from "../DataTable/DataTableUtilities";
import TableEntityListViewModel from "../DataTable/TableEntityListViewModel";
import * as TableEntityProcessor from "../TableEntityProcessor";
import * as Utilities from "../Utilities";
import ClauseGroup from "./ClauseGroup";
import ClauseGroupViewModel from "./ClauseGroupViewModel";
import * as CustomTimestampHelper from "./CustomTimestampHelper";
import * as DateTimeUtilities from "./DateTimeUtilities";
import QueryClauseViewModel from "./QueryClauseViewModel";
import QueryViewModel from "./QueryViewModel";

export default class QueryBuilderViewModel {
  /* Labels */
  public andLabel = "And/Or"; // localize
  public actionLabel = "Action"; // localize
  public fieldLabel = "Field"; // localize
  public dataTypeLabel = "Type"; // localize
  public operatorLabel = "Operator"; // localize
  public valueLabel = "Value"; // localize

  /* controls */
  public addNewClauseLine = "Add new clause"; // localize
  public insertNewFilterLine = "Insert new filter line"; // localize
  public removeThisFilterLine = "Remove this filter line"; // localize
  public groupSelectedClauses = "Group selected clauses"; // localize
  public clauseArray = ko.observableArray<QueryClauseViewModel>(); // This is for storing the clauses in flattened form queryClauses for easier UI data binding.
  public queryClauses = new ClauseGroup(true, undefined); // The actual data structure containing the clause information.
  public columnOptions: ko.ObservableArray<string>;
  public canGroupClauses = ko.observable<boolean>(false);

  /* Observables */
  public edmTypes = ko.observableArray([
    Constants.TableType.String,
    Constants.TableType.Boolean,
    Constants.TableType.Binary,
    Constants.TableType.DateTime,
    Constants.TableType.Double,
    Constants.TableType.Guid,
    Constants.TableType.Int32,
    Constants.TableType.Int64,
    "",
  ]);
  public operators = ko.observableArray([
    Constants.Operator.Equal,
    Constants.Operator.GreaterThan,
    Constants.Operator.GreaterThanOrEqualTo,
    Constants.Operator.LessThan,
    Constants.Operator.LessThanOrEqualTo,
    Constants.Operator.NotEqualTo,
    "",
  ]);
  public clauseRules = ko.observableArray([Constants.ClauseRule.And, Constants.ClauseRule.Or]);
  public timeOptions = ko.observableArray([
    Constants.timeOptions.lastHour,
    Constants.timeOptions.last24Hours,
    Constants.timeOptions.last7Days,
    Constants.timeOptions.last31Days,
    Constants.timeOptions.last365Days,
    Constants.timeOptions.currentMonth,
    Constants.timeOptions.currentYear,
    //Constants.timeOptions.custom
  ]);
  public queryString = ko.observable<string>();
  private _queryViewModel: QueryViewModel;
  public tableEntityListViewModel: TableEntityListViewModel;
  private scrollEventListener: boolean;

  constructor(queryViewModel: QueryViewModel, tableEntityListViewModel: TableEntityListViewModel) {
    if (userContext.apiType === "Cassandra") {
      this.edmTypes([
        Constants.CassandraType.Text,
        Constants.CassandraType.Ascii,
        Constants.CassandraType.Bigint,
        Constants.CassandraType.Blob,
        Constants.CassandraType.Boolean,
        Constants.CassandraType.Decimal,
        Constants.CassandraType.Double,
        Constants.CassandraType.Float,
        Constants.CassandraType.Int,
        Constants.CassandraType.Uuid,
        Constants.CassandraType.Varchar,
        Constants.CassandraType.Varint,
        Constants.CassandraType.Inet,
        Constants.CassandraType.Smallint,
        Constants.CassandraType.Tinyint,
      ]);
      this.clauseRules([
        Constants.ClauseRule.And,
        // OR is not supported in CQL
      ]);
      this.andLabel = "And";
    }
    this.clauseArray();

    this._queryViewModel = queryViewModel;
    this.tableEntityListViewModel = tableEntityListViewModel;
    this.columnOptions = ko.observableArray<string>(queryViewModel.columnOptions());

    this.columnOptions.subscribe((newColumnOptions) => {
      queryViewModel.columnOptions(newColumnOptions);
    });
  }

  public setExample() {
    const example1 = new QueryClauseViewModel(
      this,
      "",
      "PartitionKey",
      this.edmTypes()[0],
      Constants.Operator.Equal,
      this.tableEntityListViewModel.items()[0].PartitionKey._,
      false,
      "",
      "",
      "",
      //null,
      true,
    );
    const example2 = new QueryClauseViewModel(
      this,
      "And",
      "RowKey",
      this.edmTypes()[0],
      Constants.Operator.Equal,
      this.tableEntityListViewModel.items()[0].RowKey._,
      true,
      "",
      "",
      "",
      //null,
      true,
    );
    this.addClauseImpl(example1, 0);
    this.addClauseImpl(example2, 1);
  }

  public getODataFilterFromClauses = (): string => {
    let filterString = "";
    const treeTraversal = (group: ClauseGroup): void => {
      for (let i = 0; i < group.children.length; i++) {
        const currentItem = group.children[i];

        if (currentItem instanceof QueryClauseViewModel) {
          const clause = <QueryClauseViewModel>currentItem;
          this.timestampToValue(clause);
          filterString = filterString.concat(
            this.constructODataClause(
              filterString === "" ? "" : clause.and_or(),
              this.generateLeftParentheses(clause),
              clause.field(),
              clause.type(),
              clause.operator(),
              clause.value(),
              this.generateRightParentheses(clause),
            ),
          );
        }

        if (currentItem instanceof ClauseGroup) {
          treeTraversal(<ClauseGroup>currentItem);
        }
      }
    };

    treeTraversal(this.queryClauses);

    return filterString.trim();
  };

  public getSqlFilterFromClauses = (): string => {
    let filterString = "SELECT * FROM c";
    if (this._queryViewModel.selectText() && this._queryViewModel.selectText().length > 0) {
      filterString = "SELECT";
      const selectText = this._queryViewModel && this._queryViewModel.selectText && this._queryViewModel.selectText();
      selectText &&
        selectText.forEach((value: string) => {
          if (value === Constants.EntityKeyNames.PartitionKey) {
            value = `["${TableEntityProcessor.keyProperties.PartitionKey}"]`;
            filterString = filterString.concat(filterString === "SELECT" ? " c" : ", c");
          } else if (value === Constants.EntityKeyNames.RowKey) {
            value = `["${TableEntityProcessor.keyProperties.Id}"]`;
            filterString = filterString.concat(filterString === "SELECT" ? " c" : ", c");
          } else {
            if (value === Constants.EntityKeyNames.Timestamp) {
              value = TableEntityProcessor.keyProperties.Timestamp;
            }
            filterString = filterString.concat(filterString === "SELECT" ? " c." : ", c.");
          }
          filterString = filterString.concat(value);
        });
      filterString = filterString.concat(" FROM c");
    }
    if (this.queryClauses.children.length === 0) {
      return filterString;
    }
    filterString = filterString.concat(" WHERE");
    let first = true;
    const treeTraversal = (group: ClauseGroup): void => {
      for (let i = 0; i < group.children.length; i++) {
        const currentItem = group.children[i];

        if (currentItem instanceof QueryClauseViewModel) {
          const clause = <QueryClauseViewModel>currentItem;
          const timeStampValue: string = this.timestampToSqlValue(clause);
          let value = clause.value();
          if (!clause.isValue()) {
            value = timeStampValue;
          }
          filterString = filterString.concat(
            this.constructSqlClause(
              first ? "" : clause.and_or(),
              this.generateLeftParentheses(clause),
              clause.field(),
              clause.type(),
              clause.operator(),
              value,
              this.generateRightParentheses(clause),
            ),
          );
          first = false;
        }

        if (currentItem instanceof ClauseGroup) {
          treeTraversal(<ClauseGroup>currentItem);
        }
      }
    };

    treeTraversal(this.queryClauses);

    return filterString.trim();
  };

  public getCqlFilterFromClauses = (): string => {
    const databaseId = this._queryViewModel.queryTablesTab.collection.databaseId;
    const collectionId = this._queryViewModel.queryTablesTab.collection.id();
    const tableToQuery = `${getQuotedCqlIdentifier(databaseId)}.${getQuotedCqlIdentifier(collectionId)}`;
    let filterString = `SELECT * FROM ${tableToQuery}`;
    if (this._queryViewModel.selectText() && this._queryViewModel.selectText().length > 0) {
      filterString = "SELECT";
      const selectText = this._queryViewModel && this._queryViewModel.selectText && this._queryViewModel.selectText();
      selectText &&
        selectText.forEach((value: string) => {
          filterString = filterString.concat(filterString === "SELECT" ? " " : ", ");
          filterString = filterString.concat(value);
        });
      filterString = filterString.concat(` FROM ${tableToQuery}`);
    }
    if (this.queryClauses.children.length === 0) {
      return filterString;
    }
    filterString = filterString.concat(" WHERE");
    let first = true;
    const treeTraversal = (group: ClauseGroup): void => {
      for (let i = 0; i < group.children.length; i++) {
        const currentItem = group.children[i];

        if (currentItem instanceof QueryClauseViewModel) {
          const clause = <QueryClauseViewModel>currentItem;
          const timeStampValue = this.timestampToSqlValue(clause);
          let value = clause.value();
          if (!clause.isValue()) {
            value = timeStampValue;
          }
          filterString = filterString.concat(
            this.constructCqlClause(
              first ? "" : clause.and_or(),
              this.generateLeftParentheses(clause),
              clause.field(),
              clause.type(),
              clause.operator(),
              value,
              this.generateRightParentheses(clause),
            ),
          );
          first = false;
        }

        if (currentItem instanceof ClauseGroup) {
          treeTraversal(<ClauseGroup>currentItem);
        }
      }
    };

    treeTraversal(this.queryClauses);

    return filterString.trim();
  };

  public updateColumnOptions = (): void => {
    // let originalHeaders = this.columnOptions();
    const newHeaders = this.tableEntityListViewModel.headers;
    this.columnOptions(newHeaders.sort(DataTableUtilities.compareTableColumns));
  };

  private generateLeftParentheses(clause: QueryClauseViewModel): string {
    let result = "";

    if (clause.clauseGroup.isRootGroup || clause.clauseGroup.children.indexOf(clause) !== 0) {
      return result;
    } else {
      result = result.concat("(");
    }

    let currentGroup: ClauseGroup = clause.clauseGroup;

    while (
      !currentGroup.isRootGroup &&
      !currentGroup.parentGroup.isRootGroup &&
      currentGroup.parentGroup.children.indexOf(currentGroup) === 0
    ) {
      result = result.concat("(");
      currentGroup = currentGroup.parentGroup;
    }

    return result;
  }

  private generateRightParentheses(clause: QueryClauseViewModel): string {
    let result = "";

    if (
      clause.clauseGroup.isRootGroup ||
      clause.clauseGroup.children.indexOf(clause) !== clause.clauseGroup.children.length - 1
    ) {
      return result;
    } else {
      result = result.concat(")");
    }

    let currentGroup: ClauseGroup = clause.clauseGroup;

    while (
      !currentGroup.isRootGroup &&
      !currentGroup.parentGroup.isRootGroup &&
      currentGroup.parentGroup.children.indexOf(currentGroup) === currentGroup.parentGroup.children.length - 1
    ) {
      result = result.concat(")");
      currentGroup = currentGroup.parentGroup;
    }

    return result;
  }

  private constructODataClause = (
    clauseRule: string,
    leftParentheses: string,
    propertyName: string,
    type: string,
    operator: string,
    value: string,
    rightParentheses: string,
  ): string => {
    switch (type) {
      case Constants.TableType.DateTime:
        return ` ${clauseRule.toLowerCase()} ${leftParentheses}${propertyName} ${this.operatorConverter(
          operator,
        )} ${value}${rightParentheses}`;
      case Constants.TableType.String:
        return ` ${clauseRule.toLowerCase()} ${leftParentheses}${propertyName} ${this.operatorConverter(
          operator,
          // eslint-disable-next-line no-useless-escape
        )} \'${value}\'${rightParentheses}`;
      case Constants.TableType.Guid:
        return ` ${clauseRule.toLowerCase()} ${leftParentheses}${propertyName} ${this.operatorConverter(
          operator,
          // eslint-disable-next-line no-useless-escape
        )} guid\'${value}\'${rightParentheses}`;
      case Constants.TableType.Binary:
        return ` ${clauseRule.toLowerCase()} ${leftParentheses}${propertyName} ${this.operatorConverter(
          operator,
          // eslint-disable-next-line no-useless-escape
        )} binary\'${value}\'${rightParentheses}`;
      default:
        return ` ${clauseRule.toLowerCase()} ${leftParentheses}${propertyName} ${this.operatorConverter(
          operator,
        )} ${value}${rightParentheses}`;
    }
  };

  private constructSqlClause = (
    clauseRule: string,
    leftParentheses: string,
    propertyName: string,
    type: string,
    operator: string,
    value: string,
    rightParentheses: string,
  ): string => {
    if (propertyName === Constants.EntityKeyNames.PartitionKey) {
      propertyName = TableEntityProcessor.keyProperties.PartitionKey;
      // eslint-disable-next-line no-useless-escape
      return ` ${clauseRule.toLowerCase()} ${leftParentheses}c["${propertyName}"] ${operator} \'${value}\'${rightParentheses}`;
    } else if (propertyName === Constants.EntityKeyNames.RowKey) {
      propertyName = TableEntityProcessor.keyProperties.Id;
      // eslint-disable-next-line no-useless-escape
      return ` ${clauseRule.toLowerCase()} ${leftParentheses}c.${propertyName} ${operator} \'${value}\'${rightParentheses}`;
    } else if (propertyName === Constants.EntityKeyNames.Timestamp) {
      propertyName = TableEntityProcessor.keyProperties.Timestamp;
      return ` ${clauseRule.toLowerCase()} ${leftParentheses}c.${propertyName} ${operator} ${DateTimeUtilities.convertJSDateToUnix(
        value,
      )}${rightParentheses}`;
    }
    switch (type) {
      case Constants.TableType.DateTime:
        // eslint-disable-next-line no-useless-escape
        return ` ${clauseRule.toLowerCase()} ${leftParentheses}c.${propertyName}["$v"] ${operator} \'${DateTimeUtilities.convertJSDateToTicksWithPadding(
          value,
          // eslint-disable-next-line no-useless-escape
        )}\'${rightParentheses}`;
      case Constants.TableType.Int64:
        // eslint-disable-next-line no-useless-escape
        return ` ${clauseRule.toLowerCase()} ${leftParentheses}c.${propertyName}["$v"] ${operator} \'${Utilities.padLongWithZeros(
          value,
          // eslint-disable-next-line no-useless-escape
        )}\'${rightParentheses}`;
      case Constants.TableType.String:
      case Constants.TableType.Guid:
      case Constants.TableType.Binary:
        // eslint-disable-next-line no-useless-escape
        return ` ${clauseRule.toLowerCase()} ${leftParentheses}c.${propertyName}["$v"] ${operator} \'${value}\'${rightParentheses}`;
      default:
        return ` ${clauseRule.toLowerCase()} ${leftParentheses}c.${propertyName}["$v"] ${operator} ${value}${rightParentheses}`;
    }
  };

  private constructCqlClause = (
    clauseRule: string,
    leftParentheses: string,
    propertyName: string,
    type: string,
    operator: string,
    value: string,
    rightParentheses: string,
  ): string => {
    if (
      type === Constants.CassandraType.Text ||
      type === Constants.CassandraType.Inet ||
      type === Constants.CassandraType.Ascii ||
      type === Constants.CassandraType.Varchar
    ) {
      // eslint-disable-next-line no-useless-escape
      return ` ${clauseRule.toLowerCase()} ${leftParentheses} ${propertyName} ${operator} \'${value}\'${rightParentheses}`;
    }
    return ` ${clauseRule.toLowerCase()} ${leftParentheses} ${propertyName} ${operator} ${value}${rightParentheses}`;
  };

  private operatorConverter = (operator: string): string => {
    switch (operator) {
      case Constants.Operator.Equal:
        return Constants.ODataOperator.EqualTo;
      case Constants.Operator.GreaterThan:
        return Constants.ODataOperator.GreaterThan;
      case Constants.Operator.GreaterThanOrEqualTo:
        return Constants.ODataOperator.GreaterThanOrEqualTo;
      case Constants.Operator.LessThan:
        return Constants.ODataOperator.LessThan;
      case Constants.Operator.LessThanOrEqualTo:
        return Constants.ODataOperator.LessThanOrEqualTo;
      case Constants.Operator.NotEqualTo:
        return Constants.ODataOperator.NotEqualTo;
    }
    return undefined;
  };

  public groupClauses = (): void => {
    this.queryClauses.groupSelectedItems();
    this.updateClauseArray();
    this.updateCanGroupClauses();
  };

  public addClauseIndex = (index: number): void => {
    if (index < 0) {
      index = 0;
    }
    const newClause = new QueryClauseViewModel(
      this,
      "And",
      "",
      this.edmTypes()[0],
      Constants.Operator.EqualTo,
      "",
      true,
      "",
      "",
      "",
      //null,
      true,
    );
    this.addClauseImpl(newClause, index);
    if (index === this.clauseArray().length - 1) {
      this.scrollToBottom();
    }
    this.updateCanGroupClauses();
    newClause.isAndOrFocused(true);
    $(window).resize();
  };

  // adds a new clause to the end of the array
  public addNewClause = (): void => {
    this.addClauseIndex(this.clauseArray().length);
  };

  public onAddClauseKeyDown = (index: number, event: KeyboardEvent): boolean => {
    if (event.keyCode === KeyCodes.Enter || event.keyCode === KeyCodes.Space) {
      this.addClauseIndex(index);
      event.stopPropagation();
      return false;
    }
    return true;
  };

  public onAddNewClauseKeyDown = (event: KeyboardEvent): boolean => {
    if (event.key === "Enter" || event.key === "Space") {
      this.addClauseIndex(this.clauseArray().length - 1);
      event.stopPropagation();
      return false;
    }
    return true;
  };

  public deleteClause = (index: number): void => {
    this.deleteClauseImpl(index);
    if (this.clauseArray().length !== 0) {
      this.clauseArray()[0].and_or("");
      this.clauseArray()[0].canAnd(false);
    }
    this.updateCanGroupClauses();
    $(window).resize();
  };

  public onDeleteClauseKeyDown = (index: number, event: KeyboardEvent): boolean => {
    if (event.keyCode === KeyCodes.Enter || event.keyCode === KeyCodes.Space) {
      this.deleteClause(index);
      event.stopPropagation();
      return false;
    }
    return true;
  };

  /**
   * Generates an array of ClauseGroupViewModel objects for UI to display group information for this clause.
   * All clauses have the same number of ClauseGroupViewModel objects, which is the depth of the clause tree.
   * If the current clause is not the deepest in the tree, then the array will be filled by either a placeholder
   * (transparent) or its parent group view models.
   */
  public getClauseGroupViewModels = (clause: QueryClauseViewModel): ClauseGroupViewModel[] => {
    const placeHolderGroupViewModel = new ClauseGroupViewModel(this.queryClauses, false, this);
    const treeDepth = this.queryClauses.getTreeDepth();
    const groupViewModels = new Array<ClauseGroupViewModel>(treeDepth);

    // Prefill the arry with placeholders.
    for (let i = 0; i < groupViewModels.length; i++) {
      groupViewModels[i] = placeHolderGroupViewModel;
    }

    let currentGroup = clause.clauseGroup;

    // This function determines whether the path from clause to the current group is on the left most.
    const isLeftMostPath = (): boolean => {
      let group = clause.clauseGroup;

      if (group.children.indexOf(clause) !== 0) {
        return false;
      }

      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (group.getId() === currentGroup.getId()) {
          break;
        }

        if (group.parentGroup.children.indexOf(group) !== 0) {
          return false;
        }

        group = group.parentGroup;
      }
      return true;
    };

    // This function determines whether the path from clause to the current group is on the right most.
    const isRightMostPath = (): boolean => {
      let group = clause.clauseGroup;

      if (group.children.indexOf(clause) !== group.children.length - 1) {
        return false;
      }

      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (group.getId() === currentGroup.getId()) {
          break;
        }

        if (group.parentGroup.children.indexOf(group) !== group.parentGroup.children.length - 1) {
          return false;
        }

        group = group.parentGroup;
      }
      return true;
    };

    let vmIndex = groupViewModels.length - 1;
    let skipIndex = -1;
    let lastDepth = clause.groupDepth;

    while (!currentGroup.isRootGroup) {
      // The current group will be rendered at least once, and if there are any sibling groups deeper
      // than the current group, we will repeat rendering the current group to fill up the gap between
      // current & deepest sibling.
      const deepestInSiblings = currentGroup.findDeepestGroupInChildren(skipIndex).getCurrentGroupDepth();
      // Find out the depth difference between the deepest group under the siblings of currentGroup and
      // the deepest group under currentGroup. If the result n is a positive number, it means there are
      // deeper groups in siblings and we need to draw n + 1 group blocks on UI to fill up the depth
      // differences. If the result n is a negative number, it means current group contains the deepest
      // sub-group, we only need to draw the group block once.
      const repeatCount = Math.max(deepestInSiblings - lastDepth, 0);

      for (let i = 0; i <= repeatCount; i++) {
        const isLeftMost = isLeftMostPath();
        const isRightMost = isRightMostPath();
        const groupViewModel = new ClauseGroupViewModel(currentGroup, i === 0 && isLeftMost, this);

        groupViewModel.showTopBorder(isLeftMost);
        groupViewModel.showBottomBorder(isRightMost);
        groupViewModel.showLeftBorder(i === repeatCount);
        groupViewModels[vmIndex] = groupViewModel;
        vmIndex--;
      }

      skipIndex = currentGroup.parentGroup.children.indexOf(currentGroup);
      currentGroup = currentGroup.parentGroup;
      lastDepth = Math.max(deepestInSiblings, lastDepth);
    }

    return groupViewModels;
  };

  public runQuery = (): DataTable.Api<Element> => {
    return this._queryViewModel.runQuery();
  };

  public addCustomRange(timestamp: CustomTimestampHelper.ITimestampQuery, clauseToAdd: QueryClauseViewModel): void {
    const index = this.clauseArray.peek().indexOf(clauseToAdd);

    const newClause = new QueryClauseViewModel(
      this,
      //this._tableEntityListViewModel.tableExplorerContext.hostProxy,
      "And",
      clauseToAdd.field(),
      "DateTime",
      Constants.Operator.LessThan,
      "",
      true,
      Constants.timeOptions.custom,
      timestamp.endTime,
      "range",
      //null,
      true,
    );

    newClause.isLocal = ko.observable(timestamp.timeZone === "local");
    this.addClauseImpl(newClause, index + 1);

    if (index + 1 === this.clauseArray().length - 1) {
      this.scrollToBottom();
    }
  }

  private scrollToBottom(): void {
    const scrollBox = document.getElementById("scroll");
    if (!this.scrollEventListener) {
      scrollBox.addEventListener("scroll", function () {
        const translate = "translate(0," + this.scrollTop + "px)";
        const allTh = <NodeListOf<HTMLElement>>this.querySelectorAll("thead td");
        for (let i = 0; i < allTh.length; i++) {
          allTh[i].style.transform = translate;
        }
      });
      this.scrollEventListener = true;
    }
    const isScrolledToBottom = scrollBox.scrollHeight - scrollBox.clientHeight <= scrollBox.scrollHeight + 1;
    if (isScrolledToBottom) {
      scrollBox.scrollTop = scrollBox.scrollHeight - scrollBox.clientHeight;
    }
  }

  private addClauseImpl(clause: QueryClauseViewModel, position: number): void {
    this.queryClauses.insertClauseBefore(clause, this.clauseArray()[position]);
    this.updateClauseArray();
  }

  private deleteClauseImpl(index: number): void {
    const clause = this.clauseArray()[index];
    const previousClause = index === 0 ? 0 : index - 1;
    this.queryClauses.deleteClause(clause);
    this.updateClauseArray();
    if (this.clauseArray()[previousClause]) {
      this.clauseArray()[previousClause].isDeleteButtonFocused(true);
    }
  }

  public updateCanGroupClauses(): void {
    this.canGroupClauses(this.queryClauses.canGroupSelectedItems());
  }

  public updateClauseArray(): void {
    if (this.clauseArray().length > 0) {
      this.clauseArray()[0].canAnd(true);
    }

    this.queryClauses.flattenClauses(this.clauseArray);

    if (this.clauseArray().length > 0) {
      this.clauseArray()[0].canAnd(false);
    }

    // Fix for 261924, forces the resize event so DataTableBindingManager will redo the calculation on table size.
    //DataTableUtilities.forceRecalculateTableSize();
  }

  private timestampToValue(clause: QueryClauseViewModel): void {
    if (clause.isValue()) {
      return;
    } else if (clause.isTimestamp()) {
      this.getTimeStampToQuery(clause);
      // } else if (clause.isCustomLastTimestamp()) {
      //     clause.value(`datetime'${CustomTimestampHelper._queryLastTime(clause.customLastTimestamp().lastNumber, clause.customLastTimestamp().lastTimeUnit)}'`);
    } else if (clause.isCustomRangeTimestamp()) {
      if (clause.isLocal()) {
        clause.value(`datetime'${DateTimeUtilities.getUTCDateTime(clause.customTimeValue())}'`);
      } else {
        clause.value(`datetime'${clause.customTimeValue()}Z'`);
      }
    }
  }

  private timestampToSqlValue(clause: QueryClauseViewModel): string {
    if (clause.isValue()) {
      return undefined;
    } else if (clause.isTimestamp()) {
      return this.getTimeStampToSqlQuery(clause);
      // } else if (clause.isCustomLastTimestamp()) {
      //     clause.value(CustomTimestampHelper._queryLastTime(clause.customLastTimestamp().lastNumber, clause.customLastTimestamp().lastTimeUnit));
    } else if (clause.isCustomRangeTimestamp()) {
      if (clause.isLocal()) {
        return DateTimeUtilities.getUTCDateTime(clause.customTimeValue());
      } else {
        return clause.customTimeValue();
      }
    }
    return undefined;
  }

  private getTimeStampToQuery(clause: QueryClauseViewModel): void {
    switch (clause.timeValue()) {
      case Constants.timeOptions.lastHour:
        clause.value(`datetime'${CustomTimestampHelper._queryLastDaysHours(0, 1)}'`);
        break;
      case Constants.timeOptions.last24Hours:
        clause.value(`datetime'${CustomTimestampHelper._queryLastDaysHours(0, 24)}'`);
        break;
      case Constants.timeOptions.last7Days:
        clause.value(`datetime'${CustomTimestampHelper._queryLastDaysHours(7, 0)}'`);
        break;
      case Constants.timeOptions.last31Days:
        clause.value(`datetime'${CustomTimestampHelper._queryLastDaysHours(31, 0)}'`);
        break;
      case Constants.timeOptions.last365Days:
        clause.value(`datetime'${CustomTimestampHelper._queryLastDaysHours(365, 0)}'`);
        break;
      case Constants.timeOptions.currentMonth:
        clause.value(`datetime'${CustomTimestampHelper._queryCurrentMonthLocal()}'`);
        break;
      case Constants.timeOptions.currentYear:
        clause.value(`datetime'${CustomTimestampHelper._queryCurrentYearLocal()}'`);
        break;
    }
  }

  private getTimeStampToSqlQuery(clause: QueryClauseViewModel): string {
    switch (clause.timeValue()) {
      case Constants.timeOptions.lastHour:
        return CustomTimestampHelper._queryLastDaysHours(0, 1);
      case Constants.timeOptions.last24Hours:
        return CustomTimestampHelper._queryLastDaysHours(0, 24);
      case Constants.timeOptions.last7Days:
        return CustomTimestampHelper._queryLastDaysHours(7, 0);
      case Constants.timeOptions.last31Days:
        return CustomTimestampHelper._queryLastDaysHours(31, 0);
      case Constants.timeOptions.last365Days:
        return CustomTimestampHelper._queryLastDaysHours(365, 0);
      case Constants.timeOptions.currentMonth:
        return CustomTimestampHelper._queryCurrentMonthLocal();
      case Constants.timeOptions.currentYear:
        return CustomTimestampHelper._queryCurrentYearLocal();
    }
    return undefined;
  }

  public checkIfClauseChanged(): void {
    this._queryViewModel.checkIfBuilderChanged();
  }
}
