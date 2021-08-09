import { FeedOptions } from "@azure/cosmos";
import {
  CheckboxVisibility,
  DetailsList,
  DetailsListLayoutMode,
  IColumn,
  IDropdownOption,
  IDropdownStyles,
  Selection,
  SelectionMode,
  Spinner,
  SpinnerSize,
  Text,
} from "@fluentui/react";
import * as ko from "knockout";
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
import { getQuotedCqlIdentifier } from "../../Tables/CqlUtilities";
import * as DataTableUtilities from "../../Tables/DataTable/DataTableUtilities";
import TableCommands from "../../Tables/DataTable/TableCommands";
import TableEntityListViewModel from "../../Tables/DataTable/TableEntityListViewModel";
import * as Entities from "../../Tables/Entities";
import QueryViewModel from "../../Tables/QueryBuilder/QueryViewModel";
import { CassandraAPIDataClient, TableDataClient } from "../../Tables/TableDataClient";
import * as TableEntityProcessor from "../../Tables/TableEntityProcessor";
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
  public tableEntityListViewModel2 = ko.observable<TableEntityListViewModel>();
  public allItems: IDocument[];
  public columns: IColumn[];
  public selection: Selection;
  public options: IDropdownOption[] = [];
  public dropdownStyles: Partial<IDropdownStyles>;
  public allQueryTableRows: IQueryTableRowsType[];
  constructor(props: IQueryTablesTabComponentProps) {
    super(props);
    this.columns = [];
    this.allQueryTableRows = [];
    this.container = props.collection && props.collection.container;
    this.tableCommands = new TableCommands(this.container);
    this.tableDataClient = this.container.tableDataClient;
    this.tableEntityListViewModel2(new TableEntityListViewModel(this.tableCommands, props.queryTablesTab));
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
      selectedQueryText: "Select * from c",
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
      columns: this.columns,
      items: [],
      originalItems: [],
      isExpanded: false,
      isEditorActive: false,
      selectedItems: [],
      isValue: false,
      isTimestamp: false,
      isCustomLastTimestamp: false,
      isCustomRangeTimestamp: false,
      operators: [],
      selectMessage: "",
      rowSelected: false,
      selection: this.createSelection(),
      entities: [],
      headers: [],
      queryTableRows: [
        {
          isQueryTableEntityChecked: false,
          selectedOperator: "=",
          id: "1",
          selectedField: userContext.apiType === "Cassandra" ? "email" : "PartitionKey",
          selectedOperation: "",
          entityValue: "",
          selectedEntityType: "String",
          isTimeStampSelected: false,
          selectedTimestamp: "Last hour",
          operatorOptions: getformattedOptions(operatorsOptions),
          fieldOptions: getformattedOptions(tableEntityListViewModel.headers),
          entityTypeOptions: getformattedOptions(entityTypeOptions),
          operationOptions: getformattedOptions(operationOptions),
          timestampOptions: getformattedOptions(timestampOptions),
          clauseGroup: queryBuilderViewModel.queryClauses,
          isValue: true,
          isLocal: false,
          isTimestamp: false,
          isCustomRangeTimestamp: false,
          customTimeValue: "",
          timeValue: "",
        },
      ],
      isLoading: true,
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

    this.buildCommandBarOptions();
  }

  componentDidMount(): void {
    this.loadEntities(true);
  }

  public createSelection = (): Selection => {
    return new Selection({
      onSelectionChanged: () => this.onItemsSelectionChanged(false),
      //eslint-disable-next-line
      getKey: (item: any) => item.key,
    });
  };

  public getSelectMessage(selectMessage: string): void {
    this.setState({
      selectMessage: selectMessage,
    });
  }

  private onItemsSelectionChanged = (isFirstItemSelected: boolean): Entities.ITableEntity[] => {
    let itemValue: string;
    const documentKey = userContext.apiType === "Cassandra" ? "userid" : "Timestamp";
    let selectedItems: Entities.ITableEntity[];
    const { selection } = this.state;
    isFirstItemSelected && selection.setIndexSelected(0, true, false);
    if (selection.getSelection().length > 0) {
      Object.keys(this.state.selection.getSelection()[0]).map((key, index) => {
        if (key === documentKey) {
          itemValue = Object.values(this.state.selection.getSelection()[0])[index];
        }
      });
      selectedItems = this.state.entities.filter((item) => item[documentKey]._ === itemValue);
      this.setState({
        selectedItems: selectedItems,
        rowSelected: true,
      });
    }
    return selectedItems;
  };

  public loadFilterExample(): void {
    const { queryTableRows, headers, entities } = this.state;
    const queryTableRowsClone = [...queryTableRows];
    queryTableRowsClone[0].fieldOptions = getformattedOptions(headers);
    this.setState({
      operators: this.state.queryViewModel.queryBuilderViewModel().operators(),
      queryTableRows: queryTableRowsClone,
    });

    if (userContext.apiType !== "Cassandra") {
      this.state.queryViewModel
        .queryBuilderViewModel()
        .setExample(entities.length && entities[0].PartitionKey._, entities.length && entities[0].RowKey._);
    }

    this.state.queryViewModel.queryBuilderViewModel().queryClauses.children.map((clause, index) => {
      this.allQueryTableRows.push({
        id: clause._id,
        isQueryTableEntityChecked: false,
        selectedOperator: clause.operator(),
        selectedField: clause.field(),
        selectedEntityType: clause.type(),
        selectedOperation: index === 0 ? "" : clause.and_or(),
        entityValue: clause.value(),
        isTimeStampSelected: false,
        selectedTimestamp: "Last hour",
        operatorOptions: getformattedOptions(this.state.queryViewModel.queryBuilderViewModel().operators()),
        fieldOptions: getformattedOptions(headers),
        entityTypeOptions: getformattedOptions(this.state.queryViewModel.queryBuilderViewModel().edmTypes()),
        operationOptions: getformattedOptions(this.state.queryViewModel.queryBuilderViewModel().clauseRules()),
        timestampOptions: getformattedOptions(this.state.queryViewModel.queryBuilderViewModel().timeOptions()),
        clauseGroup: clause.clauseGroup,
        isValue: clause.isValue(),
        isLocal: clause.isLocal(),
        isCustomRangeTimestamp: clause.isCustomRangeTimestamp(),
        isTimestamp: clause.isTimestamp(),
        customTimeValue: clause.customTimeValue(),
        timeValue: clause.timeValue(),
      });
    });

    this.setState({
      queryTableRows: this.allQueryTableRows,
    });
  }

  public async loadEntities(isInitialLoad: boolean): Promise<void> {
    const { tableEntityListViewModel, selectedQueryText } = this.state;
    tableEntityListViewModel.renderNextPageAndupdateCache();
    let headers: string[] = [];
    //eslint-disable-next-line
    let documents: any = {};
    if (userContext.apiType === "Cassandra") {
      const query = `SELECT * FROM ${getQuotedCqlIdentifier(
        this.props.queryTablesTab.collection.databaseId
      )}.${getQuotedCqlIdentifier(this.props.queryTablesTab.collection.id())}`;
      documents = await this.props.queryTablesTab.container.tableDataClient.queryDocuments(
        this.props.queryTablesTab.collection,
        query,
        true
      );
      headers = this.getFormattedHeaders(documents.Results);
      this.setupIntialEntities(documents.Results, headers, isInitialLoad);
    } else {
      const { collection } = this.props;
      documents = await this.getDocuments(collection, selectedQueryText);
      headers = this.getFormattedHeaders(documents.Results);
      this.setupIntialEntities(documents.Results, headers, isInitialLoad);
    }
  }

  private setupIntialEntities = (
    entities: Entities.ITableEntity[],
    headers: string[],
    isInitialLoad: boolean
  ): void => {
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
        onColumnClick: this.onColumnClick,
      });
    });

    const documentItems = this.generateDetailsList(entities);

    this.setState(
      {
        columns: this.columns,
        headers,
        operators: this.state.queryViewModel.queryBuilderViewModel().operators(),
        isLoading: false,
        items: documentItems,
        entities: entities,
        originalItems: documentItems,
        queryText: this.state.queryViewModel.queryText(),
      },
      () => {
        if (isInitialLoad) {
          this.loadFilterExample();
          this.onItemsSelectionChanged(true);
        }
      }
    );
  };

  private onColumnClick = (ev: React.MouseEvent<HTMLElement>, column: IColumn): void => {
    const { columns, items } = this.state;
    const newColumns: IColumn[] = columns.slice();
    const currColumn: IColumn = newColumns.filter((currCol) => column.key === currCol.key)[0];
    newColumns.forEach((newCol: IColumn) => {
      if (newCol === currColumn) {
        currColumn.isSortedDescending = !currColumn.isSortedDescending;
        currColumn.isSorted = true;
      } else {
        newCol.isSorted = false;
        newCol.isSortedDescending = true;
      }
    });
    //eslint-disable-next-line
    const newItems = this.copyAndSort(items, currColumn.fieldName!, currColumn.isSortedDescending);
    this.setState({
      columns: newColumns,
      items: newItems,
    });
  };

  private copyAndSort<T>(items: T[], columnKey: string, isSortedDescending?: boolean): T[] {
    const key = columnKey as keyof T;
    return items.slice(0).sort((a: T, b: T) => ((isSortedDescending ? a[key] < b[key] : a[key] > b[key]) ? 1 : -1));
  }

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

  public generateDetailsList(documents: Entities.ITableEntity[]): IDocument[] {
    //eslint-disable-next-line
    const items: any[] = [];
    //eslint-disable-next-line
    let obj: any = undefined;
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

  public reloadEntities(): void {
    this.setState({
      isLoading: true,
    });
    this.loadEntities(false);
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
    if (!this.state.selectedItems) {
      return undefined;
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
            this.setState({
              isLoading: true,
            });
            this.loadEntities(false);
          });
        });
    }
  };

  public runQuery(queryTableRows: IQueryTableRowsType[]): void {
    this.setState({
      isLoading: true,
      selectedQueryText: this.state.queryViewModel.runQuery(queryTableRows),
    });
    setTimeout(() => {
      this.loadEntities(false);
    }, 2000);
    this.setState({
      queryText: this.state.queryViewModel.queryText(),
    });
  }

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
        onCommandClick: () => this.runQuery(this.state.queryTableRows),
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
    if (userContext.apiType !== "Cassandra") {
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
    } else {
      const { text } = selectedOption;
      if (text === "userid") {
        cloneQueryTableRows[index].selectedEntityType = "Int";
      } else {
        cloneQueryTableRows[index].selectedEntityType = "Text";
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
    const { queryTableRows, queryViewModel, headers } = this.state;
    this.state.queryViewModel.queryBuilderViewModel().addNewClause();
    const newClause = this.state.queryViewModel.queryBuilderViewModel().queryClauses.children[
      this.state.queryViewModel.queryBuilderViewModel().queryClauses.children.length - 1
    ];
    const cloneQueryTableRows: IQueryTableRowsType[] = [...queryTableRows];
    cloneQueryTableRows.splice(cloneQueryTableRows.length, 0, {
      isQueryTableEntityChecked: false,
      selectedOperator: "=",
      operatorOptions: getformattedOptions(queryViewModel.queryBuilderViewModel().operators()),
      id: newClause._id,
      selectedField: userContext.apiType === "Cassandra" ? "email" : "PartitionKey",
      fieldOptions: getformattedOptions(headers),
      entityTypeOptions: getformattedOptions(queryViewModel.queryBuilderViewModel().edmTypes()),
      selectedEntityType: userContext.apiType === "Cassandra" ? "Text" : "String",
      operationOptions: getformattedOptions(queryViewModel.queryBuilderViewModel().clauseRules()),
      selectedOperation: "And",
      entityValue: "",
      isTimeStampSelected: false,
      timestampOptions: getformattedOptions(queryViewModel.queryBuilderViewModel().timeOptions()),
      selectedTimestamp: "Last hour",
      clauseGroup: newClause.clauseGroup,
      isValue: newClause.isValue(),
      isLocal: newClause.isLocal(),
      isCustomRangeTimestamp: newClause.isCustomRangeTimestamp(),
      isTimestamp: newClause.isTimestamp(),
      customTimeValue: newClause.customTimeValue(),
      timeValue: newClause.timeValue(),
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
                      index={index}
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
                <div className="addClause" role="button" onClick={this.onAddNewClause} tabIndex={0}>
                  <div className="addClause-heading">
                    <span className="clause-table addClause-title">
                      <img
                        className="addclauseProperty-Img"
                        style={{ marginBottom: "5px" }}
                        src={AddProperty}
                        alt="Add new clause"
                      />
                      <span style={{ marginLeft: "5px" }}>
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
                  <div>
                    <img className="advanced-options-icon" src={QueryInformation} />
                    <span className="select-options-text">{this.state.selectMessage}</span>
                  </div>
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
          {this.state.isLoading && <Spinner size={SpinnerSize.large} className="spinner" />}
          {this.state.items.length > 0 && !this.state.isLoading && (
            <DetailsList
              items={this.state.items}
              columns={this.state.columns}
              selectionMode={SelectionMode.single}
              layoutMode={DetailsListLayoutMode.justified}
              compact={true}
              selection={this.state.selection}
              selectionPreservedOnEmptyClick={true}
              checkboxVisibility={CheckboxVisibility.always}
            />
          )}
          {this.state.items.length === 0 && !this.state.isLoading && (
            <Text variant="mediumPlus">No data available in table</Text>
          )}
        </div>
      </div>
    );
  }
}

export default QueryTablesTabComponent;
