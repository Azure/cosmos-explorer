import * as ko from "knockout";
import _ from "underscore";
import * as Constants from "../../Tables/Constants";
import QueryViewModel from "../../Tables/QueryBuilder/QueryViewModel";
import * as ViewModels from "../../../Contracts/ViewModels";
import { ContextualPaneBase } from "../ContextualPaneBase";

export interface ISelectColumn {
  columnName: ko.Observable<string>;
  selected: ko.Observable<boolean>;
  editable: ko.Observable<boolean>;
}

export class QuerySelectPane extends ContextualPaneBase implements ViewModels.QuerySelectPane {
  public titleLabel: string = "Select Columns";
  public instructionLabel: string = "Select the columns that you want to query.";
  public availableColumnsTableQueryLabel: string = "Available Columns";
  public noColumnSelectedWarning: string = "At least one column should be selected.";

  public columnOptions: ko.ObservableArray<ISelectColumn>;
  public anyColumnSelected: ko.Computed<boolean>;
  public canSelectAll: ko.Computed<boolean>;
  public allSelected: ko.Computed<boolean>;

  private selectedColumnOption: ISelectColumn = null;

  public queryViewModel: QueryViewModel;

  constructor(options: ViewModels.PaneOptions) {
    super(options);

    this.columnOptions = ko.observableArray<ISelectColumn>();
    this.anyColumnSelected = ko.computed<boolean>(() => {
      return _.some(this.columnOptions(), (value: ISelectColumn) => {
        return value.selected();
      });
    });

    this.canSelectAll = ko.computed<boolean>(() => {
      return _.some(this.columnOptions(), (value: ISelectColumn) => {
        return !value.selected();
      });
    });

    this.allSelected = ko.pureComputed<boolean>({
      read: () => {
        return !this.canSelectAll();
      },
      write: (value) => {
        if (value) {
          this.selectAll();
        } else {
          this.clearAll();
        }
      },
      owner: this,
    });
  }

  public submit() {
    this.queryViewModel.selectText(this.getParameters());
    this.queryViewModel.getSelectMessage();
    this.close();
  }

  public open() {
    this.setTableColumns(this.queryViewModel.columnOptions());
    this.setDisplayedColumns(this.queryViewModel.selectText(), this.columnOptions());
    super.open();
  }

  private getParameters(): string[] {
    if (this.canSelectAll() === false) {
      return [];
    }

    var selectedColumns = this.columnOptions().filter((value: ISelectColumn) => value.selected() === true);

    var columns: string[] = selectedColumns.map((value: ISelectColumn) => {
      var name: string = value.columnName();
      return name;
    });

    return columns;
  }

  public setTableColumns(columnNames: string[]): void {
    var columns: ISelectColumn[] = columnNames.map((value: string) => {
      var columnOption: ISelectColumn = {
        columnName: ko.observable<string>(value),
        selected: ko.observable<boolean>(true),
        editable: ko.observable<boolean>(this.isEntityEditable(value)),
      };
      return columnOption;
    });

    this.columnOptions(columns);
  }

  public setDisplayedColumns(querySelect: string[], columns: ISelectColumn[]): void {
    if (querySelect == null || _.isEmpty(querySelect)) {
      return;
    }
    this.setSelected(querySelect, columns);
  }

  private setSelected(querySelect: string[], columns: ISelectColumn[]): void {
    this.clearAll();
    querySelect &&
      querySelect.forEach((value: string) => {
        for (var i = 0; i < columns.length; i++) {
          if (value === columns[i].columnName()) {
            columns[i].selected(true);
          }
        }
      });
  }

  public availableColumnsCheckboxClick(): boolean {
    if (this.canSelectAll()) {
      return this.selectAll();
    } else {
      return this.clearAll();
    }
  }

  public selectAll(): boolean {
    const columnOptions = this.columnOptions && this.columnOptions();
    columnOptions &&
      columnOptions.forEach((value: ISelectColumn) => {
        value.selected(true);
      });
    return true;
  }

  public clearAll(): boolean {
    const columnOptions = this.columnOptions && this.columnOptions();
    columnOptions &&
      columnOptions.forEach((column: ISelectColumn) => {
        if (this.isEntityEditable(column.columnName())) {
          column.selected(false);
        } else {
          column.selected(true);
        }
      });
    return true;
  }

  public handleClick = (data: ISelectColumn, event: KeyboardEvent): boolean => {
    this.selectTargetItem($(event.currentTarget), data);
    return true;
  };

  private selectTargetItem($target: JQuery, targetColumn: ISelectColumn): void {
    this.selectedColumnOption = targetColumn;

    $(".list-item.selected").removeClass("selected");
    $target.addClass("selected");
  }

  private isEntityEditable(name: string) {
    if (this.queryViewModel.queryTablesTab.container.isPreferredApiCassandra()) {
      const cassandraKeys = this.queryViewModel.queryTablesTab.collection.cassandraKeys.partitionKeys
        .concat(this.queryViewModel.queryTablesTab.collection.cassandraKeys.clusteringKeys)
        .map((key) => key.property);
      return !_.contains<string>(cassandraKeys, name);
    }
    return !(
      name === Constants.EntityKeyNames.PartitionKey ||
      name === Constants.EntityKeyNames.RowKey ||
      name === Constants.EntityKeyNames.Timestamp
    );
  }
}
