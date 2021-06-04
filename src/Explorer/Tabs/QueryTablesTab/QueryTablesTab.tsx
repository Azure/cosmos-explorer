import * as ko from "knockout";
import Q from "q";
import React, { useState } from 'react';
import AddEntityIcon from "../../../../images/AddEntity.svg";
import DeleteEntitiesIcon from "../../../../images/DeleteEntities.svg";
import EditEntityIcon from "../../../../images/Edit-entity.svg";
import ExecuteQueryIcon from "../../../../images/ExecuteQuery.svg";
import QueryBuilderIcon from "../../../../images/Query-Builder.svg";
import QueryTextIcon from "../../../../images/Query-Text.svg";
import * as ViewModels from "../../../Contracts/ViewModels";
import { userContext } from "../../../UserContext";
import { CommandButtonComponentProps } from "../../Controls/CommandButton/CommandButtonComponent";
import Explorer from "../../Explorer";
import TableCommands from "../../Tables/DataTable/TableCommands";
import TableEntityListViewModel from "../../Tables/DataTable/TableEntityListViewModel";
import QueryViewModel from "../../Tables/QueryBuilder/QueryViewModel";
import { TableDataClient } from "../../Tables/TableDataClient";
import template from "../QueryTablesTab.html";

export default () => {
  const html = template;
  let collection: ViewModels.Collection;
  let tableEntityListViewModel : TableEntityListViewModel;
  let queryViewModel :QueryViewModel;
  let tableCommands: TableCommands;
  let tableDataClient: TableDataClient;
    const [queryText, setQueryText] = useState("PartitionKey eq 'partitionKey1'");
  let selectedQueryText = ko.observable("").extend({ notify: "always" });

  let executeQueryButton: ViewModels.Button;
  let addEntityButton: ViewModels.Button;
  let editEntityButton: ViewModels.Button;
  let deleteEntityButton: ViewModels.Button;
  let queryBuilderButton: ViewModels.Button;
  let queryTextButton: ViewModels.Button;
  let container: Explorer;

  constructor(options: ViewModels.TabOptions) {
    super(options);

    this.container = options.collection && options.collection.container;
    this.tableCommands = new TableCommands(this.container);
    this.tableDataClient = this.container.tableDataClient;
    this.tableEntityListViewModel(new TableEntityListViewModel(this.tableCommands, this));
    this.tableEntityListViewModel().queryTablesTab = this;
    this.queryViewModel(new QueryViewModel(this));
    const sampleQuerySubscription = this.tableEntityListViewModel().items.subscribe(() => {
      if (this.tableEntityListViewModel().items().length > 0 && userContext.apiType === "Tables") {
        this.queryViewModel().queryBuilderViewModel().setExample();
      }
      sampleQuerySubscription.dispose();
    });

    this.executeQueryButton = {
      enabled: ko.computed<boolean>(() => {
        return true;
      }),

      visible: ko.computed<boolean>(() => {
        return true;
      }),
    };

    this.queryBuilderButton = {
      enabled: ko.computed<boolean>(() => {
        return true;
      }),

      visible: ko.computed<boolean>(() => {
        return true;
      }),

      isSelected: ko.computed<boolean>(() => {
        return this.queryViewModel() ? this.queryViewModel().isHelperActive() : false;
      }),
    };

    this.queryTextButton = {
      enabled: ko.computed<boolean>(() => {
        return true;
      }),

      visible: ko.computed<boolean>(() => {
        return true;
      }),

      isSelected: ko.computed<boolean>(() => {
        return this.queryViewModel() ? this.queryViewModel().isEditorActive() : false;
      }),
    };

    this.addEntityButton = {
      enabled: ko.computed<boolean>(() => {
        return true;
      }),

      visible: ko.computed<boolean>(() => {
        return true;
      }),
    };

    this.editEntityButton = {
      enabled: ko.computed<boolean>(() => {
        return this.tableCommands.isEnabled(
          TableCommands.editEntityCommand,
          this.tableEntityListViewModel().selected()
        );
      }),

      visible: ko.computed<boolean>(() => {
        return true;
      }),
    };

    this.deleteEntityButton = {
      enabled: ko.computed<boolean>(() => {
        return this.tableCommands.isEnabled(
          TableCommands.deleteEntitiesCommand,
          this.tableEntityListViewModel().selected()
        );
      }),

      visible: ko.computed<boolean>(() => {
        return true;
      }),
    };

    this.buildCommandBarOptions();
  }

  const onExecuteQueryClick = (): Q.Promise<any> => {
    this.queryViewModel().runQuery();
    return null;
  };

  const onQueryBuilderClick = (): Q.Promise<any> => {
    this.queryViewModel().selectHelper();
    return null;
  };

  const onQueryTextClick = (): Q.Promise<any> => {
    this.queryViewModel().selectEditor();
    return null;
  };

  const onAddEntityClick = (): Q.Promise<any> => {
    this.container.openAddTableEntityPanel(this, this.tableEntityListViewModel());
    return null;
  };

  const onEditEntityClick = (): Q.Promise<any> => {
    this.container.openEditTableEntityPanel(this, this.tableEntityListViewModel());
    return null;
  };

  const onDeleteEntityClick = (): Q.Promise<any> => {
    this.tableCommands.deleteEntitiesCommand(this.tableEntityListViewModel());
    return null;
  };

  const onActivate(): void {
    super.onActivate();
    const columns =
      !!this.tableEntityListViewModel() &&
      !!this.tableEntityListViewModel().table &&
      this.tableEntityListViewModel().table.columns;
    if (!!columns) {
      columns.adjust();
      $(window).resize();
    }
  }

  protected getTabsButtons(): CommandButtonComponentProps[] {
    const buttons: CommandButtonComponentProps[] = [];
    if (this.queryBuilderButton.visible()) {
      const label = userContext.apiType === "Cassandra" ? "CQL Query Builder" : "Query Builder";
      buttons.push({
        iconSrc: QueryBuilderIcon,
        iconAlt: label,
        onCommandClick: this.onQueryBuilderClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.queryBuilderButton.enabled(),
        isSelected: this.queryBuilderButton.isSelected(),
      });
    }

    if (this.queryTextButton.visible()) {
      const label = userContext.apiType === "Cassandra" ? "CQL Query Text" : "Query Text";
      buttons.push({
        iconSrc: QueryTextIcon,
        iconAlt: label,
        onCommandClick: this.onQueryTextClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.queryTextButton.enabled(),
        isSelected: this.queryTextButton.isSelected(),
      });
    }

    if (this.executeQueryButton.visible()) {
      const label = "Run Query";
      buttons.push({
        iconSrc: ExecuteQueryIcon,
        iconAlt: label,
        onCommandClick: this.onExecuteQueryClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.executeQueryButton.enabled(),
      });
    }

    if (this.addEntityButton.visible()) {
      const label = userContext.apiType === "Cassandra" ? "Add Row" : "Add Entity";
      buttons.push({
        iconSrc: AddEntityIcon,
        iconAlt: label,
        onCommandClick: this.onAddEntityClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: true,
        disabled: !this.addEntityButton.enabled(),
      });
    }

    if (this.editEntityButton.visible()) {
      const label = userContext.apiType === "Cassandra" ? "Edit Row" : "Edit Entity";
      buttons.push({
        iconSrc: EditEntityIcon,
        iconAlt: label,
        onCommandClick: this.onEditEntityClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: true,
        disabled: !this.editEntityButton.enabled(),
      });
    }

    if (this.deleteEntityButton.visible()) {
      const label = userContext.apiType === "Cassandra" ? "Delete Rows" : "Delete Entities";
      buttons.push({
        iconSrc: DeleteEntitiesIcon,
        iconAlt: label,
        onCommandClick: this.onDeleteEntityClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: true,
        disabled: !this.deleteEntityButton.enabled(),
      });
    }
    return buttons;
  }

  protected buildCommandBarOptions(): void {
    ko.computed(() =>
      ko.toJSON([
        this.queryBuilderButton.visible,
        this.queryBuilderButton.enabled,
        this.queryTextButton.visible,
        this.queryTextButton.enabled,
        this.executeQueryButton.visible,
        this.executeQueryButton.enabled,
        this.addEntityButton.visible,
        this.addEntityButton.enabled,
        this.editEntityButton.visible,
        this.editEntityButton.enabled,
        this.deleteEntityButton.visible,
        this.deleteEntityButton.enabled,
      ])
    ).subscribe(() => this.updateNavbarWithTabsButtons());
    this.updateNavbarWithTabsButtons();
  }

    return (
        <div className="tab-pane tableContainer" id={tabId} role="tabpanel">
  
  <div
    className="query-builder"
    id= {queryViewModel.id}
  >
    <div className="error-bar">
    {
    hasQueryError && <div className="error-message" aria-label="Error Message" >
        <span><img className="entity-error-Img" src="/error_red.svg" /></span>
        <span className="error-text" role="alert" >{queryErrorMessage}</span>
      </div>
    }</div>
  
    {isEditorActive && <div className="query-editor-panel">
      <div>
        <textarea
          className="query-editor-text"
          data-bind="
                css: { 'query-editor-text-invalid': hasQueryError },
                readOnly: true"
          name="query-editor"
          rows={5}
          cols={100}
        >{queryText}</textarea>
      </div>
    </div>
    }
    {isHelperActive && <div style={{paddingLeft: "13px"}}>
      <div className="clause-table" data-bind="with: queryBuilderViewModel ">
        <div className="scroll-box scrollable" id="scroll">
          <table className="clause-table">
            <thead>
              <tr className="clause-table-row">
                <th className="clause-table-cell header-background action-header">
                  <span >{actionLabel}</span>
                </th>
                <th className="clause-table-cell header-background group-control-header">
                 {canGroupClauses && <button
                    type="button"
                    onClick={groupClauses}
                    title= {groupSelectedClauses}
                  >}
                    <img className="and-or-svg" src="/And-Or.svg" alt="Group selected clauses" />
                  </button>
                </th>
                <th className="clause-table-cell header-background"></th>
                <th className="clause-table-cell header-background and-or-header">
                  <span >{andLabel}</span>
                </th>
                <th className="clause-table-cell header-background field-header">
                  <span  >{fieldLabel}</span>
                </th>
                <th className="clause-table-cell header-background type-header">
                  <span >{dataTypeLabel}</span>
                </th>
                <th className="clause-table-cell header-background operator-header">
                  <span >{operatorLabel}</span>
                </th>
                <th className="clause-table-cell header-background value-header">
                  <span>{valueLabel}</span>
                </th>
              </tr>
            </thead>
            <tbody>
            {clauseArray.map((clause, index)=> 
            <tr className="clause-table-row">
    <td className="clause-table-cell action-column">
      <span
        className="entity-Add-Cancel"
        role="button"
        tabIndex={0}
        onClick={$parent.addClauseIndex.bind($data, $index())}
        onKeyDown={$parent.onAddClauseKeyDown.bind($data, $index())}
        title =  {$parent.insertNewFilterLine}
      >
        <img className="querybuilder-addpropertyImg" src="/Add-property.svg" alt="Add clause" />
      </span>
      <span
        className="entity-Add-Cancel"
        role="button"
        tabIndex={0}
        data-bind="hasFocus: isDeleteButtonFocused"
        onClick={$parent.deleteClause.bind($data, $index())}
        onKeyDown={$parent.onDeleteClauseKeyDown.bind($data, $index())}
        title= {$parent.removeThisFilterLine}
      >
        <img className="querybuilder-cancelImg" src="/Entity_cancel.svg" alt="Delete clause" />
      </span>
    </td>
    <td className="clause-table-cell group-control-column">
      <input type="checkbox" aria-label="And/Or" checked={checkedForGrouping} />
    </td>
    <td>
      <table className="group-indicator-table">
        <tbody>
          <tr
          >
              {$parent.getClauseGroupViewModels($data).map((gi, index)=> 
             <td
    className="group-indicator-column"
    style= {{backgroundColor: gi.backgroundColor, borderTop: gi.showTopBorder.peek() ? 'solid thin #CCCCCC' : 'none', borderLeft: gi.showLeftBorder.peek() ? 'solid thin #CCCCCC' : 'none', borderBottom: gi.showBottomBorder.peek() ? 'solid thin #CCCCCC' : gi.borderBackgroundColor}}
  >
    {gi.canUngroup && <button type="button" onClick={ungroupClauses} title ={ungroupClausesLabel}>
      <img src="/QueryBuilder/UngroupClause_16x.png" alt="Ungroup clauses" />
    </button>}
    }
    
    
  </td>

) 
    
          </tr>
        </tbody>
      </table>
    </td>
    <td className="clause-table-cell and-or-column">
      {canAnd && <select
        className="clause-table-field and-or-column"
        data-bind=" value: and_or, "
        autoFocus={isAndOrFocused}
        aria-label=" and_or "
      >
          {$parent.clauseRules.map((data, index)=> <option value={data}>{data}</option>)}
      </select>
    }</td>
    <td className="clause-table-cell field-column" onClick={$parent.updateColumnOptions}>
      <select
        aria-label = {field}
        className="clause-table-field field-column"
        data-bind=" value: field"
      >
        {$parent.columnOptions.map((data, index)=> <option value={data}>{data}</option>)}
      </select>
    </td>
    <td className="clause-table-cell type-column">
      {isTypeEditable && <select
        className="clause-table-field type-column"
        aria-label = {type}
        
        data-bind="
                  options: $parent.edmTypes,
                  value: type,
                  css: {'query-builder-isDisabled': !isTypeEditable()},
      ></select>}
    </td>
    <td className="clause-table-cell operator-column">
    {isOperaterEditable && <select
        className="clause-table-field operator-column"
        aria-label=  {operator}
        data-bind="
                  options: $parent.operators,
                  value: operator,
                  css: {'query-builder-isDisabled': !isOperaterEditable()}"
      ></select>}
    </td>
    <td className="clause-table-cell value-column">
      {isValue &&
      <input
        type="text"
        className="clause-table-field value-column"
        type="search"
        data-bind="textInput: value"
        aria-label =  {$parent.valueLabel}
      />
      }

       {isTimestamp && 
      <select
        className="clause-table-field time-column"
        data-bind="options: $parent.timeOptions, value: timeValue"
      ></select>
    }

      {isCustomLastTimestamp
       &&
      <input className="clause-table-field time-column" value={customTimeValue} onClick = {customTimestampDialog} />
      }
      { isCustomRangeTimestamp &&
      <input className="clause-table-field time-column" type="datetime-local" step="1" value= {customTimeValue} />
      }
    </td>
  </tr>
)        }

            </tbody>
          </table>
        </div>
        <div
          className="addClause"
          role="button"
          onClick={addNewClause}
          data-bind="event: { keydown: onAddNewClauseKeyDown }"
          title= {addNewClauseLine}
          tabIndex={0}
        >
          <div className="addClause-heading">
            <span className="clause-table addClause-title">
              <img
                className="addclauseProperty-Img"
                style={{marginBottom: "5px"}}
                src="/Add-property.svg"
                alt="Add new clause"
              />
              <span style={{marginLeft : "5px"}} >{addNewClauseLine}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
    }<div className="advanced-options-panel">
      <div className="advanced-heading">
        <span
          className="advanced-title"
          role="button"
          onClick={toggleAdvancedOptions}
          onKeyDown={ontoggleAdvancedOptionsKeyDown}
          aria-expanded = {isExpanded() ? 'true' : 'false' }
          tabIndex={0}
        >
          <div className="themed-images" type="text/html" id="ExpandChevronRight" data-bind="hasFocus: focusExpandIcon" >
            <img className="imgiconwidth expand-triangle expand-triangle-right" src="/Triangle-right.svg" alt="toggle" />
          </div>
          <div className="themed-images" type="text/html" id="ExpandChevronDown">
            <img className="imgiconwidth expand-triangle" src="/Triangle-down.svg" alt="toggle" />
          </div>
          <span>Advanced Options</span>
        </span>
      </div>
      {isExpanded && <div className="advanced-options" >
        <div className="top">
          <span>Show top results:</span>
          <input
            className="top-input"
            type="number"
            autoFocus={focusTopResult}
            value={topValue}
            title = {topValueLimitMessage}
            role="textbox"
            aria-label="Show top results"
          />
          {isExceedingLimit && <div role="alert" aria-atomic="true" className="inline-div" >
            <img className="advanced-options-icon" src="/QueryBuilder/StatusWarning_16x.png" />
            <span >{topValueLimitMessage}</span>
          </div>
        
        }</div>
        <div className="select">
          <span> Select fields for query: </span>
          {isSelected && <div >
            <img className="advanced-options-icon" src="/QueryBuilder/QueryInformation_16x.png" />
            <span className="select-options-text" >{selectMessage}</span>
          </div>
          }<a
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
    }</div>
  </div>
  <div
    className="tablesQueryTab tableContainer"
    id = {tableEntityListViewModel.id}
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
