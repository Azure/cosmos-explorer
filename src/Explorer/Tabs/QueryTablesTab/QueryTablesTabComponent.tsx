import * as ko from "knockout";
import React, { Component } from "react";
import QueryInformation from "../../../../images//QueryBuilder/QueryInformation_16x.png";
import AddProperty from "../../../../images/Add-property.svg";
import AddEntityIcon from "../../../../images/AddEntity.svg";
import AndOr from "../../../../images/And-Or.svg";
import DeleteEntitiesIcon from "../../../../images/DeleteEntities.svg";
import EditEntityIcon from "../../../../images/Edit-entity.svg";
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
import QueryViewModel from "../../Tables/QueryBuilder/QueryViewModel";
import { CassandraAPIDataClient, TableDataClient } from "../../Tables/TableDataClient";
import TabsBase from "../TabsBase";
import NewQueryTablesTab from "./QueryTablesTab";

export interface Button {
  visible: boolean;
  enabled: boolean;
  isSelected?: boolean;
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
}

class QueryTablesTabComponent extends Component<IQueryTablesTabComponentProps, IQueryTablesTabComponentStates> {
  // public readonly html = template;
  public collection: ViewModels.Collection;
  // public tableEntityListViewModel = ko.observable<TableEntityListViewModel>();
  // public queryViewModel = ko.observable<QueryViewModel>();
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

  constructor(props: IQueryTablesTabComponentProps) {
    super(props);
    this.container = props.collection && props.collection.container;
    this.tableCommands = new TableCommands(this.container);
    this.tableDataClient = this.container.tableDataClient;
    this.tableEntityListViewModel2(new TableEntityListViewModel(this.tableCommands, props.queryTablesTab));
    const sampleQuerySubscription = this.tableEntityListViewModel2().items.subscribe(() => {
      if (this.tableEntityListViewModel2().items().length > 0 && userContext.apiType === "Tables") {
        // this.queryViewModel().queryBuilderViewModel().setExample();
        console.log(
          "🚀 ~ file: QueryTablesTab.tsx ~ line 55 ~ QueryTablesTab ~ sampleQuerySubscription ~ this.queryViewModel().queryBuilderViewModel().setExample()"
          // this.queryViewModel().queryBuilderViewModel().setExample()
        );
      }
      sampleQuerySubscription.dispose();
    });
    console.log(
      "🚀 ~ file: QueryTablesTab.tsx ~ line 54 ~ QueryTablesTab ~ sampleQuerySubscription ~ this.tableEntityListViewModel().items().length",
      this.tableEntityListViewModel2().items()
    );
    this.tableEntityListViewModel1 = new TableEntityListViewModel(this.tableCommands, props.queryTablesTab);
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
      this.state.queryViewModel.queryBuilderViewModel().andLabel,
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

    useCommandBar.getState().setContextButtons(this.getTabsButtons());
    this.state.tableEntityListViewModel.items.subscribe(() => {
      console.log(
        "🚀 ~ file: QueryTablesTab.tsx ~ line 54 ~ QueryTablesTab ~ sampleQuerySubscription ~ this.tableEntityListViewModel().items().length",
        this.state.tableEntityListViewModel.items()
      );
      if (this.state.tableEntityListViewModel.items().length > 0 && userContext.apiType === "Tables") {
        // this.state.queryViewModel.queryBuilderViewModel.setExample();
        // console.log(
        //   "🚀 ~ file: QueryTablesTab.tsx ~ line 55 ~ QueryTablesTab ~ sampleQuerySubscription ~ this.queryViewModel().queryBuilderViewModel().setExample()",
        //   this.state.queryViewModel.queryBuilderViewModel.setExample()
        // );
      }
    });
    this.props.queryTablesTab.container.tableDataClient.queryDocuments(
      this.props.queryTablesTab.collection,
      "SELECT * FROM c",
      true
    );
    this.buildCommandBarOptions();
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
        />
      );
  };

  public onDeleteEntityClick = (): void => {
    this.tableCommands.deleteEntitiesCommand(this.state.tableEntityListViewModel);
  };

  protected getTabsButtons(): CommandButtonComponentProps[] {
    const buttons: CommandButtonComponentProps[] = [];
    if (this.state.queryBuilderButton.visible) {
      const label = userContext.apiType === "Cassandra" ? "CQL Query Builder" : "Query Builder";
      buttons.push({
        iconSrc: QueryBuilderIcon,
        iconAlt: label,
        onCommandClick: () => this.state.queryViewModel.selectHelper(),
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
        onCommandClick: () => this.state.queryViewModel.selectEditor(),
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
          {this.state.queryViewModel.isEditorActive() && (
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
          {this.state.queryViewModel.isHelperActive() && (
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
                    <tbody></tbody>
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
            <div className="advanced-heading">
              <span
                className="advanced-title"
                role="button"
                // data-bind="click:toggleAdvancedOptions, event: { keydown: ontoggleAdvancedOptionsKeyDown }, attr:{ 'aria-expanded': isExpanded() ? 'true' : 'false' }"
                tabIndex={0}
              >
                <div
                  className="themed-images"
                  //   type="text/html"
                  id="ExpandChevronRight"
                  //   data-bind="hasFocus: focusExpandIcon"
                >
                  <img
                    className="imgiconwidth expand-triangle expand-triangle-right"
                    src={TriangleRight}
                    alt="toggle"
                  />
                </div>
                <div
                  className="themed-images"
                  // type="text/html"
                  id="ExpandChevronDown"
                >
                  <img className="imgiconwidth expand-triangle" src={TriangleDown} alt="toggle" />
                </div>
                <span>Advanced Options</span>
              </span>
            </div>
            <div
              className="advanced-options"
              // data-bind="visible: isExpanded"
            >
              <div className="top">
                <span>Show top results:</span>
                <input
                  className="top-input"
                  type="number"
                  //   data-bind="hasFocus: focusTopResult, textInput: topValue, attr: { title: topValueLimitMessage }"
                  role="textbox"
                  aria-label="Show top results"
                />
                <div
                  role="alert"
                  aria-atomic="true"
                  className="inline-div"
                  // data-bind="visible: isExceedingLimit"
                >
                  <img className="advanced-options-icon" src={StatusWraning} />
                  <span data-bind="text: topValueLimitMessage"></span>
                </div>
              </div>
              <div className="select">
                <span> Select fields for query: </span>
                <div
                // data-bind="visible: isSelected"
                >
                  <img className="advanced-options-icon" src={QueryInformation} />
                  <span
                    className="select-options-text"
                    //   data-bind="text: selectMessage"
                  />
                </div>
                <a
                  className="select-options-link"
                  //   data-bind="click: selectQueryOptions, event: { keydown: onselectQueryOptionsKeyDown }"
                  tabIndex={0}
                  role="link"
                >
                  <span>Choose Columns... </span>
                </a>
              </div>
            </div>
          </div>
        </div>
        {this.state.tableEntityListViewModel.items().map((item, index) => (
          <label key={index}>{item}</label>
        ))}
        <div
          className="tablesQueryTab tableContainer"
          data-bind="with: tableEntityListViewModel, attr: {
                                                  id: tableEntityListViewModel.id
                                              }"
        >
          <table
            id="storageTable"
            className="storage azure-table show-gridlines"
            tabIndex={0}
            data-bind="tableSource: items, tableSelection: selected"
          ></table>
        </div>
      </div>
    );
  }
}

export default QueryTablesTabComponent;
