import { DetailsList, DetailsListLayoutMode, IColumn, Selection, SelectionMode } from "@fluentui/react";
import { Dropdown, IDropdownOption, IDropdownStyles } from "@fluentui/react/lib/Dropdown";
import * as ko from "knockout";
import React, { Component } from "react";
import QueryInformation from "../../../../images//QueryBuilder/QueryInformation_16x.png";
import AddProperty from "../../../../images/Add-property.svg";
import AddEntityIcon from "../../../../images/AddEntity.svg";
import AndOr from "../../../../images/And-Or.svg";
import DeleteEntitiesIcon from "../../../../images/DeleteEntities.svg";
import EditEntityIcon from "../../../../images/Edit-entity.svg";
import EntityCancel from "../../../../images/Entity_cancel.svg";
import ErrorRed from "../../../../images/error_red.svg";
import ExecuteQueryIcon from "../../../../images/ExecuteQuery.svg";
import QueryBuilderIcon from "../../../../images/Query-Builder.svg";
import QueryTextIcon from "../../../../images/Query-Text.svg";
import StatusWraning from "../../../../images/QueryBuilder/StatusWarning_16x.png";
import TriangleDown from "../../../../images/Triangle-down.svg";
import TriangleRight from "../../../../images/Triangle-right.svg";
import * as ViewModels from "../../../Contracts/ViewModels";
import { useSidePanel } from "../../../hooks/useSidePanel";
import { userContext } from "../../../UserContext";
import { CommandButtonComponentProps } from "../../Controls/CommandButton/CommandButtonComponent";
import Explorer from "../../Explorer";
import { useCommandBar } from "../../Menus/CommandBar/CommandBarComponentAdapter";
import { AddTableEntityPanel } from "../../Panes/Tables/AddTableEntityPanel";
import { EditTableEntityPanel } from "../../Panes/Tables/EditTableEntityPanel";
import TableCommands from "../../Tables/DataTable/TableCommands";
import TableEntityListViewModel from "../../Tables/DataTable/TableEntityListViewModel";
import * as Entities from "../../Tables/Entities";
import QueryViewModel from "../../Tables/QueryBuilder/QueryViewModel";
import { CassandraAPIDataClient, TableDataClient } from "../../Tables/TableDataClient";
import TabsBase from "../TabsBase";
import NewQueryTablesTab from "./QueryTablesTab";

export interface Button {
  visible: boolean;
  enabled: boolean;
  isSelected?: boolean;
}
export interface IDocument {
  partitionKey: string;
  rowKey: string;
  timeStamp: string;
}
export interface IQueryTablesTabComponentProps {
  tabKind: ViewModels.CollectionTabKind;
  title: string;
  tabPath: string;
  collection: ViewModels.CollectionBase;
  node: ViewModels.TreeNode;
  onLoadStartKey: number;
  container: Explorer;
  tabsBaseInstance: TabsBase;
  queryTablesTab: NewQueryTablesTab;
}

interface IQueryTablesTabComponentStates {
  tableEntityListViewModel: TableEntityListViewModel;
  queryViewModel: QueryViewModel;
  queryText: string;
  selectedQueryText: string;
  executeQueryButton: Button;
  queryBuilderButton: Button;
  queryTextButton: Button;
  addEntityButton: Button;
  editEntityButton: Button;
  deleteEntityButton: Button;
  isHelperActive: boolean;
  columns: IColumn[];
  items: IDocument[];
  isExpanded: boolean;
  isEditorActive: boolean;
  selectedItems: Entities.ITableEntity[];
  isValue: boolean;
  isTimestamp: boolean;
  isCustomLastTimestamp: boolean;
  isCustomRangeTimestamp: boolean;
  operators: string[];
  selectMessage: string;
}

class QueryTablesTabComponent extends Component<IQueryTablesTabComponentProps, IQueryTablesTabComponentStates> {
  // public readonly html = template;
  public collection: ViewModels.Collection;
  // public tableEntityListViewModel = ko.observable<TableEntityListViewModel>();
  public _queryViewModel: QueryViewModel;
  public tableCommands: TableCommands;
  public tableDataClient: TableDataClient;

  //   public queryText = ko.observable("PartitionKey eq 'partitionKey1'"); // Start out with an example they can modify
  //   public selectedQueryText = ko.observable("").extend({ notify: "always" });

  public executeQueryButton: ViewModels.Button;
  public addEntityButton: ViewModels.Button;
  public editEntityButton: ViewModels.Button;
  public deleteEntityButton: ViewModels.Button;
  public queryBuilderButton: ViewModels.Button;
  public queryTextButton: ViewModels.Button;
  public container: Explorer;
  public andLabel: string;
  public actionLabel: string;
  public fieldLabel: string;
  public dataTypeLabel: string;
  public operatorLabel: string;
  public valueLabel: string;
  public tableEntityListViewModel1: TableEntityListViewModel;
  public tableEntityListViewModel2 = ko.observable<TableEntityListViewModel>();
  public allItems: IDocument[];
  public columns: IColumn[];
  public selection: Selection;
  public options: IDropdownOption[] = [];
  public dropdownStyles: Partial<IDropdownStyles>;

  constructor(props: IQueryTablesTabComponentProps) {
    super(props);
    this.columns = [];

    const columns: IColumn[] = [
      {
        key: "column1",
        name: "PartitionKey",
        minWidth: 100,
        maxWidth: 200,
        data: String,
        fieldName: "partitionKey",
        // onRender: this.onRenderColumnItem,
      },
      {
        key: "column2",
        name: "RowKey",
        minWidth: 100,
        maxWidth: 200,
        data: String,
        fieldName: "rowKey",
      },
      {
        key: "column3",
        name: "Timestamp",
        minWidth: 200,
        maxWidth: 200,
        data: String,
        fieldName: "timeStamp",
      },
    ];
    this.container = props.collection && props.collection.container;
    this.tableCommands = new TableCommands(this.container);
    this.tableDataClient = this.container.tableDataClient;
    this.tableEntityListViewModel2(new TableEntityListViewModel(this.tableCommands, props.queryTablesTab));
    // const sampleQuerySubscription = this.tableEntityListViewModel2().items.subscribe(() => {
    //   if (this.tableEntityListViewModel2().items().length > 0 && userContext.apiType === "Tables") {
    //     // this.queryViewModel().queryBuilderViewModel().setExample();
    //     console.log(
    //       "🚀 ~ file: QueryTablesTab.tsx ~ line 55 ~ QueryTablesTab ~ sampleQuerySubscription ~ this.queryViewModel().queryBuilderViewModel().setExample()"
    //       // this.queryViewModel().queryBuilderViewModel().setExample()
    //     );
    //   }
    //   sampleQuerySubscription.dispose();
    // });

    this.tableEntityListViewModel1 = new TableEntityListViewModel(this.tableCommands, props.queryTablesTab);
    // this._queryViewModel = new QueryViewModel(this.props.queryTablesTab);
    this.state = {
      tableEntityListViewModel: new TableEntityListViewModel(this.tableCommands, props.queryTablesTab),

      // tableEntityListViewModel.queryTablesTab : this.props.queryTablesTab
      queryViewModel: new QueryViewModel(this.props.queryTablesTab),
      queryText: "PartitionKey eq 'partionKey1'",
      selectedQueryText: "",
      isHelperActive: true,
      executeQueryButton: {
        enabled: true,
        visible: true,
        isSelected: false,
      },
      queryBuilderButton: {
        enabled: true,
        visible: true,
        isSelected: false,
      },
      queryTextButton: {
        enabled: true,
        visible: true,
        isSelected: false,
      },
      addEntityButton: {
        enabled: true,
        visible: true,
        isSelected: false,
      },
      editEntityButton: {
        enabled: true,
        visible: true,
        isSelected: false,
      },
      deleteEntityButton: {
        enabled: true,
        visible: true,
        isSelected: false,
      },
      columns: columns,
      items: [],
      isExpanded: false,
      isEditorActive: false,
      selectedItems: [],
      isValue: false,
      isTimestamp: false,
      isCustomLastTimestamp: false,
      isCustomRangeTimestamp: false,
      operators: [],
    };
    this.state.tableEntityListViewModel.queryTablesTab = this.props.queryTablesTab;
    // console.log(
    //   "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 24 ~ QueryTablesTabComponent ~ constructor ~ props",
    //   props
    // );
    console.log(
      "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 85 ~ QueryTablesTabComponent ~ constructor ~ this.state",
      this.state,
      ", ",
      this.state.queryViewModel.queryBuilderViewModel(),
      ", ",
      this.state.queryViewModel.queryBuilderViewModel().clauseArray(),
      ", ",
      this.state.tableEntityListViewModel.items(),
      ", tableEntityList > ",
      this.state.tableEntityListViewModel
    );
    const x = this.state.tableEntityListViewModel.items();
    console.log("🚀 ~ file: QueryTablesTabComponent.tsx ~ line 146 ~ QueryTablesTabComponent ~ constructor ~ x", x);
    this.andLabel = this.state.queryViewModel.queryBuilderViewModel().andLabel;
    this.actionLabel = this.state.queryViewModel.queryBuilderViewModel().actionLabel;
    this.fieldLabel = this.state.queryViewModel.queryBuilderViewModel().fieldLabel;
    this.dataTypeLabel = this.state.queryViewModel.queryBuilderViewModel().dataTypeLabel;
    this.operatorLabel = this.state.queryViewModel.queryBuilderViewModel().operatorLabel;
    this.valueLabel = this.state.queryViewModel.queryBuilderViewModel().valueLabel;
    console.log(
      "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 232 ~ QueryTablesTabComponent ~ constructor ~ this.state.queryViewModel.queryBuilderViewModel().operators",
      this.state.queryViewModel.queryBuilderViewModel().operators()
    );

    useCommandBar.getState().setContextButtons(this.getTabsButtons());

    // this.test();
    this.state.queryViewModel
      .queryBuilderViewModel()
      .operators()
      .map((operator) => {
        this.options.push({
          key: operator,
          text: operator,
        });
      });
    // this.options = [
    //   { key: "fruitsHeader", text: "Fruits", itemType: DropdownMenuItemType.Header },
    //   { key: "apple", text: "Apple" },
    //   { key: "banana", text: "Banana" },
    //   { key: "orange", text: "Orange", disabled: true },
    //   { key: "grape", text: "Grape" },
    //   { key: "divider_1", text: "-", itemType: DropdownMenuItemType.Divider },
    //   { key: "vegetablesHeader", text: "Vegetables", itemType: DropdownMenuItemType.Header },
    //   { key: "broccoli", text: "Broccoli" },
    //   { key: "carrot", text: "Carrot" },
    //   { key: "lettuce", text: "Lettuce" },
    // ];

    this.dropdownStyles = {
      dropdown: { width: 300 },
    };

    this.selection = new Selection({
      onSelectionChanged: this.onItemsSelectionChanged,
    });

    this.buildCommandBarOptions();
  }

  /****************** Constructor Ends */

  async componentDidMount(): Promise<void> {
    const abc = await this.state.tableEntityListViewModel.renderNextPageAndupdateCache();
    console.log(
      "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 249 ~ QueryTablesTabComponent ~ componentDidMount ~ abc",
      abc
    );
    setTimeout(() => {
      console.log("items > ", this.state.tableEntityListViewModel.cache.data);
      console.log("items > ", this.state.tableEntityListViewModel.items());
      console.log("items1 > ", this.state.tableEntityListViewModel.headers);
      console.log("items1 > simple > ", this.tableEntityListViewModel1.items1);
      this.columns = [];
      this.state.tableEntityListViewModel.headers.map((header) => {
        this.columns.push({
          key: header,
          name: header,
          minWidth: 100,
          maxWidth: 200,
          data: "string",
          fieldName: header,
          isResizable: true,
          isSorted: true,
          isSortedDescending: false,
          sortAscendingAriaLabel: "Sorted A to Z",
          sortDescendingAriaLabel: "Sorted Z to A",
        });
      });
      this.setState({
        columns: this.columns,
        operators: this.state.queryViewModel.queryBuilderViewModel().operators(),
        // isValue:
      });
      setTimeout(() => {
        console.log(
          "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 248 ~ QueryTablesTabComponent ~ setTimeout ~ columns",
          this.state.columns
        );
      }, 1000);
      this.allItems = this.generateDetailsList();
      this.setState({
        items: this.allItems,
      });
    }, 5000);
  }

  // public async test(): Promise<void> {
  //   await this.state.tableEntityListViewModel.renderNextPageAndupdateCache().then(() => {
  //     console.log("inside > ", this.state.tableEntityListViewModel.items());
  //   });
  //   console.log("items > ", this.state.tableEntityListViewModel.items());
  // }

  public getSelectMessage(selectMessage: string): void {
    console.log(
      "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 332 ~ QueryTablesTabComponent ~ getSelectMessage ~ selectMessage",
      selectMessage
    );
    this.setState({
      selectMessage: selectMessage,
    });
  }

  private onItemsSelectionChanged = () => {
    // console.log(
    //   "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 280 ~ QueryTablesTabComponent ~ onItemsSelectionChanged",
    //   Object.values(this.selection.getSelection()[0])[2],
    //   ", ",
    //   this.selection.getSelection()[0]["Timestamp"]
    // );
    console.log(
      "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 338 ~ QueryTablesTabComponent ~ this.selection.getSelection().length",
      this.selection.getSelection().length
    );
    if (this.selection.getSelection().length > 0) {
      const a = this.state.tableEntityListViewModel
        .items()
        .filter((item) => item["Timestamp"]._ === Object.values(this.selection.getSelection()[0])[2]);
      console.log("🚀 ~ file: QueryTablesTabComponent.tsx ~ line 293 ~ QueryTablesTabComponent ~ a", a);

      this.setState({
        // selectionCount: this._selection.getSelectedCount(),
        selectedItems: a,
      });
    }
  };

  public reloadEntities(): void {
    this.componentDidMount();
    // console.log(
    //   "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 349 ~ QueryTablesTabComponent ~ addEntity ~ addedEntity",
    //   addedEntity,
    //   ", ",
    //   this.state.tableEntityListViewModel.items()
    // );
    // const newItems: any[] = this.state.items;
    // newItems.push(addedEntity);
    // this.setState({
    //   items: newItems,
    // });
    // console.log(
    //   "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 358 ~ QueryTablesTabComponent ~ addEntity ~ items",
    //   this.state.items
    // );
    // this.allItems = this.generateDetailsList();
    // console.log(
    //   "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 365 ~ QueryTablesTabComponent ~ addEntity ~ this.allItems",
    //   this.allItems
    // );
    // this.setState({
    //   items: this.allItems,
    // });
  }

  public onAddEntityClick = (): void => {
    useSidePanel
      .getState()
      .openSidePanel(
        "Add Table Entity",
        <AddTableEntityPanel
          tableDataClient={this.tableDataClient}
          queryTablesTab={this.props.queryTablesTab}
          tableEntityListViewModel={this.state.tableEntityListViewModel}
          cassandraApiClient={new CassandraAPIDataClient()}
          reloadEntities={() => this.reloadEntities()}
        />
      );
  };

  public onEditEntityClick = (): void => {
    useSidePanel
      .getState()
      .openSidePanel(
        "Edit Table Entity",
        <EditTableEntityPanel
          tableDataClient={this.tableDataClient}
          queryTablesTab={this.props.queryTablesTab}
          tableEntityListViewModel={this.state.tableEntityListViewModel}
          cassandraApiClient={new CassandraAPIDataClient()}
          selectedEntity={this.state.selectedItems}
          reloadEntities={() => this.reloadEntities()}
        />
      );
  };

  public onDeleteEntityClick = (): void => {
    // this.tableCommands.deleteEntitiesCommand(this.state.tableEntityListViewModel);
    // if (!viewModel) {
    //   return null; // Error
    // }
    if (!this.state.selectedItems) {
      return undefined; // Error
    }
    const entitiesToDelete: Entities.ITableEntity[] = this.state.selectedItems;
    let deleteMessage = "Are you sure you want to delete the selected entities?";
    if (userContext.apiType === "Cassandra") {
      deleteMessage = "Are you sure you want to delete the selected rows?";
    }
    if (window.confirm(deleteMessage)) {
      this.state.tableEntityListViewModel.queryTablesTab.container.tableDataClient
        .deleteDocuments(this.state.tableEntityListViewModel.queryTablesTab.collection, entitiesToDelete)
        .then((results: any) => {
          return this.state.tableEntityListViewModel.removeEntitiesFromCache(entitiesToDelete).then(() => {
            // this.state.tableEntityListViewModel.redrawTableThrottled();
            this.componentDidMount();
          });
        });
    }
  };

  protected getTabsButtons(): CommandButtonComponentProps[] {
    const buttons: CommandButtonComponentProps[] = [];
    if (this.state.queryBuilderButton.visible) {
      const label = userContext.apiType === "Cassandra" ? "CQL Query Builder" : "Query Builder";
      buttons.push({
        iconSrc: QueryBuilderIcon,
        iconAlt: label,
        onCommandClick: () => this.selectHelper(),
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.state.queryBuilderButton.enabled,
        isSelected: this.state.queryBuilderButton.isSelected,
      });
    }

    if (this.state.queryTextButton.visible) {
      const label = userContext.apiType === "Cassandra" ? "CQL Query Text" : "Query Text";
      buttons.push({
        iconSrc: QueryTextIcon,
        iconAlt: label,
        onCommandClick: () => this.selectEditor(),
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.state.queryTextButton.enabled,
        isSelected: this.state.queryTextButton.isSelected,
      });
    }

    if (this.state.executeQueryButton.visible) {
      const label = "Run Query";
      buttons.push({
        iconSrc: ExecuteQueryIcon,
        iconAlt: label,
        onCommandClick: () => this.state.queryViewModel.runQuery(),
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.state.executeQueryButton.enabled,
      });
    }

    if (this.state.addEntityButton.visible) {
      const label = userContext.apiType === "Cassandra" ? "Add Row" : "Add Entity";
      buttons.push({
        iconSrc: AddEntityIcon,
        iconAlt: label,
        onCommandClick: this.onAddEntityClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: true,
        disabled: !this.state.addEntityButton.enabled,
      });
    }

    if (this.state.editEntityButton.visible) {
      const label = userContext.apiType === "Cassandra" ? "Edit Row" : "Edit Entity";
      buttons.push({
        iconSrc: EditEntityIcon,
        iconAlt: label,
        onCommandClick: this.onEditEntityClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: true,
        disabled: !this.state.editEntityButton.enabled,
      });
    }

    if (this.state.deleteEntityButton.visible) {
      const label = userContext.apiType === "Cassandra" ? "Delete Rows" : "Delete Entities";
      buttons.push({
        iconSrc: DeleteEntitiesIcon,
        iconAlt: label,
        onCommandClick: this.onDeleteEntityClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: true,
        disabled: !this.state.deleteEntityButton.enabled,
      });
    }
    return buttons;
  }

  protected buildCommandBarOptions(): void {
    this.props.tabsBaseInstance.updateNavbarWithTabsButtons();
  }

  public generateDetailsList(): IDocument[] {
    // const items: IDocument[] = [];
    //eslint-disable-next-line
    const items: any[] = [];
    //eslint-disable-next-line
    let obj: any = undefined;
    // const newColumns = [];
    // const compare = ["PartitionKey", "RowKey", "Timestamp", "_rid", "_self", "_etag", "_attachments"];

    this.state.tableEntityListViewModel.items().map((item) => {
      console.log("generateDetailsList > ", item["PartitionKey"]._);
      this.columns.map((col) => {
        // console.log(
        //   "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 403 ~ QueryTablesTabComponent ~ this.columns.map ~ col.name",
        //   col.name
        // );
        if (item[col.name]) {
          console.log("Data > ", item[col.name]._);
          obj = { ...obj, ...{ [col.name]: item[col.name]._ } };
        }
      });
      items.push(obj);
    });
    console.log(
      "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 383 ~ QueryTablesTabComponent ~ this.state.tableEntityListViewModel.items ~ items",
      items
    );
    return items;
  }

  public toggleAdvancedOptions(): void {
    // console.log("toggleAdvancedOptions!");
    this.setState({
      isExpanded: !this.state.isExpanded,
    });
    this.state.queryViewModel.toggleAdvancedOptions();
  }

  public selectEditor(): void {
    this.setState({
      isEditorActive: true,
      isHelperActive: false,
    });
  }

  public selectHelper(): void {
    this.setState({
      isHelperActive: true,
      isEditorActive: false,
    });
  }

  render(): JSX.Element {
    useCommandBar.getState().setContextButtons(this.getTabsButtons());

    return (
      <div className="tab-pane tableContainer" id={this.props.tabsBaseInstance.tabId} role="tabpanel">
        <div className="query-builder">
          <div className="error-bar">
            {this.state.queryViewModel.hasQueryError() && (
              <div className="error-message" aria-label="Error Message">
                <span>
                  <img className="entity-error-Img" src={ErrorRed} />
                </span>
                <span className="error-text" role="alert"></span>
              </div>
            )}
          </div>
          {this.state.isEditorActive && (
            <div className="query-editor-panel">
              <div>
                <textarea
                  className={`query-editor-text ${
                    this.state.queryViewModel.hasQueryError() ? "query-editor-text-invalid" : ""
                  } `}
                  value={this.state.queryText}
                  readOnly={true}
                  name="query-editor"
                  rows={5}
                  cols={100}
                ></textarea>
              </div>
            </div>
          )}
          {this.state.isHelperActive && (
            <div style={{ paddingLeft: "13px" }}>
              <div className="clause-table">
                <div className="scroll-box scrollable" id="scroll">
                  <table className="clause-table">
                    <thead>
                      <tr className="clause-table-row">
                        <th className="clause-table-cell header-background action-header">
                          <span>{this.actionLabel}</span>
                        </th>
                        <th className="clause-table-cell header-background group-control-header">
                          <button type="button">
                            <img className="and-or-svg" src={AndOr} alt="Group selected clauses" />
                          </button>
                        </th>
                        <th className="clause-table-cell header-background"></th>
                        <th className="clause-table-cell header-background and-or-header">
                          <span>{this.andLabel}</span>
                        </th>
                        <th className="clause-table-cell header-background field-header">
                          <span>{this.fieldLabel}</span>
                        </th>
                        <th className="clause-table-cell header-background type-header">
                          <span>{this.dataTypeLabel}</span>
                        </th>
                        <th className="clause-table-cell header-background operator-header">
                          <span>{this.operatorLabel}</span>
                        </th>
                        <th className="clause-table-cell header-background value-header">
                          <span>{this.valueLabel}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="clause-table-row">
                        {/* Add and Cancel */}
                        <td className="clause-table-cell action-column">
                          <span
                            className="entity-Add-Cancel"
                            role="button"
                            tabIndex={0}
                            // data-bind="click: $parent.addClauseIndex.bind($data, $index()), event: { keydown: $parent.onAddClauseKeyDown.bind($data, $index()) }, attr:{title: $parent.insertNewFilterLine}"
                          >
                            <img className="querybuilder-addpropertyImg" src={AddProperty} alt="Add clause" />
                          </span>
                          <span
                            className="entity-Add-Cancel"
                            role="button"
                            tabIndex={0}
                            // data-bind="hasFocus: isDeleteButtonFocused, click: $parent.deleteClause.bind($data, $index()), event: { keydown: $parent.onDeleteClauseKeyDown.bind($data, $index()) }, attr:{title: $parent.removeThisFilterLine}"
                          >
                            <img className="querybuilder-cancelImg" src={EntityCancel} alt="Delete clause" />
                          </span>
                        </td>
                        {/* Group and unGroup */}
                        <td className="clause-table-cell group-control-column">
                          <input type="checkbox" aria-label="And/Or" data-bind="checked: checkedForGrouping" />
                        </td>
                        <td>
                          <table className="group-indicator-table">
                            <tbody>
                              <tr data-bind="template: { name: 'groupIndicator-template', foreach: $parent.getClauseGroupViewModels($data), as: 'gi' }"></tr>
                            </tbody>
                          </table>
                        </td>
                        {/* AndOr */}
                        <td className="clause-table-cell and-or-column">
                          <select
                            className="clause-table-field and-or-column"
                            aria-label="and_or"
                            // data-bind="hasFocus: isAndOrFocused, options: $parent.clauseRules, value: and_or, visible: canAnd, attr:{ 'aria-label': and_or }"
                          >
                            {this.state.queryViewModel
                              .queryBuilderViewModel()
                              .clauseRules()
                              .map((clause) => {
                                <option>{clause}</option>;
                              })}
                          </select>
                        </td>
                        {/* Field */}
                        <td className="clause-table-cell field-column" data-bind="click: $parent.updateColumnOptions">
                          <select
                            className="clause-table-field field-column"
                            data-bind="options: $parent.columnOptions, value: field, attr:{ 'aria-label': field }"
                          ></select>
                        </td>
                        {/* Type */}
                        <td className="clause-table-cell type-column">
                          <select
                            className="clause-table-field type-column"
                            data-bind="
                  options: $parent.edmTypes,
                  enable: isTypeEditable,
                  value: type,
                  css: {'query-builder-isDisabled': !isTypeEditable()},
                  attr: { 'aria-label': type }"
                          ></select>
                        </td>
                        {/* Operator */}
                        <td className="clause-table-cell operator-column">
                          <Dropdown
                            placeholder="Select an option"
                            // label="Basic uncontrolled example"
                            options={this.options}
                            styles={this.dropdownStyles}
                          />
                        </td>
                        {/* Value */}
                        <td className="clause-table-cell value-column">
                          <input
                            type="text"
                            className="clause-table-field value-column"
                            // type="search"
                            data-bind="textInput: value, attr: {'aria-label': $parent.valueLabel}"
                          />

                          <select
                            className="clause-table-field time-column"
                            data-bind="options: $parent.timeOptions, value: timeValue"
                          ></select>

                          <input
                            className="clause-table-field time-column"
                            data-bind="value: customTimeValue, click: customTimestampDialog"
                          />
                          <input
                            className="clause-table-field time-column"
                            type="datetime-local"
                            step="1"
                            data-bind="value: customTimeValue"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div
                  className="addClause"
                  role="button"
                  onClick={this.state.queryViewModel.queryBuilderViewModel().addNewClause}
                  // data-bind="click: addNewClause, event: { keydown: onAddNewClauseKeyDown }, attr: { title: addNewClauseLine }"
                  tabIndex={0}
                >
                  <div className="addClause-heading">
                    <span className="clause-table addClause-title">
                      <img
                        className="addclauseProperty-Img"
                        style={{ marginBottom: "5px" }}
                        src={AddProperty}
                        alt="Add new clause"
                      />
                      <span
                        style={{ marginLeft: "5px" }}
                        // data-bind="text: addNewClauseLine"
                      >
                        {this.state.queryViewModel.queryBuilderViewModel().addNewClauseLine}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="advanced-options-panel">
            <div className="advanced-heading" onClick={() => this.toggleAdvancedOptions()}>
              <span
                className="advanced-title"
                role="button"
                aria-expanded={this.state.isExpanded}
                // onKeyDown = {() => this.state.queryViewModel.ontoggleAdvancedOptionsKeyDown}
                // data-bind="click:toggleAdvancedOptions, event: { keydown: ontoggleAdvancedOptionsKeyDown }, attr:{ 'aria-expanded': isExpanded() ? 'true' : 'false' }"
                tabIndex={0}
              >
                {!this.state.isExpanded && (
                  <div className="themed-images" id="ExpandChevronRight">
                    <img
                      className="imgiconwidth expand-triangle expand-triangle-right"
                      src={TriangleRight}
                      alt="toggle"
                    />
                  </div>
                )}
                {this.state.queryViewModel.isExpanded() && (
                  <div className="themed-images" id="ExpandChevronDown">
                    <img className="imgiconwidth expand-triangle" src={TriangleDown} alt="toggle" />
                  </div>
                )}
                <span>Advanced Options</span>
              </span>
            </div>
            {this.state.isExpanded && (
              <div className="advanced-options">
                <div className="top">
                  <span>Show top results:</span>
                  <input
                    className="top-input"
                    type="number"
                    title={this.state.queryViewModel.topValueLimitMessage}
                    //   data-bind="hasFocus: focusTopResult, textInput: topValue, attr: { title: topValueLimitMessage }"
                    role="textbox"
                    aria-label="Show top results"
                  />
                  {this.state.queryViewModel.isExceedingLimit() && (
                    <div role="alert" aria-atomic="true" className="inline-div">
                      <img className="advanced-options-icon" src={StatusWraning} />
                      <span>{this.state.queryViewModel.topValueLimitMessage}</span>
                    </div>
                  )}
                </div>
                <div className="select">
                  <span> Select fields for query: </span>
                  {/* {this.state.queryViewModel.isSelected() && ( */}
                  <div>
                    <img className="advanced-options-icon" src={QueryInformation} />
                    <span className="select-options-text">{this.state.selectMessage}</span>
                  </div>
                  {/* )} */}
                  <a
                    className="select-options-link"
                    //   data-bind="click: selectQueryOptions, event: { keydown: onselectQueryOptionsKeyDown }"
                    tabIndex={0}
                    role="link"
                    onClick={() =>
                      this.state.queryViewModel.selectQueryOptions(
                        this.state.tableEntityListViewModel.headers,
                        (selectMessage: string) => this.getSelectMessage(selectMessage)
                      )
                    }
                  >
                    <span>Choose Columns... </span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="tablesQueryTab tableContainer">
          <DetailsList
            items={this.state.items}
            columns={this.state.columns}
            selectionMode={SelectionMode.single}
            layoutMode={DetailsListLayoutMode.justified}
            compact={true}
            selection={this.selection}
          />
        </div>
      </div>
    );
  }
}

export default QueryTablesTabComponent;
