import * as DataTables from "datatables.net";
import * as ko from "knockout";
import React from "react";
import * as _ from "underscore";
import { KeyCodes } from "../../../Common/Constants";
import { userContext } from "../../../UserContext";
import { useSidePanel } from "../../../hooks/useSidePanel";
import { TableQuerySelectPanel } from "../../Panes/Tables/TableQuerySelectPanel/TableQuerySelectPanel";
import QueryTablesTab from "../../Tabs/QueryTablesTab";
import { getQuotedCqlIdentifier } from "../CqlUtilities";
import * as DataTableUtilities from "../DataTable/DataTableUtilities";
import TableEntityListViewModel from "../DataTable/TableEntityListViewModel";
import QueryBuilderViewModel from "./QueryBuilderViewModel";

export default class QueryViewModel {
  public readonly topValueLimitMessage: string = "Please input a number between 0 and 1000.";
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
      return userContext.apiType !== "Cassandra";
    });
    const initialOptions = this._tableEntityListViewModel.headers;
    this.columnOptions = ko.observableArray<string>(initialOptions);
    this.focusTopResult = ko.observable<boolean>(false);
    this.focusExpandIcon = ko.observable<boolean>(false);

    this.queryBuilderViewModel(new QueryBuilderViewModel(this, this._tableEntityListViewModel));

    this.isSaveEnabled = ko.pureComputed<boolean>(
      () =>
        this.queryText() !== this.unchangedSaveText() ||
        this.selectText() !== this.unchangedSaveSelect() ||
        this.topValue() !== this.unchangedSaveTop(),
    );

    this.queryBuilderViewModel().clauseArray.subscribe(() => {
      this.setFilter();
    });

    this.isExceedingLimit = ko.computed<boolean>(() => {
      const currentTopValue: number = this.topValue();
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

  public ontoggleAdvancedOptionsKeyDown = (source: string, event: KeyboardEvent): boolean => {
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
    const queryString = this.isEditorActive()
      ? this.queryText()
      : userContext.apiType === "Cassandra"
      ? this.queryBuilderViewModel().getCqlFilterFromClauses()
      : this.queryBuilderViewModel().getODataFilterFromClauses();
    const filter = queryString;
    this.queryText(filter);
    return this.queryText();
  };

  private setSqlFilter = (): string => {
    return this.queryBuilderViewModel().getSqlFilterFromClauses();
  };

  private setCqlFilter = (): string => {
    return this.queryBuilderViewModel().getCqlFilterFromClauses();
  };

  public isHelperEnabled = ko
    .computed<boolean>(() => {
      return (
        this.queryText() === this.unchangedText() ||
        this.queryText() === undefined ||
        this.queryText() === "" ||
        this.isHelperActive()
      );
    })
    .extend({
      notify: "always",
    });

  public runQuery = (): DataTables.Api<Element> => {
    let filter = this.setFilter();
    if (filter && userContext.apiType !== "Cassandra") {
      filter = filter.replace(/"/g, "'");
    }
    const top = this.topValue();
    const selectOptions = this._getSelectedResults();
    const select = selectOptions;
    this._tableEntityListViewModel.tableQuery.filter = filter;
    this._tableEntityListViewModel.tableQuery.top = top;
    this._tableEntityListViewModel.tableQuery.select = select;
    this._tableEntityListViewModel.oDataQuery(filter);
    this._tableEntityListViewModel.sqlQuery(this.setSqlFilter());
    this._tableEntityListViewModel.cqlQuery(filter);

    return this._tableEntityListViewModel.reloadTable(/*useSetting*/ false, /*resetHeaders*/ false);
  };

  public clearQuery = (): DataTables.Api<Element> => {
    this.queryText();
    this.topValue();
    this.selectText();
    this.selectMessage("");
    // clears the queryBuilder and adds a new blank clause
    this.queryBuilderViewModel().queryClauses.removeAll();
    this.queryBuilderViewModel().addNewClause();
    this._tableEntityListViewModel.tableQuery.filter = undefined;
    this._tableEntityListViewModel.tableQuery.top = undefined;
    this._tableEntityListViewModel.tableQuery.select = undefined;
    this._tableEntityListViewModel.oDataQuery("");
    this._tableEntityListViewModel.sqlQuery("SELECT * FROM c");
    this._tableEntityListViewModel.cqlQuery(
      `SELECT * FROM ${getQuotedCqlIdentifier(this.queryTablesTab.collection.databaseId)}.${getQuotedCqlIdentifier(
        this.queryTablesTab.collection.id(),
      )}`,
    );
    return this._tableEntityListViewModel.reloadTable(false);
  };

  public selectQueryOptions() {
    useSidePanel.getState().openSidePanel("Select Column", <TableQuerySelectPanel queryViewModel={this} />);
  }

  public onselectQueryOptionsKeyDown = (source: string, event: KeyboardEvent): boolean => {
    if (event.keyCode === KeyCodes.Enter || event.keyCode === KeyCodes.Space) {
      this.selectQueryOptions();
      event.stopPropagation();
      return false;
    }
    return true;
  };

  public getSelectMessage(): void {
    if (_.isEmpty(this.selectText()) || this.selectText() === undefined) {
      this.selectMessage("");
    } else {
      this.selectMessage(`${this.selectText().length} of ${this.columnOptions().length} columns selected.`);
    }
  }

  public isSelected = ko.computed<boolean>(() => {
    return !(_.isEmpty(this.selectText()) || this.selectText() === undefined);
  });

  private setCheckToSave(): void {
    this.unchangedSaveText(this.setFilter());
    this.unchangedSaveTop(this.topValue());
    this.unchangedSaveSelect(this.selectText());
    this.isSaveEnabled(false);
  }

  public checkIfBuilderChanged(): void {
    this.setFilter();
  }
}
