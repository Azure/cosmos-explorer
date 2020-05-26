import Q from "q";
import * as Constants from "../../Common/Constants";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { Action } from "../../Shared/Telemetry/TelemetryConstants";
import ScriptTabBase from "./ScriptTabBase";
import editable from "../../Common/EditableUtility";
import TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";

export default class TriggerTab extends ScriptTabBase implements ViewModels.TriggerTab {
  public collection: ViewModels.Collection;
  public node: ViewModels.Trigger;
  public triggerType: ViewModels.Editable<string>;
  public triggerOperation: ViewModels.Editable<string>;

  constructor(options: ViewModels.ScriptTabOption) {
    super(options);
    super.onActivate.bind(this);
    this.ariaLabel("Trigger Body");
    this.triggerType = editable.observable<string>(options.resource.triggerType);
    this.triggerOperation = editable.observable<string>(options.resource.triggerOperation);

    this.formFields([this.id, this.triggerType, this.triggerOperation, this.editorContent]);
    super.buildCommandBarOptions.bind(this);
    super.buildCommandBarOptions();
  }

  public onSaveClick = (): Q.Promise<DataModels.Trigger> => {
    const data: DataModels.Trigger = this._getResource();
    return this._createTrigger(data);
  };

  public onUpdateClick = (): Q.Promise<any> => {
    const data: DataModels.Trigger = this._getResource();
    this.isExecutionError(false);
    this.isExecuting(true);
    const startKey: number = TelemetryProcessor.traceStart(Action.UpdateTrigger, {
      databaseAccountName: this.collection && this.collection.container.databaseAccount().name,
      defaultExperience: this.collection && this.collection.container.defaultExperience(),
      tabTitle: this.tabTitle()
    });

    return this.documentClientUtility
      .updateTrigger(this.collection, data)
      .then(
        (createdResource: DataModels.Trigger) => {
          this.resource(createdResource);
          this.tabTitle(createdResource.id);

          this.node.id(createdResource.id);
          this.node.body(createdResource.body);
          this.node.triggerType(createdResource.triggerOperation);
          this.node.triggerOperation(createdResource.triggerOperation);
          TelemetryProcessor.traceSuccess(
            Action.UpdateTrigger,
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
            Action.UpdateTrigger,
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

  public setBaselines() {
    super.setBaselines();

    const resource = <DataModels.Trigger>this.resource();
    this.triggerOperation.setBaseline(resource.triggerOperation);
    this.triggerType.setBaseline(resource.triggerType);
  }

  protected updateSelectedNode(): void {
    if (this.collection == null) {
      return;
    }

    const database: ViewModels.Database = this.collection.getDatabase();
    if (!database.isDatabaseExpanded()) {
      this.collection.container.selectedNode(database);
    } else if (!this.collection.isCollectionExpanded() || !this.collection.isTriggersExpanded()) {
      this.collection.container.selectedNode(this.collection);
    } else {
      this.collection.container.selectedNode(this.node);
    }
  }

  private _createTrigger(resource: DataModels.Trigger): Q.Promise<DataModels.Trigger> {
    this.isExecutionError(false);
    this.isExecuting(true);
    const startKey: number = TelemetryProcessor.traceStart(Action.CreateTrigger, {
      databaseAccountName: this.collection && this.collection.container.databaseAccount().name,
      defaultExperience: this.collection && this.collection.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: this.tabTitle()
    });

    return this.documentClientUtility
      .createTrigger(this.collection, resource)
      .then(
        (createdResource: DataModels.Trigger) => {
          this.tabTitle(createdResource.id);
          this.isNew(false);
          this.resource(createdResource);
          this.hashLocation(
            `${Constants.HashRoutePrefixes.collectionsWithIds(
              this.collection.databaseId,
              this.collection.id()
            )}/triggers/${createdResource.id}`
          );
          this.setBaselines();

          const editorModel = this.editor().getModel();
          editorModel.setValue(createdResource.body);
          this.editorContent.setBaseline(createdResource.body);

          this.node = this.collection.createTriggerNode(createdResource);
          TelemetryProcessor.traceSuccess(
            Action.CreateTrigger,
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
        (createError: any) => {
          this.isExecutionError(true);
          TelemetryProcessor.traceFailure(
            Action.CreateTrigger,
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

  private _getResource(): DataModels.Trigger {
    const resource: DataModels.Trigger = <DataModels.Trigger>{
      _rid: this.resource()._rid,
      _self: this.resource()._self,
      id: this.id(),
      body: this.editorContent(),
      triggerOperation: this.triggerOperation(),
      triggerType: this.triggerType()
    };

    return resource;
  }
}
