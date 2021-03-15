import * as ko from "knockout";
import * as _ from "underscore";
import { KeyCodes } from "../../../Common/Constants";
import QueryTablesTab from "../../Tabs/QueryTablesTab";
import { getQuotedCqlIdentifier } from "../CqlUtilities";
import * as DataTableUtilities from "../DataTable/DataTableUtilities";
import TableEntityListViewModel from "../DataTable/TableEntityListViewModel";
import QueryBuilderViewModel from "./QueryBuilderViewModel";
import QueryClauseViewModel from "./QueryClauseViewModel";

export default class QueryViewModel {
  public topValueLimitMessage: string = "Please input a number between 0 and 1000.";
  public queryBuilderViewModel = ko.observable<QueryBuilderViewModel>();
  public isHelperActive = ko.observable<boolean>(true);
  public isEditorActive = ko.observable<boolean>(false);
  public isExpanded = ko.observable<boolean>(false);
  public isWarningBox = ko.observable<boolean>();
  public hasQueryError: ko.Computed<boolean>;
  public queryErrorMessage: ko.Computed<string>;
  public isSaveEnabled: ko.PureComputed<boolean>;
  public isExceedingLimit: ko.Computed<boolean>;
  public canRunQuery: ko.Computed<boolean>;
  public queryTextIsReadOnly: ko.Computed<boolean>;
  public queryText = ko.observable<string>();
  public topValue = ko.observable<number>();
  public selectText = ko.observableArray<string>();
  public unchangedText = ko.observable<string>();
  public unchangedSaveText = ko.observable<string>();
  public unchangedSaveTop = ko.observable<number>();
  public unchangedSaveSelect = ko.observableArray<string>();
  public focusTopResult: ko.Observable<boolean>;
  public focusExpandIcon: ko.Observable<boolean>;

  public savedQueryName = ko.observable<string>();
  public selectMessage = ko.observable<string>();

  public columnOptions: ko.ObservableArray<string>;

  public queryTablesTab: QueryTablesTab;
  public id: string;
  private _tableEntityListViewModel: TableEntityListViewModel;

  constructor(queryTablesTab: QueryTablesTab) {
    this.queryTablesTab = queryTablesTab;
    this.id = `queryViewModel${this.queryTablesTab.tabId}`;
    this._tableEntityListViewModel = queryTablesTab.tableEntityListViewModel();

    this.queryTextIsReadOnly = ko.computed<boolean>(() => {
      return !this.queryTablesTab.container.isPreferredApiCassandra();
    });
    let initialOptions = this._tableEntityListViewModel.headers;
    this.columnOptions = ko.observableArray<string>(initialOptions);
    this.focusTopResult = ko.observable<boolean>(false);
    this.focusExpandIcon = ko.observable<boolean>(false);

    this.queryBuilderViewModel(new QueryBuilderViewModel(this, this._tableEntityListViewModel));

    this.isSaveEnabled = ko.pureComputed<boolean>(
      () =>
        this.queryText() !== this.unchangedSaveText() ||
        this.selectText() !== this.unchangedSaveSelect() ||
        this.topValue() !== this.unchangedSaveTop()
    );

    this.queryBuilderViewModel().clauseArray.subscribe((value) => {
      this.setFilter();
    });

    this.isExceedingLimit = ko.computed<boolean>(() => {
      var currentTopValue: number = this.topValue();
      return currentTopValue < 0 || currentTopValue > 1000;
    });

    this.canRunQuery = ko.computed<boolean>(() => {
      return !this.isExceedingLimit();
    });

    this.hasQueryError = ko.computed<boolean>(() => {
      return !!this._tableEntityListViewModel.queryErrorMessage();
    });

    this.queryErrorMessage = ko.computed<string>(() => {
      return this._tableEntityListViewModel.queryErrorMessage();
    });
  }

  public selectHelper = (): void => {
    this.isHelperActive(true);
    this.isEditorActive(false);
    DataTableUtilities.forceRecalculateTableSize();
  };

  public selectEditor = (): void => {
    this.setFilter();
    if (!this.isEditorActive()) {
      this.unchangedText(this.queryText());
    }
    this.isEditorActive(true);
    this.isHelperActive(false);
    DataTableUtilities.forceRecalculateTableSize();
  };

  public toggleAdvancedOptions = () => {
    this.isExpanded(!this.isExpanded());
    if (this.isExpanded()) {
      this.focusTopResult(true);
    } else {
      this.focusExpandIcon(true);
    }
    DataTableUtilities.forceRecalculateTableSize(); // Fix for 261924, forces the resize event so DataTableBindingManager will redo the calculation on table size.
  };

  public ontoggleAdvancedOptionsKeyDown = (source: any, event: KeyboardEvent): boolean => {
    if (event.keyCode === KeyCodes.Enter || event.keyCode === KeyCodes.Space) {
      this.toggleAdvancedOptions();
      event.stopPropagation();
      return false;
    }
    return true;
  };

  private _getSelectedResults = (): Array<string> => {
    return this.selectText();
  };

  private setFilter = (): string => {
    var queryString = this.isEditorActive()
      ? this.queryText()
      : this.queryTablesTab.container.isPreferredApiCassandra()
      ? this.queryBuilderViewModel().getCqlFilterFromClauses()
      : this.queryBuilderViewModel().getODataFilterFromClauses();
    var filter = queryString;
    this.queryText(filter);
    return this.queryText();
  };

  private setSqlFilter = (): string => {
    var filter = this.queryBuilderViewModel().getSqlFilterFromClauses();
    return filter;
  };

  private setCqlFilter = (): string => {
    var filter = this.queryBuilderViewModel().getCqlFilterFromClauses();
    return filter;
  };

  public isHelperEnabled = ko
    .computed<boolean>(() => {
      return (
        this.queryText() === this.unchangedText() ||
        this.queryText() === null ||
        this.queryText() === "" ||
        this.isHelperActive()
      );
    })
    .extend({
      notify: "always",
    });

  public runQuery = (): DataTables.DataTable => {
    var filter = this.setFilter();
    if (filter && !this.queryTablesTab.container.isPreferredApiCassandra()) {
      filter = filter.replace(/"/g, "'");
    }
    var top = this.topValue();
    var selectOptions = this._getSelectedResults();
    var select = selectOptions;
    this._tableEntityListViewModel.tableQuery.filter = filter;
    this._tableEntityListViewModel.tableQuery.top = top;
    this._tableEntityListViewModel.tableQuery.select = select;
    this._tableEntityListViewModel.oDataQuery(filter);
    this._tableEntityListViewModel.sqlQuery(this.setSqlFilter());
    this._tableEntityListViewModel.cqlQuery(filter);

    return this._tableEntityListViewModel.reloadTable(/*useSetting*/ false, /*resetHeaders*/ false);
  };

  public clearQuery = (): DataTables.DataTable => {
    this.queryText(null);
    this.topValue(null);
    this.selectText(null);
    this.selectMessage("");
    // clears the queryBuilder and adds a new blank clause
    this.queryBuilderViewModel().queryClauses.removeAll();
    this.queryBuilderViewModel().addNewClause();
    this._tableEntityListViewModel.tableQuery.filter = null;
    this._tableEntityListViewModel.tableQuery.top = null;
    this._tableEntityListViewModel.tableQuery.select = null;
    this._tableEntityListViewModel.oDataQuery("");
    this._tableEntityListViewModel.sqlQuery("SELECT * FROM c");
    this._tableEntityListViewModel.cqlQuery(
      `SELECT * FROM ${getQuotedCqlIdentifier(this.queryTablesTab.collection.databaseId)}.${getQuotedCqlIdentifier(
        this.queryTablesTab.collection.id()
      )}`
    );
    return this._tableEntityListViewModel.reloadTable(false);
  };

  public selectQueryOptions(): Promise<any> {
    this.queryTablesTab.container.querySelectPane.queryViewModel = this;
    this.queryTablesTab.container.querySelectPane.open();
    return null;
  }

  public onselectQueryOptionsKeyDown = (source: any, event: KeyboardEvent): boolean => {
    if (event.keyCode === KeyCodes.Enter || event.keyCode === KeyCodes.Space) {
      this.selectQueryOptions();
      event.stopPropagation();
      return false;
    }
    return true;
  };

  public getSelectMessage(): void {
    if (_.isEmpty(this.selectText()) || this.selectText() === null) {
      this.selectMessage("");
    } else {
      this.selectMessage(`${this.selectText().length} of ${this.columnOptions().length} columns selected.`);
    }
  }

  public isSelected = ko.computed<boolean>(() => {
    return !(_.isEmpty(this.selectText()) || this.selectText() === null);
  });

  private setCheckToSave(): void {
    this.unchangedSaveText(this.setFilter());
    this.unchangedSaveTop(this.topValue());
    this.unchangedSaveSelect(this.selectText());
    this.isSaveEnabled(false);
  }

  public checkIfBuilderChanged(clause: QueryClauseViewModel): void {
    this.setFilter();
  }
}
