import { Resource, StoredProcedureDefinition } from "@azure/cosmos";
import * as ko from "knockout";
import Q from "q";
import * as _ from "underscore";
import ExecuteQueryIcon from "../../../images/ExecuteQuery.svg";
import * as Constants from "../../Common/Constants";
import { createStoredProcedure } from "../../Common/dataAccess/createStoredProcedure";
import { updateStoredProcedure } from "../../Common/dataAccess/updateStoredProcedure";
import editable from "../../Common/EditableUtility";
import * as ViewModels from "../../Contracts/ViewModels";
import { Action } from "../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { CommandButtonComponentProps } from "../Controls/CommandButton/CommandButtonComponent";
import StoredProcedure from "../Tree/StoredProcedure";
import ScriptTabBase from "./ScriptTabBase";

enum ToggleState {
  Result = "result",
  Logs = "logs"
}

export default class StoredProcedureTab extends ScriptTabBase {
  public collection: ViewModels.Collection;
  public node: StoredProcedure;
  public executeResultsEditorId: string;
  public executeLogsEditorId: string;
  public toggleState: ko.Observable<ToggleState>;
  public originalSprocBody: ViewModels.Editable<string>;
  public resultsData: ko.Observable<string>;
  public logsData: ko.Observable<string>;
  public error: ko.Observable<string>;
  public hasResults: ko.Observable<boolean>;
  public hasErrors: ko.Observable<boolean>;

  constructor(options: ViewModels.ScriptTabOption) {
    super(options);
    super.onActivate.bind(this);

    this.executeResultsEditorId = `executestoredprocedureresults${this.tabId}`;
    this.executeLogsEditorId = `executestoredprocedurelogs${this.tabId}`;
    this.toggleState = ko.observable<ToggleState>(ToggleState.Result);
    this.originalSprocBody = editable.observable<string>(this.editorContent());
    this.resultsData = ko.observable<string>();
    this.logsData = ko.observable<string>();
    this.error = ko.observable<string>();
    this.hasResults = ko.observable<boolean>(false);
    this.hasErrors = ko.observable<boolean>(false);
    this.error.subscribe((error: string) => {
      this.hasErrors(error != null);
      this.hasResults(error == null);
    });

    this.ariaLabel("Stored Procedure Body");
    this.buildCommandBarOptions();
  }

  public onSaveClick = (): Promise<StoredProcedureDefinition & Resource> => {
    return this._createStoredProcedure({
      id: this.id(),
      body: this.editorContent()
    });
  };

  public onDiscard = (): Q.Promise<any> => {
    this.setBaselines();
    const original = this.editorContent.getEditableOriginalValue();
    this.originalSprocBody(original);
    this.originalSprocBody.valueHasMutated(); // trigger a re-render of the editor

    return Q();
  };

  public onUpdateClick = (): Promise<any> => {
    const data = this._getResource();

    this.isExecutionError(false);
    this.isExecuting(true);
    const startKey: number = TelemetryProcessor.traceStart(Action.UpdateStoredProcedure, {
      databaseAccountName: this.collection && this.collection.container.databaseAccount().name,
      defaultExperience: this.collection && this.collection.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: this.tabTitle()
    });
    return updateStoredProcedure(this.collection.databaseId, this.collection.id(), data)
      .then(
        updatedResource => {
          this.resource(updatedResource);
          this.tabTitle(updatedResource.id);
          this.node.id(updatedResource.id);
          this.node.body(updatedResource.body as string);
          this.setBaselines();

          const editorModel = this.editor() && this.editor().getModel();
          editorModel && editorModel.setValue(updatedResource.body as string);
          this.editorContent.setBaseline(updatedResource.body as string);
          TelemetryProcessor.traceSuccess(
            Action.UpdateStoredProcedure,
            {
              databaseAccountName: this.collection && this.collection.container.databaseAccount().name,
              defaultExperience: this.collection && this.collection.container.defaultExperience(),
              dataExplorerArea: Constants.Areas.Tab,
              tabTitle: this.tabTitle()
            },
            startKey
          );
        },
        (updateError: any) => {
          this.isExecutionError(true);
          TelemetryProcessor.traceFailure(
            Action.UpdateStoredProcedure,
            {
              databaseAccountName: this.collection && this.collection.container.databaseAccount().name,
              defaultExperience: this.collection && this.collection.container.defaultExperience(),
              dataExplorerArea: Constants.Areas.Tab,
              tabTitle: this.tabTitle()
            },
            startKey
          );
        }
      )
      .finally(() => this.isExecuting(false));
  };

  public onExecuteSprocsResult(result: any, logsData: any): void {
    const resultData: string = this.renderObjectForEditor(_.omit(result, "scriptLogs").result, null, 4);
    const scriptLogs: string = (result.scriptLogs && decodeURIComponent(result.scriptLogs)) || "";
    const logs: string = this.renderObjectForEditor(scriptLogs, null, 4);
    this.error(null);
    this.resultsData(resultData);
    this.logsData(logs);
  }

  public onExecuteSprocsError(error: string): void {
    this.isExecutionError(true);
    console.error(error);
    this.error(error);
  }

  public onErrorDetailsClick = (src: any, event: MouseEvent): boolean => {
    this.collection && this.collection.container.expandConsole();

    return false;
  };

  public onErrorDetailsKeyPress = (src: any, event: KeyboardEvent): boolean => {
    if (event.keyCode === Constants.KeyCodes.Space || event.keyCode === Constants.KeyCodes.Enter) {
      this.onErrorDetailsClick(src, null);
      return false;
    }

    return true;
  };

  public toggleResult(): void {
    this.toggleState(ToggleState.Result);
    this.resultsData.valueHasMutated(); // needed to refresh the json-editor component
  }

  public toggleLogs(): void {
    this.toggleState(ToggleState.Logs);
    this.logsData.valueHasMutated(); // needed to refresh the json-editor component
  }

  public onToggleKeyDown = (source: any, event: KeyboardEvent): boolean => {
    if (event.keyCode === Constants.KeyCodes.LeftArrow) {
      this.toggleResult();
      event.stopPropagation();
      return false;
    } else if (event.keyCode === Constants.KeyCodes.RightArrow) {
      this.toggleLogs();
      event.stopPropagation();
      return false;
    }

    return true;
  };

  public isResultToggled(): boolean {
    return this.toggleState() === ToggleState.Result;
  }

  public isLogsToggled(): boolean {
    return this.toggleState() === ToggleState.Logs;
  }

  protected updateSelectedNode(): void {
    if (this.collection == null) {
      return;
    }

    const database: ViewModels.Database = this.collection.getDatabase();
    if (!database.isDatabaseExpanded()) {
      this.collection.container.selectedNode(database);
    } else if (!this.collection.isCollectionExpanded() || !this.collection.isStoredProceduresExpanded()) {
      this.collection.container.selectedNode(this.collection);
    } else {
      this.collection.container.selectedNode(this.node);
    }
  }

  protected buildCommandBarOptions(): void {
    ko.computed(() => ko.toJSON([this.isNew, this.formIsDirty])).subscribe(() => this.updateNavbarWithTabsButtons());
    super.buildCommandBarOptions();
  }

  protected getTabsButtons(): CommandButtonComponentProps[] {
    const label = "Execute";
    return super.getTabsButtons().concat({
      iconSrc: ExecuteQueryIcon,
      iconAlt: label,
      onCommandClick: () => {
        this.collection && this.collection.container.executeSprocParamsPane.open();
      },
      commandButtonLabel: label,
      ariaLabel: label,
      hasPopup: false,
      disabled: this.isNew() || this.formIsDirty()
    });
  }

  private _getResource() {
    return {
      id: this.id(),
      body: this.editorContent()
    };
  }

  private _createStoredProcedure(resource: StoredProcedureDefinition): Promise<StoredProcedureDefinition & Resource> {
    this.isExecutionError(false);
    this.isExecuting(true);
    const startKey: number = TelemetryProcessor.traceStart(Action.CreateStoredProcedure, {
      databaseAccountName: this.collection && this.collection.container.databaseAccount().name,
      defaultExperience: this.collection && this.collection.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: this.tabTitle()
    });

    return createStoredProcedure(this.collection.databaseId, this.collection.id(), resource)
      .then(
        createdResource => {
          this.tabTitle(createdResource.id);
          this.isNew(false);
          this.resource(createdResource);
          this.hashLocation(
            `${Constants.HashRoutePrefixes.collectionsWithIds(
              this.collection.databaseId,
              this.collection.id()
            )}/sprocs/${createdResource.id}`
          );
          this.setBaselines();

          const editorModel = this.editor() && this.editor().getModel();
          editorModel && editorModel.setValue(createdResource.body as string);
          this.editorContent.setBaseline(createdResource.body as string);
          this.node = this.collection.createStoredProcedureNode(createdResource);
          TelemetryProcessor.traceSuccess(
            Action.CreateStoredProcedure,
            {
              databaseAccountName: this.collection && this.collection.container.databaseAccount().name,
              defaultExperience: this.collection && this.collection.container.defaultExperience(),
              dataExplorerArea: Constants.Areas.Tab,
              tabTitle: this.tabTitle()
            },
            startKey
          );
          this.editorState(ViewModels.ScriptEditorState.exisitingNoEdits);
          return createdResource;
        },
        createError => {
          this.isExecutionError(true);
          TelemetryProcessor.traceFailure(
            Action.CreateStoredProcedure,
            {
              databaseAccountName: this.collection && this.collection.container.databaseAccount().name,
              defaultExperience: this.collection && this.collection.container.defaultExperience(),
              dataExplorerArea: Constants.Areas.Tab,
              tabTitle: this.tabTitle()
            },
            startKey
          );
          return Promise.reject(createError);
        }
      )
      .finally(() => this.isExecuting(false));
  }

  public onDelete(): Q.Promise<any> {
    // TODO
    return Q();
  }
}
