import { FeedOptions } from "@azure/cosmos";
import {
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

// export interface IDocument {
//   partitionKey: string;
//   rowKey: string;
//   timeStamp: string;
// }
// export interface IQueryTablesTabComponentProps {
//   tabKind: ViewModels.CollectionTabKind;
//   title: string;
//   tabPath: string;
//   collection: ViewModels.CollectionBase;
//   node: ViewModels.TreeNode;
//   onLoadStartKey: number;
//   container: Explorer;
//   tabsBaseInstance: TabsBase;
//   queryTablesTab: NewQueryTablesTab;
// }

// interface IQueryTablesTabComponentStates {
//   tableEntityListViewModel: TableEntityListViewModel;
//   queryViewModel: QueryViewModel;
//   queryText: string;
//   selectedQueryText: string;
//   executeQueryButton: Button;
//   queryBuilderButton: Button;
//   queryTextButton: Button;
//   addEntityButton: Button;
//   editEntityButton: Button;
//   deleteEntityButton: Button;
//   isHelperActive: boolean;
//   columns: IColumn[];
//   items: IDocument[];
//   isExpanded: boolean;
//   isEditorActive: boolean;
//   selectedItems: Entities.ITableEntity[];
//   isValue: boolean;
//   isTimestamp: boolean;
//   isCustomLastTimestamp: boolean;
//   isCustomRangeTimestamp: boolean;
//   operators: string[];
//   selectMessage: string;
//   queryTableRows: IQueryTableRowsType[];
// }

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
    // console.log(
    //   "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 24 ~ QueryTablesTabComponent ~ constructor ~ props",
    //   props
    // );
    // console.log(
    //   "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 85 ~ QueryTablesTabComponent ~ constructor ~ this.state",
    //   this.state,
    //   ", ",
    //   this.state.queryViewModel.queryBuilderViewModel(),
    //   ", ",
    //   this.state.queryViewModel.queryBuilderViewModel().clauseArray(),
    //   ", ",
    //   this.state.tableEntityListViewModel.items(),
    //   ", tableEntityList > ",
    //   this.state.tableEntityListViewModel
    // );
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

    // this.selection = new Selection({
    //   onSelectionChanged: this.onItemsSelectionChanged,
    // });

    this.buildCommandBarOptions();
  }

  /****************** Constructor Ends */

  componentDidMount(): void {
    this.loadEntities(true);

    // setTimeout(() => {
    //   this.loadFilterExample();
    // }, 1000);
  }

  public createSelection = (): Selection => {
    return new Selection({
      onSelectionChanged: () => this.onItemsSelectionChanged(),
      // onSelectionChanged: () => {
      //   this.setState({ selectedItems: this.onItemsSelectionChanged() });
      // },
      getKey: (item: any) => item.key,
    });
  };

  public setDefaultItemSelection(): void {
    // this.setState({
    //   selectedItems: this.state.entities[0]
    // })
    console.log(
      "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 328 ~ QueryTablesTabComponent ~ setDefaultItemSelection ~ selectedItems",
      this.state.selectedItems,
      ", ",
      this.state.entities[0]
    );
    // const newSelection = this.createSelection();
    // const items: any = this.state.items;

    // newSelection.setItems(items);
    // for (let i = 1; i <= 3; i++) {
    //   newSelection.setKeySelected(`${i}`, true, false);
    //   console.log(" yooo > ", newSelection.setKeySelected(`${i}`, true, false));
    // }
    // this.setState({
    //   selection: newSelection,
    //   // selectedItems: this.onItemsSelectionChanged(),
    // });
    // console.log(
    //   "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 342 ~ QueryTablesTabComponent ~ setDefaultItemSelection ~ selection",
    //   this.state.selection,
    //   ", ",
    //   this.state.selectedItems
    // );
  }

  //NOT USED. Backup only
  public originalDidMount(): void {
    // const { tableEntityListViewModel, queryTableRows } = this.state;
    // // tableEntityListViewModel.renderNextPageAndupdateCache();
    // setTimeout(() => {
    //   //   console.log(
    //   //     "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 296 ~ QueryTablesTabComponent ~ componentDidMount ~ componentDidMount",
    //   //     this.state.tableEntityListViewModel.items()
    //   //   );
    //   //   // console.log("items > ", this.state.tableEntityListViewModel.cache.data);
    //   //   // console.log("items > ", this.state.tableEntityListViewModel.items());
    //   //   // console.log("items1 > ", this.state.tableEntityListViewModel.headers);
    //   //   this.columns = [];
    //   //   tableEntityListViewModel.headers.map((header) => {
    //   //     this.columns.push({
    //   //       key: header,
    //   //       name: header,
    //   //       minWidth: 100,
    //   //       maxWidth: 200,
    //   //       data: "string",
    //   //       fieldName: header,
    //   //       isResizable: true,
    //   //       isSorted: true,
    //   //       isSortedDescending: false,
    //   //       sortAscendingAriaLabel: "Sorted A to Z",
    //   //       sortDescendingAriaLabel: "Sorted Z to A",
    //   //     });
    //   //   });
    //   const queryTableRowsClone = [...queryTableRows];
    //   queryTableRowsClone[0].fieldOptions = getformattedOptions(tableEntityListViewModel.headers);
    //   this.setState({
    //     // columns: this.columns,
    //     operators: this.state.queryViewModel.queryBuilderViewModel().operators(),
    //     queryTableRows: queryTableRowsClone,
    //     // isValue:
    //   });
    //   //   this.allItems = this.generateDetailsList();
    //   this.state.queryViewModel
    //     .queryBuilderViewModel()
    //     .setExample(
    //       this.state.tableEntityListViewModel.items()[0].PartitionKey._,
    //       this.state.tableEntityListViewModel.items()[0].RowKey._
    //     );
    //   this.state.queryViewModel.queryBuilderViewModel().queryClauses.children.map((clause) => {
    //     // clause._id
    //     this.allQueryTableRows.push({
    //       id: clause._id,
    //       isQueryTableEntityChecked: false,
    //       selectedOperator: clause.operator(),
    //       selectedField: clause.field(),
    //       selectedEntityType: clause.type(),
    //       selectedOperation: clause.and_or(),
    //       entityValue: clause.value(),
    //       isTimeStampSelected: false,
    //       selectedTimestamp: "Last hour",
    //       operatorOptions: getformattedOptions(this.state.queryViewModel.queryBuilderViewModel().operators()),
    //       fieldOptions: getformattedOptions(tableEntityListViewModel.headers),
    //       entityTypeOptions: getformattedOptions(this.state.queryViewModel.queryBuilderViewModel().edmTypes()),
    //       operationOptions: getformattedOptions(this.state.queryViewModel.queryBuilderViewModel().clauseRules()),
    //       timestampOptions: getformattedOptions(this.state.queryViewModel.queryBuilderViewModel().timeOptions()),
    //       clauseGroup: clause.clauseGroup,
    //       isValue: clause.isValue(),
    //       isLocal: clause.isLocal(),
    //       isCustomRangeTimestamp: clause.isCustomRangeTimestamp(),
    //       isTimestamp: clause.isTimestamp(),
    //       customTimeValue: clause.customTimeValue(),
    //       timeValue: clause.timeValue(),
    //     });
    //     console.log(
    //       "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 336 ~ QueryTablesTabComponent ~ this.state.queryViewModel.queryBuilderViewModel ~ clause._id",
    //       clause,
    //       ", ",
    //       clause._id
    //     );
    //   });
    //   console.log(
    //     "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 319 ~ QueryTablesTabComponent ~ this.state.queryViewModel.queryBuilderViewModel ~ this.allQueryTableRows",
    //     this.allQueryTableRows
    //   );
    //   this.setState({
    //     // items: this.allItems,
    //     // originalItems: this.allItems,
    //     queryTableRows: this.allQueryTableRows,
    //     // queryText: this.state.queryViewModel.queryText(),
    //   });
    // }, 7000);
  }
  // public async test(): Promise<void> {
  //   await this.state.tableEntityListViewModel.renderNextPageAndupdateCache().then(() => {
  //     console.log("inside > ", this.state.tableEntityListViewModel.items());
  //   });
  //   console.log("items > ", this.state.tableEntityListViewModel.items());
  // }

  public getSelectMessage(selectMessage: string): void {
    // console.log(
    //   "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 332 ~ QueryTablesTabComponent ~ getSelectMessage ~ selectMessage",
    //   selectMessage
    // );
    this.setState({
      selectMessage: selectMessage,
    });
  }

  private onItemsSelectionChanged = (): Entities.ITableEntity[] => {
    console.log(
      "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 338 ~ QueryTablesTabComponent ~ this.selection.getSelection().length",
      this.state.selection.getSelection().length,
      ", ",
      this.state.selection.getSelection()
    );
    let itemValue: string;
    const documentKey = userContext.apiType === "Cassandra" ? "userid" : "Timestamp";
    let selectedItems: Entities.ITableEntity[];
    if (this.state.selection.getSelection().length > 0) {
      Object.keys(this.state.selection.getSelection()[0]).map((key, index) => {
        if (key === documentKey) {
          itemValue = Object.values(this.state.selection.getSelection()[0])[index];
          console.log(
            "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 445 ~ QueryTablesTabComponent ~ timeStamp",
            itemValue
          );
        }
      });
      selectedItems = this.state.entities.filter((item) => item[documentKey]._ === itemValue);
      console.log(
        "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 293 ~ QueryTablesTabComponent ~ selectedItems",
        selectedItems
      );
      this.setState({
        selectedItems: selectedItems,
        rowSelected: true,
      });
    }
    return selectedItems;
  };

  public loadFilterExample(): void {
    const { queryTableRows, headers, entities } = this.state;
    console.log(
      "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 480 ~ QueryTablesTabComponent ~ loadFilterExample ~ this.state",
      this.state.headers,
      "Enitities > ",
      this.state.entities,
      ", operation > ",
      this.state.queryViewModel.queryBuilderViewModel().operators()
    );
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
      console.log(
        "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 336 ~ QueryTablesTabComponent ~ this.state.queryViewModel.queryBuilderViewModel ~ clause._id",
        clause,
        ", ",
        clause._id
      );
    });
    console.log(
      "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 319 ~ QueryTablesTabComponent ~ this.state.queryViewModel.queryBuilderViewModel ~ this.allQueryTableRows",
      this.allQueryTableRows
    );
    this.setState({
      queryTableRows: this.allQueryTableRows,
    });
  }

  public async loadEntities(isInitialLoad: boolean): Promise<void> {
    const { tableEntityListViewModel } = this.state;
    tableEntityListViewModel.renderNextPageAndupdateCache();
    let headers: string[] = [];
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
      documents = await this.getDocuments(collection, "Select * from c");
      headers = this.getFormattedHeaders(documents.Results);
      this.setupIntialEntities(documents.Results, headers, isInitialLoad);
    }

    // this.columns = [];
    // headers.map((header) => {
    //   this.columns.push({
    //     key: header,
    //     name: header,
    //     minWidth: 100,
    //     maxWidth: 200,
    //     data: "string",
    //     fieldName: header,
    //     isResizable: true,
    //     isSorted: true,
    //     isSortedDescending: false,
    //     sortAscendingAriaLabel: "Sorted A to Z",
    //     sortDescendingAriaLabel: "Sorted Z to A",
    //   });
    // });

    // const documentItems = this.generateDetailsList(documents.Results);
    // // const queryTableRowsClone = [...queryTableRows];
    // // queryTableRowsClone[0].fieldOptions = getformattedOptions(headers);
    // this.setState(
    //   {
    //     columns: this.columns,
    //     headers,
    //     operators: this.state.queryViewModel.queryBuilderViewModel().operators(),
    //     isLoading: false,
    //     items: documentItems,
    //     entities: documents.Results,
    //     originalItems: documentItems,
    //     queryText: this.state.queryViewModel.queryText(),
    //   },
    //   () => {
    //     if (isInitialLoad) {
    //       this.loadFilterExample();
    //       // this.setDefaultItemSelection();
    //     }
    //   }
    // );

    //If
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
      });
    });

    const documentItems = this.generateDetailsList(entities);
    // const queryTableRowsClone = [...queryTableRows];
    // queryTableRowsClone[0].fieldOptions = getformattedOptions(headers);
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
          // this.setDefaultItemSelection();
        }
      }
    );
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

  public generateDetailsList(documents: Entities.ITableEntity[]): IDocument[] {
    // const items: IDocument[] = [];
    //eslint-disable-next-line
    const items: any[] = [];
    //eslint-disable-next-line
    let obj: any = undefined;
    // const newColumns = [];
    // const compare = ["PartitionKey", "RowKey", "Timestamp", "_rid", "_self", "_etag", "_attachments"];

    console.log(
      "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 582 ~ QueryTablesTabComponent ~ this.state.tableEntityListViewModel.items ~ this.state.tableEntityListViewModel.items()",
      documents
    );
    documents.map((item) => {
      // console.log("generateDetailsList > ", item["PartitionKey"]._);
      this.columns.map((col) => {
        // console.log(
        //   "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 403 ~ QueryTablesTabComponent ~ this.columns.map ~ col.name",
        //   col.name
        // );
        if (item[col.name]) {
          // console.log("Data > ", item[col.name]._);
          obj = { ...obj, ...{ [col.name]: item[col.name]._ } };
        }
      });
      items.push(obj);
    });
    console.log(
      "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 814 ~ QueryTablesTabComponent ~ generateDetailsList ~ items",
      items
    );
    // this.state.queryViewModel
    //   .queryBuilderViewModel()
    //   .setExample(
    //     this.state.tableEntityListViewModel.items()[0].PartitionKey._,
    //     this.state.tableEntityListViewModel.items()[0].RowKey._
    //   );

    // console.log(
    //   "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 383 ~ QueryTablesTabComponent ~ this.state.tableEntityListViewModel.items ~ items",
    //   this.state.queryViewModel.queryBuilderViewModel().queryClauses.children
    // );
    return items;
  }

  public reloadEntities(): void {
    console.log(
      "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 423 ~ QueryTablesTabComponent ~ reloadEntities ~ reloadEntities"
    );
    // this.componentDidMount();
    this.loadEntities(false);
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
        //eslint-disable-next-line
        .then((results: any) => {
          return this.state.tableEntityListViewModel.removeEntitiesFromCache(entitiesToDelete).then(() => {
            // this.state.tableEntityListViewModel.redrawTableThrottled();
            this.componentDidMount();
          });
        });
    }
  };

  public runQuery(queryTableRows: IQueryTableRowsType[]): void {
    this.state.queryViewModel.runQuery(queryTableRows);
    if (queryTableRows.length !== 0) {
      console.log(
        "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 507 ~ QueryTablesTabComponent ~ runQuery ~ queryTableRows",
        queryTableRows
      );
      let exp: string;
      queryTableRows.map((row, index) => {
        console.log(
          "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 508 ~ QueryTablesTabComponent ~ runQuery ~ row",
          row
        );
        const operation = row.selectedOperation === "And" ? " && " : " || ";
        const operator = this.getOperator(row.selectedOperator);
        if (index === 0) {
          exp = "row['" + row.selectedField + "'] " + operator + "'" + row.entityValue + "'";
        } else {
          exp = exp + operation + "row['" + row.selectedField + "'] " + operator + "'" + row.entityValue + "'";
        }
      });
      console.log(
        "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 519 ~ QueryTablesTabComponent ~ queryTableRows.map ~ exp",
        exp
      );
      const filteredItems = this.state.originalItems.filter((row) => eval(exp));
      console.log(
        "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 526 ~ QueryTablesTabComponent ~ runQuery ~ newRows",
        filteredItems
      );
      this.setState({
        queryText: this.state.queryViewModel.queryText(),
        items: filteredItems,
      });
    } else {
      this.setState({
        queryText: this.state.queryViewModel.queryText(),
        items: this.state.originalItems,
      });
    }
  }

  public getOperator(operator: string): string {
    let result = "";
    switch (operator) {
      case "=":
        result = " === ";
        break;
      case ">":
        result = " > ";
        break;
      case "<":
        result = " < ";
        break;
      case ">=":
        result = " >= ";
        break;
      case "<=":
        result = " <= ";
        break;
      default:
        result = " === ";
    }
    return result;
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

  //NOT USED. Backup only
  public originalGenerateDetailsList(): IDocument[] {
    // // const items: IDocument[] = [];
    // //eslint-disable-next-line
    // const items: any[] = [];
    // //eslint-disable-next-line
    // let obj: any = undefined;
    // // const newColumns = [];
    // // const compare = ["PartitionKey", "RowKey", "Timestamp", "_rid", "_self", "_etag", "_attachments"];
    // console.log(
    //   "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 582 ~ QueryTablesTabComponent ~ this.state.tableEntityListViewModel.items ~ this.state.tableEntityListViewModel.items()",
    //   this.state.tableEntityListViewModel.items()
    // );
    // this.state.tableEntityListViewModel.items().map((item) => {
    //   // console.log("generateDetailsList > ", item["PartitionKey"]._);
    //   this.columns.map((col) => {
    //     console.log(
    //       "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 403 ~ QueryTablesTabComponent ~ this.columns.map ~ col.name",
    //       col.name
    //     );
    //     if (item[col.name]) {
    //       // console.log("Data > ", item[col.name]._);
    //       obj = { ...obj, ...{ [col.name]: item[col.name]._ } };
    //     }
    //   });
    //   items.push(obj);
    // });
    // console.log(
    //   "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 814 ~ QueryTablesTabComponent ~ generateDetailsList ~ items",
    //   items
    // );
    // this.state.queryViewModel
    //   .queryBuilderViewModel()
    //   .setExample(
    //     this.state.tableEntityListViewModel.items()[0].PartitionKey._,
    //     this.state.tableEntityListViewModel.items()[0].RowKey._
    //   );
    // // console.log(
    // //   "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 383 ~ QueryTablesTabComponent ~ this.state.tableEntityListViewModel.items ~ items",
    // //   this.state.queryViewModel.queryBuilderViewModel().queryClauses.children
    // // );
    // return items;
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
    console.log(
      "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 696 ~ QueryTablesTabComponent ~ this.state ~ onAddNewClause",
      this.state.queryViewModel.queryBuilderViewModel().queryClauses.children[
        this.state.queryViewModel.queryBuilderViewModel().queryClauses.children.length - 1
      ],
      ", ",
      this.state.queryViewModel.queryBuilderViewModel().queryClauses.children,
      ", ",
      this.state.queryViewModel.queryBuilderViewModel().queryClauses.children.length
    );
    const newClause = this.state.queryViewModel.queryBuilderViewModel().queryClauses.children[
      this.state.queryViewModel.queryBuilderViewModel().queryClauses.children.length - 1
    ];
    const cloneQueryTableRows: IQueryTableRowsType[] = [...queryTableRows];
    cloneQueryTableRows.splice(cloneQueryTableRows.length, 0, {
      isQueryTableEntityChecked: false,
      selectedOperator: "=",
      operatorOptions: getformattedOptions(queryViewModel.queryBuilderViewModel().operators()),
      // id: cloneQueryTableRows.length + 1,
      id: newClause._id,
      selectedField: userContext.apiType === "Cassandra" ? "email" : "PartitionKey",
      fieldOptions: getformattedOptions(headers),

      entityTypeOptions: getformattedOptions(queryViewModel.queryBuilderViewModel().edmTypes()),

      selectedEntityType: userContext.apiType === "Cassandra" ? "Text" : "String",
      operationOptions: getformattedOptions(queryViewModel.queryBuilderViewModel().clauseRules()),
      // operationOptions: queryTableRows[0].operationOptions,
      selectedOperation: "And",
      entityValue: "",
      isTimeStampSelected: false,
      timestampOptions: getformattedOptions(queryViewModel.queryBuilderViewModel().timeOptions()),
      // timestampOptions: queryTableRows[0].timestampOptions,
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
    // console.log(
    //   "🚀 ~ file: QueryTablesTabComponent.tsx ~ line 328 ~ QueryTablesTabComponent ~ setDefaultItemSelection ~ selectedItems",
    //   this.state.selectedItems,
    //   ", ",
    //   [this.state.items[0]]
    // );
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
          {this.state.items.length === 0 && this.state.isLoading && (
            <Spinner size={SpinnerSize.large} className="spinner" />
          )}
          {this.state.items.length > 0 && !this.state.isLoading && (
            <DetailsList
              items={this.state.items}
              columns={this.state.columns}
              selectionMode={SelectionMode.single}
              layoutMode={DetailsListLayoutMode.justified}
              compact={true}
              selection={this.state.selection}
              selectionPreservedOnEmptyClick={true}
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
