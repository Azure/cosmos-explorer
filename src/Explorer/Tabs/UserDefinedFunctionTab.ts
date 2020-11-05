import { Resource, UserDefinedFunctionDefinition } from "@azure/cosmos";
import * as Constants from "../../Common/Constants";
import { createUserDefinedFunction } from "../../Common/dataAccess/createUserDefinedFunction";
import { updateUserDefinedFunction } from "../../Common/dataAccess/updateUserDefinedFunction";
import * as ViewModels from "../../Contracts/ViewModels";
import { Action } from "../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import UserDefinedFunction from "../Tree/UserDefinedFunction";
import ScriptTabBase from "./ScriptTabBase";
import { getErrorMessage } from "../../Common/ErrorHandlingUtils";

export default class UserDefinedFunctionTab extends ScriptTabBase {
  public collection: ViewModels.Collection;
  public node: UserDefinedFunction;
  constructor(options: ViewModels.ScriptTabOption) {
    super(options);
    this.ariaLabel("User Defined Function Body");
    super.onActivate.bind(this);
    super.buildCommandBarOptions.bind(this);
    super.buildCommandBarOptions();
  }

  public onSaveClick = (): Promise<UserDefinedFunctionDefinition & Resource> => {
    const data = this._getResource();
    return this._createUserDefinedFunction(data);
  };

  public onUpdateClick = (): Promise<any> => {
    const data = this._getResource();
    this.isExecutionError(false);
    this.isExecuting(true);
    const startKey: number = TelemetryProcessor.traceStart(Action.UpdateUDF, {
      databaseAccountName: this.collection && this.collection.container.databaseAccount().name,
      defaultExperience: this.collection && this.collection.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: this.tabTitle()
    });

    return updateUserDefinedFunction(this.collection.databaseId, this.collection.id(), data)
      .then(
        createdResource => {
          this.resource(createdResource);
          this.tabTitle(createdResource.id);

          this.node.id(createdResource.id);
          this.node.body(createdResource.body as string);
          TelemetryProcessor.traceSuccess(
            Action.UpdateUDF,
            {
              databaseAccountName: this.collection && this.collection.container.databaseAccount().name,
              defaultExperience: this.collection && this.collection.container.defaultExperience(),
              dataExplorerArea: Constants.Areas.Tab,
              tabTitle: this.tabTitle()
            },
            startKey
          );

          this.setBaselines();

          const editorModel = this.editor().getModel();
          editorModel.setValue(createdResource.body as string);
          this.editorContent.setBaseline(createdResource.body as string);
        },
        (createError: any) => {
          this.isExecutionError(true);
          TelemetryProcessor.traceFailure(
            Action.UpdateUDF,
            {
              databaseAccountName: this.collection && this.collection.container.databaseAccount().name,
              defaultExperience: this.collection && this.collection.container.defaultExperience(),
              dataExplorerArea: Constants.Areas.Tab,
              tabTitle: this.tabTitle(),
              error: getErrorMessage(createError)
            },
            startKey
          );
        }
      )
      .finally(() => this.isExecuting(false));
  };

  protected updateSelectedNode(): void {
    if (this.collection == null) {
      return;
    }

    const database: ViewModels.Database = this.collection.getDatabase();
    if (!database.isDatabaseExpanded()) {
      this.collection.container.selectedNode(database);
    } else if (!this.collection.isCollectionExpanded() || !this.collection.isUserDefinedFunctionsExpanded()) {
      this.collection.container.selectedNode(this.collection);
    } else {
      this.collection.container.selectedNode(this.node);
    }
  }

  private _createUserDefinedFunction(
    resource: UserDefinedFunctionDefinition
  ): Promise<UserDefinedFunctionDefinition & Resource> {
    this.isExecutionError(false);
    this.isExecuting(true);
    const startKey: number = TelemetryProcessor.traceStart(Action.CreateUDF, {
      databaseAccountName: this.collection && this.collection.container.databaseAccount().name,
      defaultExperience: this.collection && this.collection.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: this.tabTitle()
    });

    return createUserDefinedFunction(this.collection.databaseId, this.collection.id(), resource)
      .then(
        createdResource => {
          this.tabTitle(createdResource.id);
          this.isNew(false);
          this.resource(createdResource);
          this.hashLocation(
            `${Constants.HashRoutePrefixes.collectionsWithIds(this.collection.databaseId, this.collection.id())}/udfs/${
              createdResource.id
            }`
          );
          this.setBaselines();

          const editorModel = this.editor().getModel();
          editorModel.setValue(createdResource.body as string);
          this.editorContent.setBaseline(createdResource.body as string);

          this.node = this.collection.createUserDefinedFunctionNode(createdResource);
          TelemetryProcessor.traceSuccess(
            Action.CreateUDF,
            {
              databaseAccountName: this.collection && this.collection.container.databaseAccount().name,
              dataExplorerArea: Constants.Areas.Tab,
              defaultExperience: this.collection && this.collection.container.defaultExperience(),
              tabTitle: this.tabTitle()
            },
            startKey
          );
          this.editorState(ViewModels.ScriptEditorState.exisitingNoEdits);
          return createdResource;
        },
        (createError: any) => {
          this.isExecutionError(true);
          TelemetryProcessor.traceFailure(
            Action.CreateUDF,
            {
              databaseAccountName: this.collection && this.collection.container.databaseAccount().name,
              defaultExperience: this.collection && this.collection.container.defaultExperience(),
              dataExplorerArea: Constants.Areas.Tab,
              tabTitle: this.tabTitle(),
              error: getErrorMessage(createError)
            },
            startKey
          );
          return Promise.reject(createError);
        }
      )
      .finally(() => this.isExecuting(false));
  }

  private _getResource() {
    const resource = {
      _rid: this.resource()._rid,
      _self: this.resource()._self,
      id: this.id(),
      body: this.editorContent()
    };

    return resource;
  }
}
