import { FeedOptions } from "@azure/cosmos";
import {
  DetailsList,
  DetailsListLayoutMode,
  IColumn,
  IDropdownOption,
  IDropdownStyles,
  Selection,
  SelectionMode,
} from "@fluentui/react";
import React, { Component } from "react";
import * as _ from "underscore";
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
import { queryDocuments } from "../../../Common/dataAccess/queryDocuments";
import { handleError } from "../../../Common/ErrorHandlingUtils";
import * as HeadersUtility from "../../../Common/HeadersUtility";
import * as ViewModels from "../../../Contracts/ViewModels";
import { useSidePanel } from "../../../hooks/useSidePanel";
import { userContext } from "../../../UserContext";
import { CommandButtonComponentProps } from "../../Controls/CommandButton/CommandButtonComponent";
import Explorer from "../../Explorer";
import { useCommandBar } from "../../Menus/CommandBar/CommandBarComponentAdapter";
import { AddTableEntityPanel } from "../../Panes/Tables/AddTableEntityPanel";
import { EditTableEntityPanel } from "../../Panes/Tables/EditTableEntityPanel";
import * as DataTableUtilities from "../../Tables/DataTable/DataTableUtilities";
import TableCommands from "../../Tables/DataTable/TableCommands";
import TableEntityListViewModel from "../../Tables/DataTable/TableEntityListViewModel";
import * as Entities from "../../Tables/Entities";
import QueryViewModel from "../../Tables/QueryBuilder/QueryViewModel";
import { CassandraAPIDataClient, TableDataClient } from "../../Tables/TableDataClient";
import * as TableEntityProcessor from "../../Tables/TableEntityProcessor";
// import TabsBase from "../TabsBase";
// import NewQueryTablesTab from "./QueryTablesTab";
import { QueryTableEntityClause } from "./QueryTableEntityClause";
import {
  getformattedOptions,
  IDocument,
  IQueryTableRowsType,
  IQueryTablesTabComponentProps,
  IQueryTablesTabComponentStates,
} from "./QueryTableTabUtils";
export interface Button {
  visible: boolean;
  enabled: boolean;
  isSelected?: boolean;
}

class QueryTablesTabComponent extends Component<IQueryTablesTabComponentProps, IQueryTablesTabComponentStates> {
  public collection: ViewModels.Collection;
  public _queryViewModel: QueryViewModel;
  public tableCommands: TableCommands;
  public tableDataClient: TableDataClient;
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
  // public tableEntityListViewModel2 = ko.observable<TableEntityListViewModel>();
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
    // this.tableEntityListViewModel2(new TableEntityListViewModel(this.tableCommands, props.queryTablesTab));

    const tableEntityListViewModel = new TableEntityListViewModel(this.tableCommands, props.queryTablesTab);
    const queryBuilderViewModel = new QueryViewModel(this.props.queryTablesTab).queryBuilderViewModel();

    const entityTypeOptions = queryBuilderViewModel.edmTypes();
    const timestampOptions = queryBuilderViewModel.timeOptions();
    const operatorsOptions = queryBuilderViewModel.operators();
    const operationOptions = queryBuilderViewModel.clauseRules();

    this.state = {
      tableEntityListViewModel,
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
      selectMessage: "",
      entities: [],
      headers: [],
      queryTableRows: [
        {
          isQueryTableEntityChecked: false,
          selectedOperator: "=",
          id: 1,
          selectedField: "PartitionKey",
          selectedOperation: "And",
          entityValue: "",
          selectedEntityType: "String",
          isTimeStampSelected: false,
          selectedTimestamp: "Last hour",
          operatorOptions: getformattedOptions(operatorsOptions),
          fieldOptions: getformattedOptions(tableEntityListViewModel.headers),
          entityTypeOptions: getformattedOptions(entityTypeOptions),
          operationOptions: getformattedOptions(operationOptions),
          timestampOptions: getformattedOptions(timestampOptions),
        },
      ],
    };

    this.state.tableEntityListViewModel.queryTablesTab = this.props.queryTablesTab;
    this.andLabel = this.state.queryViewModel.queryBuilderViewModel().andLabel;
    this.actionLabel = this.state.queryViewModel.queryBuilderViewModel().actionLabel;
    this.fieldLabel = this.state.queryViewModel.queryBuilderViewModel().fieldLabel;
    this.dataTypeLabel = this.state.queryViewModel.queryBuilderViewModel().dataTypeLabel;
    this.operatorLabel = this.state.queryViewModel.queryBuilderViewModel().operatorLabel;
    this.valueLabel = this.state.queryViewModel.queryBuilderViewModel().valueLabel;
    useCommandBar.getState().setContextButtons(this.getTabsButtons());

    this.state.queryViewModel
      .queryBuilderViewModel()
      .operators()
      .map((operator) => {
        this.options.push({
          key: operator,
          text: operator,
        });
      });

    this.dropdownStyles = {
      dropdown: { width: 300 },
    };

    this.selection = new Selection({
      onSelectionChanged: this.onItemsSelectionChanged,
    });

    this.buildCommandBarOptions();
  }

  /****************** Constructor Ends */

  componentDidMount(): void {
    this.loadDocumentsDetails();
  }

  private loadDocumentsDetails = async (): Promise<void> => {
    const { queryTableRows } = this.state;
    const { collection } = this.props;
    const documents = await this.getDocuments(collection, "Select * from c");
    const headers = this.getFormattedHeaders(documents.Results);
    this.columns = [];
    headers.map((header) => {
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
    const documentItems = this.generateDetailsList(documents.Results);
    const queryTableRowsClone = [...queryTableRows];
    queryTableRowsClone[0].fieldOptions = getformattedOptions(headers);
    this.setState({
      columns: this.columns,
      headers,
      operators: this.state.queryViewModel.queryBuilderViewModel().operators(),
      queryTableRows: queryTableRowsClone,
      items: documentItems,
      entities: documents.Results,
    });
  };

  private getFormattedHeaders = (entities: Entities.ITableEntity[]): string[] => {
    const selectedHeadersUnion: string[] = DataTableUtilities.getPropertyIntersectionFromTableEntities(
      entities,
      userContext.apiType === "Cassandra"
    );
    const newHeaders: string[] = _.difference(selectedHeadersUnion, []);
    return newHeaders;
  };

  public async getDocuments(
    collection: ViewModels.CollectionBase,
    query: string
  ): Promise<Entities.IListTableEntitiesResult> {
    try {
      const options = {
        enableCrossPartitionQuery: HeadersUtility.shouldEnableCrossPartitionKey(),
      } as FeedOptions;
      const iterator = queryDocuments(collection.databaseId, collection.id(), query, options);
      const response = await iterator.fetchNext();
      const documents = response?.resources;
      const entities = TableEntityProcessor.convertDocumentsToEntities(documents);

      return {
        Results: entities,
        ContinuationToken: iterator.hasMoreResults(),
        iterator: iterator,
      };
    } catch (error) {
      handleError(error, "TablesAPIDataClient/queryDocuments", "Query documents failed");
      throw error;
    }
  }

  public getSelectMessage(selectMessage: string): void {
    this.setState({
      selectMessage: selectMessage,
    });
  }

  private onItemsSelectionChanged = () => {
    if (this.selection.getSelection().length > 0) {
      const selectedItems = this.state.entities.filter(
        (item) => item["Timestamp"]._ === Object.values(this.selection.getSelection()[0])[2]
      );
      this.setState({
        selectedItems,
      });
    }
  };

  public reloadEntities(): void {
    this.loadDocumentsDetails();
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
        //eslint-disable-next-line
        .then((results: any) => {
          return this.state.tableEntityListViewModel.removeEntitiesFromCache(entitiesToDelete).then(() => {
            // this.state.tableEntityListViewModel.redrawTableThrottled();
            this.loadDocumentsDetails();
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

  public generateDetailsList(documents: Entities.ITableEntity[]): IDocument[] {
    //eslint-disable-next-line
    const items: any[] = [];
    //eslint-disable-next-line
    let obj: any = {};
    documents.map((item) => {
      this.columns.map((col) => {
        if (item[col.name]) {
          obj = { ...obj, ...{ [col.name]: item[col.name]._ } };
        }
      });
      items.push(obj);
    });
    return items;
  }

  public toggleAdvancedOptions(): void {
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
    if (selectedOptionType !== "selectedOperation" && selectedOptionType !== "selectedOperator") {
      cloneQueryTableRows[index].selectedEntityType = "String";
      const { text } = selectedOption;
      if (text === "DateTime" || text === "Timestamp") {
        cloneQueryTableRows[index].isTimeStampSelected = true;
        cloneQueryTableRows[index].selectedEntityType = "DateTime";
      } else if (selectedOptionType !== "selectedTimestamp") {
        cloneQueryTableRows[index].isTimeStampSelected = false;
      }
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
      operatorOptions: queryTableRows[0].operatorOptions,
      id: cloneQueryTableRows.length + 1,
      selectedField: "PartitionKey",
      fieldOptions: queryTableRows[0].fieldOptions,
      entityTypeOptions: queryTableRows[0].entityTypeOptions,
      selectedEntityType: "String",
      operationOptions: queryTableRows[0].operationOptions,
      selectedOperation: "And",
      entityValue: "",
      isTimeStampSelected: false,
      timestampOptions: queryTableRows[0].timestampOptions,
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
                      operationOptions={queryTableRow.operationOptions}
                      entityValue={queryTableRow.entityValue}
                      selectedEntityType={queryTableRow.selectedEntityType}
                      entityTypeOptions={queryTableRow.entityTypeOptions}
                      fieldOptions={queryTableRow.fieldOptions}
                      selectedTimestamp={queryTableRow.selectedTimestamp}
                      timestampOptions={queryTableRow.timestampOptions}
                      operatorOptions={queryTableRow.operatorOptions}
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
                      this.state.queryViewModel.selectQueryOptions(this.state.headers, (selectMessage: string) =>
                        this.getSelectMessage(selectMessage)
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
