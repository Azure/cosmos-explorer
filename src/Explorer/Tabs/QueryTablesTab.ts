import * as ko from "knockout";
import Q from "q";
import AddEntityIcon from "../../../images/AddEntity.svg";
import DeleteEntitiesIcon from "../../../images/DeleteEntities.svg";
import EditEntityIcon from "../../../images/Edit-entity.svg";
import ExecuteQueryIcon from "../../../images/ExecuteQuery.svg";
import QueryBuilderIcon from "../../../images/Query-Builder.svg";
import QueryTextIcon from "../../../images/Query-Text.svg";
import * as ViewModels from "../../Contracts/ViewModels";
import { CommandButtonComponentProps } from "../Controls/CommandButton/CommandButtonComponent";
import Explorer from "../Explorer";
import TableCommands from "../Tables/DataTable/TableCommands";
import TableEntityListViewModel from "../Tables/DataTable/TableEntityListViewModel";
import QueryViewModel from "../Tables/QueryBuilder/QueryViewModel";
import { TableDataClient } from "../Tables/TableDataClient";
import template from "./QueryTablesTab.html";
import TabsBase from "./TabsBase";

// Will act as table explorer class
export default class QueryTablesTab extends TabsBase {
  public static readonly component = { name: "tables-query-tab", template };
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
      if (this.tableEntityListViewModel().items().length > 0 && this.container.isPreferredApiTable()) {
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

  public onExecuteQueryClick = (): Q.Promise<any> => {
    this.queryViewModel().runQuery();
    return null;
  };

  public onQueryBuilderClick = (): Q.Promise<any> => {
    this.queryViewModel().selectHelper();
    return null;
  };

  public onQueryTextClick = (): Q.Promise<any> => {
    this.queryViewModel().selectEditor();
    return null;
  };

  public onAddEntityClick = (): Q.Promise<any> => {
    this.container.addTableEntityPane.tableViewModel = this.tableEntityListViewModel();
    this.container.openAddTableEntityPanel(this, this.tableEntityListViewModel());
    return null;
  };

  public onEditEntityClick = (): Q.Promise<any> => {
    this.container.openEditTableEntityPanel(this, this.tableEntityListViewModel());

    // this.tableCommands.editEntityCommand(this.tableEntityListViewModel());
    return null;
  };

  public onDeleteEntityClick = (): Q.Promise<any> => {
    this.tableCommands.deleteEntitiesCommand(this.tableEntityListViewModel());
    return null;
  };

  public onActivate(): void {
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
      const label = this.container.isPreferredApiCassandra() ? "CQL Query Builder" : "Query Builder";
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
      const label = this.container.isPreferredApiCassandra() ? "CQL Query Text" : "Query Text";
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
      const label = this.container.isPreferredApiCassandra() ? "Add Row" : "Add Entity";
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
      const label = this.container.isPreferredApiCassandra() ? "Edit Row" : "Edit Entity";
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
      const label = this.container.isPreferredApiCassandra() ? "Delete Rows" : "Delete Entities";
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
}
