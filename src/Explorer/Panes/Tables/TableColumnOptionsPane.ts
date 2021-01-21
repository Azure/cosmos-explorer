import * as ko from "knockout";
import * as ViewModels from "../../../Contracts/ViewModels";
import * as DataTableOperations from "../../Tables/DataTable/DataTableOperations";
import TableEntityListViewModel from "../../Tables/DataTable/TableEntityListViewModel";
import { ContextualPaneBase } from "../ContextualPaneBase";
import _ from "underscore";

/**
 * Represents an item shown in the available columns.
 * columnName: the name of the column.
 * selected: indicate whether user wants to display the column in the table.
 * order: the order in the initial table. E.g.,
 *  Order array of initial table:  I = [0, 1, 2, 3, 4, 5, 6, 7, 8]   <---->   {prop0, prop1, prop2, prop3, prop4, prop5, prop6, prop7, prop8}
 *  Order array of current table:  C = [0, 1, 2, 6, 7, 3, 4, 5, 8]   <---->   {prop0, prop1, prop2, prop6, prop7, prop3, prop4, prop5, prop8}
 *  if order = 6, then this column will be the one with column name prop6
 * index: index in the observable array, this used for selection and moving up/down.
 */
interface IColumnOption {
  columnName: ko.Observable<string>;
  selected: ko.Observable<boolean>;
  order: number;
  index: number;
}

export interface IColumnSetting {
  columnNames: string[];
  visible?: boolean[];
  order?: number[];
}

export class TableColumnOptionsPane extends ContextualPaneBase {
  public titleLabel: string = "Column Options";
  public instructionLabel: string = "Choose the columns and the order in which you want to display them in the table.";
  public availableColumnsLabel: string = "Available Columns";
  public moveUpLabel: string = "Move Up";
  public moveDownLabel: string = "Move Down";
  public noColumnSelectedWarning: string = "At least one column should be selected.";

  public columnOptions: ko.ObservableArray<IColumnOption>;
  public allSelected: ko.Computed<boolean>;
  public anyColumnSelected: ko.Computed<boolean>;
  public canSelectAll: ko.Computed<boolean>;
  public canMoveUp: ko.Observable<boolean>;
  public canMoveDown: ko.Observable<boolean>;

  public tableViewModel: TableEntityListViewModel;
  public parameters: IColumnSetting;

  private selectedColumnOption: IColumnOption = null;

  constructor(options: ViewModels.PaneOptions) {
    super(options);

    this.columnOptions = ko.observableArray<IColumnOption>();
    this.anyColumnSelected = ko.computed<boolean>(() => {
      return _.some(this.columnOptions(), (value: IColumnOption) => {
        return value.selected();
      });
    });

    this.canSelectAll = ko.computed<boolean>(() => {
      return _.some(this.columnOptions(), (value: IColumnOption) => {
        return !value.selected();
      });
    });

    this.canMoveUp = ko.observable<boolean>(false);
    this.canMoveDown = ko.observable<boolean>(false);

    this.allSelected = ko.pureComputed<boolean>({
      read: () => {
        return !this.canSelectAll();
      },
      write: value => {
        if (value) {
          this.selectAll();
        } else {
          this.clearAll();
        }
      },
      owner: this
    });
  }

  public submit() {
    var newColumnSetting = this.getParameters();
    DataTableOperations.reorderColumns(this.tableViewModel.table, newColumnSetting.order).then(() => {
      DataTableOperations.filterColumns(this.tableViewModel.table, newColumnSetting.visible);
      this.visible(false);
    });
  }
  public open() {
    this.setDisplayedColumns(this.parameters.columnNames, this.parameters.order, this.parameters.visible);
    super.open();
  }

  private getParameters(): IColumnSetting {
    var newColumnSettings: IColumnSetting = <IColumnSetting>{
      columnNames: [],
      order: [],
      visible: []
    };
    this.columnOptions().map((value: IColumnOption) => {
      newColumnSettings.columnNames.push(value.columnName());
      newColumnSettings.order.push(value.order);
      newColumnSettings.visible.push(value.selected());
    });
    return newColumnSettings;
  }

  public setDisplayedColumns(columnNames: string[], order: number[], visible: boolean[]): void {
    var options: IColumnOption[] = order.map((value: number, index: number) => {
      var columnOption: IColumnOption = {
        columnName: ko.observable<string>(columnNames[index]),
        order: value,
        selected: ko.observable<boolean>(visible[index]),
        index: index
      };
      return columnOption;
    });
    this.columnOptions(options);
  }

  public selectAll(): void {
    const columnOptions = this.columnOptions && this.columnOptions();
    columnOptions &&
      columnOptions.forEach((value: IColumnOption) => {
        value.selected(true);
      });
  }

  public clearAll(): void {
    const columnOptions = this.columnOptions && this.columnOptions();
    columnOptions &&
      columnOptions.forEach((value: IColumnOption) => {
        value.selected(false);
      });

    if (columnOptions && columnOptions.length > 0) {
      columnOptions[0].selected(true);
    }
  }

  public moveUp(): void {
    if (this.selectedColumnOption) {
      var currentSelectedIndex: number = this.selectedColumnOption.index;
      var swapTargetIndex: number = currentSelectedIndex - 1;
      //Debug.assert(currentSelectedIndex > 0);

      this.swapColumnOption(this.columnOptions(), swapTargetIndex, currentSelectedIndex);
      this.selectTargetItem($(`div.column-options li:eq(${swapTargetIndex})`), this.columnOptions()[swapTargetIndex]);
    }
  }

  public moveDown(): void {
    if (this.selectedColumnOption) {
      var currentSelectedIndex: number = this.selectedColumnOption.index;
      var swapTargetIndex: number = currentSelectedIndex + 1;
      //Debug.assert(currentSelectedIndex < (this.columnOptions().length - 1));

      this.swapColumnOption(this.columnOptions(), swapTargetIndex, currentSelectedIndex);
      this.selectTargetItem($(`div.column-options li:eq(${swapTargetIndex})`), this.columnOptions()[swapTargetIndex]);
    }
  }

  public handleClick = (data: IColumnOption, event: KeyboardEvent): boolean => {
    this.selectTargetItem($(event.currentTarget), data);
    return true;
  };

  private selectTargetItem($target: JQuery, targetColumn: IColumnOption): void {
    this.selectedColumnOption = targetColumn;

    this.canMoveUp(targetColumn.index !== 0);
    this.canMoveDown(targetColumn.index !== this.columnOptions().length - 1);

    $(".list-item.selected").removeClass("selected");
    $target.addClass("selected");
  }

  private swapColumnOption(options: IColumnOption[], indexA: number, indexB: number): void {
    var tempColumnName: string = options[indexA].columnName();
    var tempSelected: boolean = options[indexA].selected();
    var tempOrder: number = options[indexA].order;

    options[indexA].columnName(options[indexB].columnName());
    options[indexB].columnName(tempColumnName);

    options[indexA].selected(options[indexB].selected());
    options[indexB].selected(tempSelected);

    options[indexA].order = options[indexB].order;
    options[indexB].order = tempOrder;
  }
}
