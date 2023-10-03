import * as ko from "knockout";
import React from "react";
import AddEntityIcon from "../../../images/AddEntity.svg";
import DeleteEntitiesIcon from "../../../images/DeleteEntities.svg";
import EditEntityIcon from "../../../images/Edit-entity.svg";
import ExecuteQueryIcon from "../../../images/ExecuteQuery.svg";
import QueryBuilderIcon from "../../../images/Query-Builder.svg";
import QueryTextIcon from "../../../images/Query-Text.svg";
import * as ViewModels from "../../Contracts/ViewModels";
import { useSidePanel } from "../../hooks/useSidePanel";
import { userContext } from "../../UserContext";
import { CommandButtonComponentProps } from "../Controls/CommandButton/CommandButtonComponent";
import Explorer from "../Explorer";
import { AddTableEntityPanel } from "../Panes/Tables/AddTableEntityPanel";
import { EditTableEntityPanel } from "../Panes/Tables/EditTableEntityPanel";
import TableCommands from "../Tables/DataTable/TableCommands";
import TableEntityListViewModel from "../Tables/DataTable/TableEntityListViewModel";
import QueryViewModel from "../Tables/QueryBuilder/QueryViewModel";
import { CassandraAPIDataClient, TableDataClient } from "../Tables/TableDataClient";
import template from "./QueryTablesTab.html";
import TabsBase from "./TabsBase";

// Will act as table explorer class
export default class QueryTablesTab extends TabsBase {
  public readonly html = template;
  public collection: ViewModels.Collection;
  public tableEntityListViewModel = ko.observable<TableEntityListViewModel>();
  public queryViewModel = ko.observable<QueryViewModel>();
  public tableCommands: TableCommands;
  public tableDataClient: TableDataClient;

  public queryText = ko.observable("PartitionKey eq 'partitionKey1'"); // Start out with an example they can modify
  public selectedQueryText = ko.observable("").extend({ notify: "always" });

  public executeQueryButton: ViewModels.Button;
  public addEntityButton: ViewModels.Button;
  public editEntityButton: ViewModels.Button;
  public deleteEntityButton: ViewModels.Button;
  public queryBuilderButton: ViewModels.Button;
  public queryTextButton: ViewModels.Button;
  public container: Explorer;

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
          this.tableEntityListViewModel().selected(),
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
          this.tableEntityListViewModel().selected(),
        );
      }),

      visible: ko.computed<boolean>(() => {
        return true;
      }),
    };

    this.buildCommandBarOptions();
  }

  public onAddEntityClick = (): void => {
    useSidePanel
      .getState()
      .openSidePanel(
        "Add Table Row",
        <AddTableEntityPanel
          tableDataClient={this.tableDataClient}
          queryTablesTab={this}
          tableEntityListViewModel={this.tableEntityListViewModel()}
          cassandraApiClient={new CassandraAPIDataClient()}
        />,
        "700px",
      );
  };

  public onEditEntityClick = (): void => {
    useSidePanel
      .getState()
      .openSidePanel(
        "Edit Table Entity",
        <EditTableEntityPanel
          tableDataClient={this.tableDataClient}
          queryTablesTab={this}
          tableEntityListViewModel={this.tableEntityListViewModel()}
          cassandraApiClient={new CassandraAPIDataClient()}
        />,
        "700px",
      );
  };

  public onDeleteEntityClick = (): void => {
    this.tableCommands.deleteEntitiesCommand(this.tableEntityListViewModel());
  };

  public onActivate(): void {
    super.onActivate();
    const columns =
      !!this.tableEntityListViewModel() &&
      !!this.tableEntityListViewModel().table &&
      this.tableEntityListViewModel().table.columns;
    if (columns) {
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
        onCommandClick: () => this.queryViewModel().selectHelper(),
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
        onCommandClick: () => this.queryViewModel().selectEditor(),
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
        onCommandClick: () => this.queryViewModel().runQuery(),
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
      ]),
    ).subscribe(() => this.updateNavbarWithTabsButtons());
    this.updateNavbarWithTabsButtons();
  }
}
