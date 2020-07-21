import Q from "q";
import * as Constants from "../../Common/Constants";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { Action } from "../../Shared/Telemetry/TelemetryConstants";
import ScriptTabBase from "./ScriptTabBase";
import TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import UserDefinedFunction from "../Tree/UserDefinedFunction";

export default class UserDefinedFunctionTab extends ScriptTabBase implements ViewModels.UserDefinedFunctionTab {
  public collection: ViewModels.Collection;
  public node: UserDefinedFunction;
  constructor(options: ViewModels.ScriptTabOption) {
    super(options);
    this.ariaLabel("User Defined Function Body");
    super.onActivate.bind(this);
    super.buildCommandBarOptions.bind(this);
    super.buildCommandBarOptions();
  }

  public onSaveClick = (): Q.Promise<DataModels.UserDefinedFunction> => {
    const data: DataModels.UserDefinedFunction = this._getResource();
    return this._createUserDefinedFunction(data);
  };

  public onUpdateClick = (): Q.Promise<any> => {
    const data: DataModels.UserDefinedFunction = this._getResource();
    this.isExecutionError(false);
    this.isExecuting(true);
    const startKey: number = TelemetryProcessor.traceStart(Action.UpdateUDF, {
      databaseAccountName: this.collection && this.collection.container.databaseAccount().name,
      defaultExperience: this.collection && this.collection.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: this.tabTitle()
    });

    return this.documentClientUtility
      .updateUserDefinedFunction(this.collection, data)
      .then(
        (createdResource: DataModels.UserDefinedFunction) => {
          this.resource(createdResource);
          this.tabTitle(createdResource.id);

          this.node.id(createdResource.id);
          this.node.body(createdResource.body);
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
          editorModel.setValue(createdResource.body);
          this.editorContent.setBaseline(createdResource.body);
        },
        (createError: any) => {
          this.isExecutionError(true);
          TelemetryProcessor.traceFailure(
            Action.UpdateUDF,
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
    resource: DataModels.UserDefinedFunction
  ): Q.Promise<DataModels.UserDefinedFunction> {
    this.isExecutionError(false);
    this.isExecuting(true);
    const startKey: number = TelemetryProcessor.traceStart(Action.CreateUDF, {
      databaseAccountName: this.collection && this.collection.container.databaseAccount().name,
      defaultExperience: this.collection && this.collection.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: this.tabTitle()
    });

    return this.documentClientUtility
      .createUserDefinedFunction(this.collection, resource)
      .then(
        (createdResource: DataModels.UserDefinedFunction) => {
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
          editorModel.setValue(createdResource.body);
          this.editorContent.setBaseline(createdResource.body);

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
              tabTitle: this.tabTitle()
            },
            startKey
          );
          return Q.reject(createError);
        }
      )
      .finally(() => this.isExecuting(false));
  }

  private _getResource() {
    const resource: DataModels.UserDefinedFunction = <DataModels.UserDefinedFunction>{
      _rid: this.resource()._rid,
      _self: this.resource()._self,
      id: this.id(),
      body: this.editorContent()
    };

    return resource;
  }
}
