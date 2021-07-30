import { DetailsList, DetailsListLayoutMode, IColumn, IDropdownOption, SelectionMode } from "@fluentui/react";
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
import { QueryTableEntityClause } from "./QueryTableEntityClause";
import {
  entityTypeOptions,
  fieldOptions,
  IDocument,
  IQueryTableRowsType,
  IQueryTablesTabComponentProps,
  IQueryTablesTabComponentStates,
  opertionOptions,
  opertorOptions,
  timestampOptions,
} from "./QueryTableTabUtils";

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
  public allItems: IDocument[];
  // public columns: IColumn[];
  constructor(props: IQueryTablesTabComponentProps) {
    super(props);
    // this.columns = [];
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
      columns: columns,
      items: [],
      isExpanded: false,
      queryTableRows: [
        {
          isQueryTableEntityChecked: false,
          selectedOperator: "=",
          opertorOptions,
          selectedField: "PartitionKey",
          fieldOptions,
          id: 1,
          entityTypeOptions,
          selectedEntityType: "String",
          opertionOptions,
          selectedOperation: "And",
          entityValue: "",
          isTimeStampSelected: false,
          timestampOptions,
          selectedTimestamp: "Last hour",
        },
      ],
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
    // this.state.tableEntityListViewModel.items.subscribe(() => {
    //   console.log(
    //     "🚀 ~ file: QueryTablesTab.tsx ~ line 54 ~ QueryTablesTab ~ sampleQuerySubscription ~ this.tableEntityListViewModel().items().length",
    //     this.state.tableEntityListViewModel.items()
    //   );
    //   if (this.state.tableEntityListViewModel.items().length > 0 && userContext.apiType === "Tables") {
    //     // this.state.queryViewModel.queryBuilderViewModel.setExample();
    //     // console.log(
    //     //   "🚀 ~ file: QueryTablesTab.tsx ~ line 55 ~ QueryTablesTab ~ sampleQuerySubscription ~ this.queryViewModel().queryBuilderViewModel().setExample()",
    //     //   this.state.queryViewModel.queryBuilderViewModel.setExample()
    //     // );
    //   }
    // });
    // this.test();
    // this.state.tableEntityListViewModel.renderNextPageAndupdateCache();
    // setTimeout(() => {
    //   console.log("items > ", this.state.tableEntityListViewModel.cache.data);
    //   console.log("items > ", this.state.tableEntityListViewModel.items());
    //   console.log("items1 > ", this.state.tableEntityListViewModel.items1);
    //   console.log("items1 > simple > ", this.tableEntityListViewModel1.items1);
    //   this.allItems = this.generateDetailsList();
    //   this.setState({
    //     items: this.allItems,
    //   });
    //   // this.state = {
    //   //   items: this.generateDetailsList()
    //   // }
    // }, 10000);
    //   this.props.queryTablesTab.container.tableDataClient.queryDocuments(
    //     this.props.queryTablesTab.collection,
    //     "SELECT * FROM c",
    //     true
    //   );
    this.buildCommandBarOptions();
  }

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
      // this.state.tableEntityListViewModel.headers.map(header => {

      // })
      this.allItems = this.generateDetailsList();
      this.setState({
        items: this.allItems,
      });
      // this.state = {
      //   items: this.generateDetailsList()
      // }
    }, 10000);
  }

  // public async test(): Promise<void> {
  //   await this.state.tableEntityListViewModel.renderNextPageAndupdateCache().then(() => {
  //     console.log("inside > ", this.state.tableEntityListViewModel.items());
  //   });
  //   console.log("items > ", this.state.tableEntityListViewModel.items());
  // }

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

  public generateDetailsList(): IDocument[] {
    const items: IDocument[] = [];

    this.state.tableEntityListViewModel.items().map((item) => {
      console.log("generateDetailsList > ", item["PartitionKey"]._);
      items.push({
        partitionKey: item["PartitionKey"]._,
        rowKey: item["RowKey"]._,
        timeStamp: item["Timestamp"]._,
      });
    });
    console.log(
      "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 383 ~ QueryTablesTabComponent ~ this.state.tableEntityListViewModel.items ~ items",
      items
    );
    return items;
  }

  toggleAdvancedOptions(): void {
    // console.log("toggleAdvancedOptions!");
    this.setState({
      isExpanded: !this.state.isExpanded,
    });
    this.state.queryViewModel.toggleAdvancedOptions();
  }

  private onQueryTableEntityCheck = (index: number): void => {
    const { queryTableRows } = this.state;
    const cloneQueryTableRows: IQueryTableRowsType[] = [...queryTableRows];
    cloneQueryTableRows[index].isQueryTableEntityChecked = !cloneQueryTableRows[index].isQueryTableEntityChecked;
    this.setState({ queryTableRows: cloneQueryTableRows });
  };

  private onDropdownChange = (selectedOption: IDropdownOption, selectedOptionType: string, index: number): void => {
    const { queryTableRows } = this.state;
    const cloneQueryTableRows: IQueryTableRowsType[] = [...queryTableRows];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    cloneQueryTableRows[index][selectedOptionType] = selectedOption.text;
    const { text } = selectedOption;
    if (text === "DateTime" || text === "Timestamp") {
      cloneQueryTableRows[index].isTimeStampSelected = true;
      cloneQueryTableRows[index].selectedEntityType = "DateTime";
    } else if (selectedOptionType !== "selectedTimestamp") {
      cloneQueryTableRows[index].isTimeStampSelected = false;
    }
    this.setState({ queryTableRows: cloneQueryTableRows });
  };

  onDeleteClause = (indexToRemove: number): void => {
    const { queryTableRows } = this.state;
    const cloneQueryTableRows: IQueryTableRowsType[] = [...queryTableRows];
    cloneQueryTableRows.splice(indexToRemove, 1);
    this.setState({ queryTableRows: cloneQueryTableRows });
  };

  onAddNewClause = (): void => {
    const { queryTableRows } = this.state;
    const cloneQueryTableRows: IQueryTableRowsType[] = [...queryTableRows];
    cloneQueryTableRows.splice(cloneQueryTableRows.length, 0, {
      isQueryTableEntityChecked: false,
      selectedOperator: "=",
      opertorOptions,
      id: cloneQueryTableRows.length + 1,
      selectedField: "PartitionKey",
      fieldOptions,
      entityTypeOptions,
      selectedEntityType: "String",
      opertionOptions,
      selectedOperation: "And",
      entityValue: "",
      isTimeStampSelected: false,
      timestampOptions,
      selectedTimestamp: "Last hour",
    });
    this.setState({ queryTableRows: cloneQueryTableRows });
  };

  private onEntityValueChange = (newInput: string, index: number) => {
    const { queryTableRows } = this.state;
    const cloneQueryTableRows: IQueryTableRowsType[] = [...queryTableRows];
    cloneQueryTableRows[index].entityValue = newInput;
    this.setState({ queryTableRows: cloneQueryTableRows });
  };

  render(): JSX.Element {
    useCommandBar.getState().setContextButtons(this.getTabsButtons());
    const { queryTableRows } = this.state;

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
                          <span className="and-or-label">{this.andLabel}</span>
                        </th>
                        <th className="clause-table-cell header-background field-header">
                          <span className="field-label">{this.fieldLabel}</span>
                        </th>
                        <th className="clause-table-cell header-background type-header">
                          <span className="data-type-label">{this.dataTypeLabel}</span>
                        </th>
                        <th className="clause-table-cell header-background operator-header">
                          <span className="operator-label">{this.operatorLabel}</span>
                        </th>
                        <th className="clause-table-cell header-background value-header">
                          <span className="value-label">{this.valueLabel}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody></tbody>
                  </table>
                </div>
                <>
                  {queryTableRows.map((queryTableRow, index) => (
                    <QueryTableEntityClause
                      key={queryTableRow.id}
                      isQueryTableEntityChecked={queryTableRow.isQueryTableEntityChecked}
                      selectedOperator={queryTableRow.selectedOperator}
                      selectedField={queryTableRow.selectedField}
                      selectedOperation={queryTableRow.selectedOperation}
                      opertationOptions={queryTableRow.opertionOptions}
                      entityValue={queryTableRow.entityValue}
                      selectedEntityType={queryTableRow.selectedEntityType}
                      entityTypeOptions={queryTableRow.entityTypeOptions}
                      fieldOptions={queryTableRow.fieldOptions}
                      selectedTimestamp={queryTableRow.selectedTimestamp}
                      timestampOptions={queryTableRow.timestampOptions}
                      opertorOptions={queryTableRow.opertorOptions}
                      isTimeStampSelected={queryTableRow.isTimeStampSelected}
                      onAddNewClause={this.onAddNewClause}
                      onDeleteClause={() => this.onDeleteClause(index)}
                      onQueryTableEntityCheck={() => this.onQueryTableEntityCheck(index)}
                      onEntityValueChange={(_event, newInput?: string) => this.onEntityValueChange(newInput, index)}
                      onDropdownChange={(selectedOption: IDropdownOption, selectedOptionType: string) =>
                        this.onDropdownChange(selectedOption, selectedOptionType, index)
                      }
                    />
                  ))}
                </>
                <div
                  className="addClause"
                  role="button"
                  onClick={this.onAddNewClause}
                  // onClick={this.state.queryViewModel.queryBuilderViewModel().addNewClause}
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
                  {this.state.queryViewModel.isSelected() && (
                    <div>
                      <img className="advanced-options-icon" src={QueryInformation} />
                      <span className="select-options-text">{this.state.queryViewModel.selectMessage()}</span>
                    </div>
                  )}
                  <a
                    className="select-options-link"
                    //   data-bind="click: selectQueryOptions, event: { keydown: onselectQueryOptionsKeyDown }"
                    tabIndex={0}
                    role="link"
                    onClick={() => this.state.queryViewModel.selectQueryOptions()}
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
            selectionMode={SelectionMode.none}
            layoutMode={DetailsListLayoutMode.justified}
            compact={true}
          />
        </div>
      </div>
    );
  }
}

export default QueryTablesTabComponent;
