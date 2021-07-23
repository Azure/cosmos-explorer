import React from "react";
import AddEntityIcon from "../../../../images/AddEntity.svg";
import DeleteEntitiesIcon from "../../../../images/DeleteEntities.svg";
import EditEntityIcon from "../../../../images/Edit-entity.svg";
import ExecuteQueryIcon from "../../../../images/ExecuteQuery.svg";
import QueryBuilderIcon from "../../../../images/Query-Builder.svg";
import QueryTextIcon from "../../../../images/Query-Text.svg";
import * as ViewModels from "../../../Contracts/ViewModels";
import { useSidePanel } from "../../../hooks/useSidePanel";
import { userContext } from "../../../UserContext";
import { CommandButtonComponentProps } from "../../Controls/CommandButton/CommandButtonComponent";
import Explorer from "../../Explorer";
import { AddTableEntityPanel } from "../../Panes/Tables/AddTableEntityPanel";
import { EditTableEntityPanel } from "../../Panes/Tables/EditTableEntityPanel";
import TableCommands from "../../Tables/DataTable/TableCommands";
import TableEntityListViewModel from "../../Tables/DataTable/TableEntityListViewModel";
import QueryViewModel from "../../Tables/QueryBuilder/QueryViewModel";
import { CassandraAPIDataClient, TableDataClient } from "../../Tables/TableDataClient";
import TabsBase from "../TabsBase";
import { NewQueryTablesTab } from "./NewQueryTablesTab";

export interface IQueryTablesTabAccessor {
  onTabClickEvent: () => void;
}

export interface Button {
  visible: boolean;
  enabled: boolean;
  isSelected?: boolean;
}

export interface IQueryTablesTabComponentStates {
  queryViewModel: QueryViewModel;
  queryText: string;
  selectedQueryText: string;
  executeQueryButton: Button;
  queryBuilderButton: Button;
  queryTextButton: Button;
  addEntityButton: Button;
  editEntityButton: Button;
  deleteEntityButton: Button;
}

export interface IQueryTablesTabComponentProps {
  collection: ViewModels.CollectionBase;
  tabsBaseInstance: TabsBase;
  tabId: string;
  queryTablesTab: NewQueryTablesTab;
  container: Explorer;
  onQueryTablesTabAccessor: (instance: IQueryTablesTabAccessor) => void;
}

export class QueryTablesTabComponent extends React.Component<
  IQueryTablesTabComponentProps,
  IQueryTablesTabComponentStates
> {
  public collection: ViewModels.Collection;
  public tableEntityListViewModel: TableEntityListViewModel;
  public tableCommands: TableCommands;
  public tableDataClient: TableDataClient;
  public container: Explorer;
  public queryViewModel: QueryViewModel;

  constructor(props: IQueryTablesTabComponentProps) {
    super(props);
    this.container = props.collection && props.collection.container;
    this.tableCommands = new TableCommands(this.container);
    this.tableDataClient = this.container.tableDataClient;
    this.tableEntityListViewModel = new TableEntityListViewModel(this.tableCommands, props.queryTablesTab);
    this.tableEntityListViewModel.queryTablesTab = props.queryTablesTab;
    this.queryViewModel = new QueryViewModel(props.queryTablesTab);
    this.state = {
      queryViewModel: this.queryViewModel,
      queryText: "PartitionKey eq 'partitionKey1'",
      selectedQueryText: "",
      executeQueryButton: {
        enabled: true,
        visible: true,
      },
      queryBuilderButton: {
        enabled: true,
        visible: true,
        isSelected: this.queryViewModel ? this.queryViewModel.isHelperActive() : false,
      },
      queryTextButton: {
        enabled: true,
        visible: true,
        isSelected: this.queryViewModel ? this.queryViewModel.isEditorActive() : false,
      },
      addEntityButton: {
        enabled: true,
        visible: true,
      },
      editEntityButton: {
        enabled: this.tableCommands.isEnabled(
          TableCommands.editEntityCommand,
          this.tableEntityListViewModel.selected()
        ),
        visible: true,
      },
      deleteEntityButton: {
        enabled: this.tableCommands.isEnabled(
          TableCommands.deleteEntitiesCommand,
          this.tableEntityListViewModel.selected()
        ),
        visible: true,
      },
    };
    if (this.tableEntityListViewModel.items().length > 0 && userContext.apiType === "Tables") {
      const sampleQuerySubscription = this.state.queryViewModel.queryBuilderViewModel().setExample();
    }
  }
  public onExecuteQueryClick(): void {
    this.state.queryViewModel.runQuery();
  }

  public onQueryBuilderClick(): void {
    this.state.queryViewModel.selectHelper();
  }

  public onQueryTextClick(): void {
    this.state.queryViewModel.selectEditor();
  }

  public onAddEntityClick(): void {
    useSidePanel
      .getState()
      .openSidePanel(
        "Add Table Row",
        <AddTableEntityPanel
          tableDataClient={this.tableDataClient}
          queryTablesTab={this.props.queryTablesTab}
          tableEntityListViewModel={this.tableEntityListViewModel}
          cassandraApiClient={new CassandraAPIDataClient()}
        />,
        "700px"
      );
  }

  public onEditEntityClick(): void {
    useSidePanel
      .getState()
      .openSidePanel(
        "Edit Table Entity",
        <EditTableEntityPanel
          tableDataClient={this.tableDataClient}
          queryTablesTab={this.props.queryTablesTab}
          tableEntityListViewModel={this.tableEntityListViewModel}
          cassandraApiClient={new CassandraAPIDataClient()}
        />
      );
  }

  public onDeleteEntityClick(): void {
    this.tableCommands.deleteEntitiesCommand(this.tableEntityListViewModel);
  }

  public onActivate(): void {
    const columns =
      !!this.tableEntityListViewModel &&
      !!this.tableEntityListViewModel.table &&
      this.tableEntityListViewModel.table.columns;
    if (!!columns) {
      columns.adjust();
      $(window).resize();
    }
  }

  public getTabsButtons(): CommandButtonComponentProps[] {
    const buttons: CommandButtonComponentProps[] = [];
    if (this.state.queryBuilderButton.visible) {
      const label = userContext.apiType === "Cassandra" ? "CQL Query Builder" : "Query Builder";
      buttons.push({
        iconSrc: QueryBuilderIcon,
        iconAlt: label,
        onCommandClick: this.onQueryBuilderClick,
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
        onCommandClick: this.onQueryTextClick,
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
        onCommandClick: this.onExecuteQueryClick,
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

  public render(): JSX.Element {
    const { tabId } = this.props;
    const { queryViewModel, queryText } = this.state;
    const {
      isEditorActive,
      isHelperActive,
      hasQueryError,
      queryErrorMessage,
      queryBuilderViewModel,
      toggleAdvancedOptions,
      ontoggleAdvancedOptionsKeyDown,
    } = queryViewModel;
    const {
      canGroupClauses,
      andLabel,
      actionLabel,
      groupClauses,
      groupSelectedClauses,
      fieldLabel,
      dataTypeLabel,
      operatorLabel,
      valueLabel,
      clauseArray,
      columnOptions,
      clauseRules,
      operators,
      insertNewFilterLine,
      onAddClauseKeyDown,
      addClauseIndex,
      removeThisFilterLine,
      onDeleteClauseKeyDown,
      deleteClause,
      getClauseGroupViewModels,
      updateColumnOptions,
      edmTypes,
      addNewClause,
      addNewClauseLine,
    } = queryBuilderViewModel();
    console.log("queryBuilderViewModel()", queryBuilderViewModel());
    console.log("clauseArray()", clauseArray());
    console.log("clauseRules()", clauseRules());
    console.log("columnOptions()", columnOptions());
    console.log("operators()", operators());
    return (
      <div className="tab-pane tableContainer" id={tabId} role="tabpanel">
        <div className="query-builder" id={queryViewModel.id}>
          <div className="error-bar">
            {hasQueryError && (
              <div className="error-message" aria-label="Error Message">
                <span>
                  <img className="entity-error-Img" src="/error_red.svg" />
                </span>
                <span className="error-text" role="alert">
                  {queryErrorMessage}
                </span>
              </div>
            )}
          </div>

          {isEditorActive() && (
            <div className="query-editor-panel">
              <div>
                <textarea
                  className="query-editor-text"
                  data-bind="
                          css: { 'query-editor-text-invalid': hasQueryError },
                          readOnly: true"
                  name="query-editor"
                  rows={5}
                  cols={100}
                >
                  {queryText}
                </textarea>
              </div>
            </div>
          )}
          {isHelperActive && (
            <div style={{ paddingLeft: "13px" }}>
              <div className="clause-table" data-bind="with: queryBuilderViewModel ">
                <div className="scroll-box scrollable" id="scroll">
                  <table className="clause-table">
                    <thead>
                      <tr className="clause-table-row">
                        <th className="clause-table-cell header-background action-header">
                          <span>{actionLabel}</span>
                        </th>
                        <th className="clause-table-cell header-background group-control-header">
                          {canGroupClauses && (
                            <button type="button" onClick={groupClauses} title={groupSelectedClauses}>
                              <img className="and-or-svg" src="/And-Or.svg" alt="Group selected clauses" />
                            </button>
                          )}
                        </th>
                        <th className="clause-table-cell header-background"></th>
                        <th className="clause-table-cell header-background and-or-header">
                          <span>{andLabel}</span>
                        </th>
                        <th className="clause-table-cell header-background field-header">
                          <span>{fieldLabel}</span>
                        </th>
                        <th className="clause-table-cell header-background type-header">
                          <span>{dataTypeLabel}</span>
                        </th>
                        <th className="clause-table-cell header-background operator-header">
                          <span>{operatorLabel}</span>
                        </th>
                        <th className="clause-table-cell header-background value-header">
                          <span>{valueLabel}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {clauseArray().map((data, index) => (
                        <tr className="clause-table-row">
                          <td className="clause-table-cell action-column">
                            <span
                              className="entity-Add-Cancel"
                              role="button"
                              tabIndex={0}
                              onClick={addClauseIndex.bind(data, index)}
                              onKeyDown={onAddClauseKeyDown.bind(data, index)}
                              title={insertNewFilterLine}
                            >
                              <img className="querybuilder-addpropertyImg" src="/Add-property.svg" alt="Add clause" />
                            </span>
                            <span
                              className="entity-Add-Cancel"
                              role="button"
                              tabIndex={0}
                              data-bind="hasFocus: isDeleteButtonFocused"
                              onClick={deleteClause.bind(data, index)}
                              onKeyDown={onDeleteClauseKeyDown.bind(data, index)}
                              title={removeThisFilterLine}
                            >
                              <img className="querybuilder-cancelImg" src="/Entity_cancel.svg" alt="Delete clause" />
                            </span>
                          </td>
                          {/* <td className="clause-table-cell group-control-column">
                            <input type="checkbox" aria-label="And/Or" checked={checkedForGrouping} />
                          </td> */}
                          {/* <td>
                            <table className="group-indicator-table">
                              <tbody>
                                <tr>
                                  {getClauseGroupViewModels(data).map((gi, index) => (
                                    <td
                                      className="group-indicator-column"
                                      style={{
                                        backgroundColor: gi.backgroundColor,
                                        borderTop: gi.showTopBorder.peek() ? "solid thin #CCCCCC" : "none",
                                        borderLeft: gi.showLeftBorder.peek() ? "solid thin #CCCCCC" : "none",
                                        borderBottom: gi.showBottomBorder.peek()
                                          ? "solid thin #CCCCCC"
                                          : gi.borderBackgroundColor,
                                      }}
                                    >
                                      {gi.canUngroup && (
                                        <button type="button" onClick={} title={ungroupClausesLabel}>
                                          <img src="/QueryBuilder/UngroupClause_16x.png" alt="Ungroup clauses" />
                                        </button>
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              </tbody>
                            </table>
                          </td>
                          <td className="clause-table-cell and-or-column">
                            {canAnd && (
                              <select
                                className="clause-table-field and-or-column"
                                data-bind=" value: and_or, "
                                autoFocus={isAndOrFocused}
                                aria-label=" and_or "
                              >
                                {clauseRules().map((data, index) => (
                                  <option value={data}>{data}</option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td className="clause-table-cell field-column" onClick={updateColumnOptions}>
                            <select
                              aria-label={field}
                              className="clause-table-field field-column"
                              data-bind=" value: field"
                            >
                              {columnOptions().map((data, index) => (
                                <option value={data}>{data}</option>
                              ))}
                            </select>
                          </td>
                          <td className="clause-table-cell type-column">
                            {isTypeEditable && (
                              <select
                                className="clause-table-field type-column"
                                aria-label={type}
                                value={type}
                                data-bind="css: {'query-builder-isDisabled': !isTypeEditable()}"
                              >
                                {edmTypes.map((data) => (
                                  <option>{parent.edmTypes} </option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td className="clause-table-cell operator-column">
                            {isOperaterEditable && (
                              <select
                                className="clause-table-field operator-column"
                                aria-label={operator}
                                data-bind="
                            value: operator,
                            css: {'query-builder-isDisabled': !isOperaterEditable()}"
                              >
                                {operators().map((data, index) => (
                                  <option key={index}>{data}</option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td className="clause-table-cell value-column">
                            {isValue && (
                              <input
                                type="text"
                                className="clause-table-field value-column"
                                type="search"
                                data-bind="textInput: value"
                                aria-label={valueLabel}
                              />
                            )}

                            {isTimestamp && (
                              <select
                                className="clause-table-field time-column"
                                data-bind="options: $parent.timeOptions, value: timeValue"
                              ></select>
                            )}

                            {isCustomLastTimestamp && (
                              <input
                                className="clause-table-field time-column"
                                value={customTimeValue}
                                onClick={customTimestampDialog}
                              />
                            )}
                            {isCustomRangeTimestamp && (
                              <input
                                className="clause-table-field time-column"
                                type="datetime-local"
                                step="1"
                                value={customTimeValue}
                              />
                            )}
                          </td>
                         */}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div
                  className="addClause"
                  role="button"
                  onClick={addNewClause}
                  data-bind="event: { keydown: onAddNewClauseKeyDown }"
                  title={addNewClauseLine}
                  tabIndex={0}
                >
                  <div className="addClause-heading">
                    <span className="clause-table addClause-title">
                      <img
                        className="addclauseProperty-Img"
                        style={{ marginBottom: "5px" }}
                        src="/Add-property.svg"
                        alt="Add new clause"
                      />
                      <span style={{ marginLeft: "5px" }}>{addNewClauseLine}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="advanced-options-panel">
            {/* <div className="advanced-heading">
              <span
                className="advanced-title"
                role="button"
                onClick={toggleAdvancedOptions}
                onKeyDown={ontoggleAdvancedOptionsKeyDown}
                aria-expanded={isExpanded() ? "true" : "false"}
                tabIndex={0}
              >
                <div
                  className="themed-images"
                  type="text/html"
                  id="ExpandChevronRight"
                  data-bind="hasFocus: focusExpandIcon"
                >
                  <img
                    className="imgiconwidth expand-triangle expand-triangle-right"
                    src="/Triangle-right.svg"
                    alt="toggle"
                  />
                </div>
                <div className="themed-images" type="text/html" id="ExpandChevronDown">
                  <img className="imgiconwidth expand-triangle" src="/Triangle-down.svg" alt="toggle" />
                </div>
                <span>Advanced Options</span>
              </span>
            </div>
             {isExpanded && ( 
              <div className="advanced-options">
                <div className="top">
                  <span>Show top results:</span>
                  <input
                    className="top-input"
                    type="number"
                    autoFocus={focusTopResult}
                    value={topValue}
                    title={topValueLimitMessage}
                    role="textbox"
                    aria-label="Show top results"
                  />
                  {isExceedingLimit && (
                    <div role="alert" aria-atomic="true" className="inline-div">
                      <img className="advanced-options-icon" src="/QueryBuilder/StatusWarning_16x.png" />
                      <span>{topValueLimitMessage}</span>
                    </div>
                  )}
                </div>
                <div className="select">
                  <span> Select fields for query: </span>
                  {isSelected && (
                    <div>
                      <img className="advanced-options-icon" src="/QueryBuilder/QueryInformation_16x.png" />
                      <span className="select-options-text">{selectMessage}</span>
                    </div>
                  )}
                  <a
                    className="select-options-link"
                    onKeyDown={onselectQueryOptionsKeyDown}
                    onClick={selectQueryOptions}
                    tabIndex={0}
                    role="link"
                  >
                    <span>Choose Columns... </span>
                  </a>
                </div>
              </div>
            )} */}
          </div>
        </div>

        <div className="tablesQueryTab tableContainer" id={this.tableEntityListViewModel.id}>
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
