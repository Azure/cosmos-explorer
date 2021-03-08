import { Resource, TriggerDefinition, TriggerOperation, TriggerType } from "@azure/cosmos";
import * as Constants from "../../Common/Constants";
import { createTrigger } from "../../Common/dataAccess/createTrigger";
import { updateTrigger } from "../../Common/dataAccess/updateTrigger";
import editable from "../../Common/EditableUtility";
import * as ViewModels from "../../Contracts/ViewModels";
import { Action } from "../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import Trigger from "../Tree/Trigger";
import ScriptTabBase from "./ScriptTabBase";
import { getErrorMessage, getErrorStack } from "../../Common/ErrorHandlingUtils";

export default class TriggerTab extends ScriptTabBase {
  public collection: ViewModels.Collection;
  public node: Trigger;
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

  public onSaveClick = (): Promise<TriggerDefinition & Resource> => {
    return this._createTrigger({
      id: this.id(),
      body: this.editorContent(),
      triggerOperation: this.triggerOperation() as TriggerOperation,
      triggerType: this.triggerType() as TriggerType,
    });
  };

  public onUpdateClick = (): Promise<any> => {
    const data = this._getResource();
    this.isExecutionError(false);
    this.isExecuting(true);
    const startKey: number = TelemetryProcessor.traceStart(Action.UpdateTrigger, {
      tabTitle: this.tabTitle(),
    });

    return updateTrigger(this.collection.databaseId, this.collection.id(), {
      id: this.id(),
      body: this.editorContent(),
      triggerOperation: this.triggerOperation() as TriggerOperation,
      triggerType: this.triggerType() as TriggerType,
    })
      .then(
        (createdResource) => {
          this.resource(createdResource);
          this.tabTitle(createdResource.id);

          this.node.id(createdResource.id);
          this.node.body(createdResource.body as string);
          this.node.triggerType(createdResource.triggerOperation);
          this.node.triggerOperation(createdResource.triggerOperation);
          TelemetryProcessor.traceSuccess(
            Action.UpdateTrigger,
            {
              dataExplorerArea: Constants.Areas.Tab,
              tabTitle: this.tabTitle(),
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
            Action.UpdateTrigger,
            {
              dataExplorerArea: Constants.Areas.Tab,
              tabTitle: this.tabTitle(),
              error: getErrorMessage(createError),
              errorStack: getErrorStack(createError),
            },
            startKey
          );
        }
      )
      .finally(() => this.isExecuting(false));
  };

  public setBaselines() {
    super.setBaselines();

    const resource = this.resource();
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

  private _createTrigger(resource: TriggerDefinition): Promise<TriggerDefinition & Resource> {
    this.isExecutionError(false);
    this.isExecuting(true);
    const startKey: number = TelemetryProcessor.traceStart(Action.CreateTrigger, {
      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: this.tabTitle(),
    });

    return createTrigger(this.collection.databaseId, this.collection.id(), resource)
      .then(
        (createdResource) => {
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
          editorModel.setValue(createdResource.body as string);
          this.editorContent.setBaseline(createdResource.body as string);

          this.node = this.collection.createTriggerNode(createdResource);
          TelemetryProcessor.traceSuccess(
            Action.CreateTrigger,
            {
              dataExplorerArea: Constants.Areas.Tab,
              tabTitle: this.tabTitle(),
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
              dataExplorerArea: Constants.Areas.Tab,
              tabTitle: this.tabTitle(),
              error: getErrorMessage(createError),
              errorStack: getErrorStack(createError),
            },
            startKey
          );
          return Promise.reject(createError);
        }
      )
      .finally(() => this.isExecuting(false));
  }

  private _getResource() {
    return {
      id: this.id(),
      body: this.editorContent(),
      triggerOperation: this.triggerOperation(),
      triggerType: this.triggerType(),
    };
  }
}
