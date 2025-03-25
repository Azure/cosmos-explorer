import { TriggerDefinition } from "@azure/cosmos";
import { Dropdown, IDropdownOption, Label, TextField } from "@fluentui/react";
import { KeyboardAction } from "KeyboardShortcuts";
import { ValidCosmosDbResourceIdDescription, ValidCosmosDbResourceIdRegex } from "Utils/ValidationUtils";
import React, { Component } from "react";
import DiscardIcon from "../../../images/discard.svg";
import SaveIcon from "../../../images/save-cosmos.svg";
import * as Constants from "../../Common/Constants";
import { getErrorMessage, getErrorStack } from "../../Common/ErrorHandlingUtils";
import { createTrigger } from "../../Common/dataAccess/createTrigger";
import { updateTrigger } from "../../Common/dataAccess/updateTrigger";
import * as ViewModels from "../../Contracts/ViewModels";
import { Action } from "../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { SqlTriggerResource } from "../../Utils/arm/generatedClients/cosmos/types";
import { CommandButtonComponentProps } from "../Controls/CommandButton/CommandButtonComponent";
import { EditorReact } from "../Controls/Editor/EditorReact";
import { useCommandBar } from "../Menus/CommandBar/CommandBarComponentAdapter";
import TriggerTab from "./TriggerTab";

const triggerTypeOptions: IDropdownOption[] = [
  { key: "Pre", text: "Pre" },
  { key: "Post", text: "Post" },
];

const triggerOperationOptions: IDropdownOption[] = [
  { key: "All", text: "All" },
  { key: "Create", text: "Create" },
  { key: "Delete", text: "Delete" },
  { key: "Replace", text: "Replace" },
];

interface Ibutton {
  visible: boolean;
  enabled: boolean;
}

interface ITriggerTabContentState {
  [key: string]: string | boolean;
  triggerId: string;
  triggerBody: string;
  triggerType?: "Pre" | "Post";
  triggerOperation?: "All" | "Create" | "Update" | "Delete" | "Replace";
  isIdEditable: boolean;
}

export class TriggerTabContent extends Component<TriggerTab, ITriggerTabContentState> {
  public saveButton: Ibutton;
  public updateButton: Ibutton;
  public discardButton: Ibutton;

  constructor(props: TriggerTab) {
    super(props);
    this.saveButton = {
      visible: props.isNew(),
      enabled: false,
    };
    this.updateButton = {
      visible: !props.isNew(),
      enabled: true,
    };

    this.discardButton = {
      visible: true,
      enabled: true,
    };

    const { id, body, triggerType, triggerOperation } = props.triggerOptions.resource;
    this.state = {
      triggerId: id,
      triggerType: triggerType,
      triggerOperation: triggerOperation,
      triggerBody: body,
      isIdEditable: props.isNew() ? true : false,
    };
  }

  private async onSaveClick(): Promise<void> {
    const { triggerId, triggerType, triggerBody, triggerOperation } = this.state;
    const resource = {
      id: triggerId,
      body: triggerBody,
      triggerOperation: triggerOperation,
      triggerType: triggerType,
    };

    this.props.isExecutionError(false);
    this.props.isExecuting(true);
    const startKey: number = TelemetryProcessor.traceStart(Action.CreateTrigger, {
      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: this.props.tabTitle(),
    });

    try {
      resource.body = String(resource.body); // Ensure trigger body is converted to string
      const createdResource: TriggerDefinition | SqlTriggerResource = await createTrigger(
        this.props.collection.databaseId,
        this.props.collection.id(),
        resource,
      );
      if (createdResource) {
        this.props.tabTitle(createdResource.id);
        this.props.isNew(false);
        this.props.resource(createdResource);
        this.props.editorContent.setBaseline(createdResource.body as string);
        this.props.addNodeInCollection(createdResource);
        this.saveButton.visible = false;
        this.updateButton.visible = true;
        this.setState({ isIdEditable: false });
        TelemetryProcessor.traceSuccess(
          Action.CreateTrigger,
          {
            dataExplorerArea: Constants.Areas.Tab,
            tabTitle: this.props.tabTitle(),
          },
          startKey,
        );
        this.props.editorState(ViewModels.ScriptEditorState.existingNoEdits);
        this.props.isExecuting(false);
      }
    } catch (createError) {
      this.props.isExecutionError(true);
      TelemetryProcessor.traceFailure(
        Action.CreateTrigger,
        {
          dataExplorerArea: Constants.Areas.Tab,
          tabTitle: this.props.tabTitle(),
          error: getErrorMessage(createError),
          errorStack: getErrorStack(createError),
        },
        startKey,
      );
      this.props.isExecuting(false);
    }
  }

  private async onUpdateClick(): Promise<void> {
    this.props.isExecutionError(false);
    this.props.isExecuting(true);
    const startKey: number = TelemetryProcessor.traceStart(Action.UpdateTrigger, {
      tabTitle: this.props.tabTitle(),
    });

    try {
      const { triggerId, triggerBody, triggerOperation, triggerType } = this.state;
      const createdResource = await updateTrigger(this.props.collection.databaseId, this.props.collection.id(), {
        id: triggerId,
        body: triggerBody,
        triggerOperation: triggerOperation as SqlTriggerResource["triggerOperation"],
        triggerType: triggerType as SqlTriggerResource["triggerType"],
      });
      if (createdResource) {
        this.props.resource(createdResource);
        this.props.tabTitle(createdResource.id);

        this.props.node.id(createdResource.id);
        this.props.node.body(createdResource.body as string);
        this.props.node.triggerType(createdResource.triggerType);
        this.props.node.triggerOperation(createdResource.triggerOperation);
        TelemetryProcessor.traceSuccess(
          Action.UpdateTrigger,
          {
            dataExplorerArea: Constants.Areas.Tab,
            tabTitle: this.props.tabTitle(),
          },
          startKey,
        );
        this.props.isExecuting(false);
      }
    } catch (createError) {
      this.props.isExecutionError(true);
      TelemetryProcessor.traceFailure(
        Action.UpdateTrigger,
        {
          dataExplorerArea: Constants.Areas.Tab,
          tabTitle: this.props.tabTitle(),
          error: getErrorMessage(createError),
          errorStack: getErrorStack(createError),
        },
        startKey,
      );
      this.props.isExecuting(false);
    }
  }

  private onDiscard(): void {
    const { id, body, triggerType, triggerOperation } = this.props.triggerOptions.resource;
    this.setState({
      triggerId: id,
      triggerType: triggerType,
      triggerOperation: triggerOperation,
      triggerBody: body,
    });
  }

  private isNotEmpty(value: string): boolean {
    return !!value;
  }

  componentDidUpdate(_prevProps: TriggerTab, prevState: ITriggerTabContentState): void {
    const { triggerBody, triggerId, triggerType, triggerOperation } = this.state;
    if (
      triggerId !== prevState.triggerId ||
      triggerBody !== prevState.triggerBody ||
      triggerType !== prevState.triggerType ||
      triggerOperation !== prevState.triggerOperation
    ) {
      useCommandBar.getState().setContextButtons(this.getTabsButtons());
    }
  }

  protected getTabsButtons(): CommandButtonComponentProps[] {
    const buttons: CommandButtonComponentProps[] = [];
    const label = "Save";
    if (this.saveButton.visible) {
      buttons.push({
        setState: this.setState,
        ...this,
        iconSrc: SaveIcon,
        iconAlt: label,
        keyboardAction: KeyboardAction.SAVE_ITEM,
        onCommandClick: this.onSaveClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.saveButton.enabled,
      });
    }

    if (this.updateButton.visible) {
      const label = "Update";
      buttons.push({
        ...this,
        iconSrc: SaveIcon,
        iconAlt: label,
        keyboardAction: KeyboardAction.SAVE_ITEM,
        onCommandClick: this.onUpdateClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.updateButton.enabled,
      });
    }

    if (this.discardButton.visible) {
      const label = "Discard";
      buttons.push({
        setState: this.setState,
        ...this,
        iconSrc: DiscardIcon,
        iconAlt: label,
        keyboardAction: KeyboardAction.CANCEL_OR_DISCARD,
        onCommandClick: this.onDiscard,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.discardButton.enabled,
      });
    }
    return buttons;
  }

  private handleTriggerIdChange = (
    _event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string,
  ): void => {
    const inputElement = _event.currentTarget as HTMLInputElement;
    let isValidId: boolean = true;
    if (inputElement) {
      isValidId = inputElement.reportValidity();
    }

    this.saveButton.enabled = this.isNotEmpty(newValue) && isValidId;
    this.setState({ triggerId: newValue });
  };

  private handleTriggerTypeOprationChange = (
    _event: React.FormEvent<HTMLElement>,
    selectedParam: IDropdownOption,
    key: string,
  ): void => {
    this.setState({ [key]: String(selectedParam.key) });
  };

  private handleTriggerBodyChange = (newContent: string) => {
    this.setState({ triggerBody: newContent });
  };

  render(): JSX.Element {
    const { triggerId, triggerType, triggerOperation, triggerBody, isIdEditable } = this.state;
    return (
      <div className="tab-pane flexContainer trigger-form" role="tabpanel">
        <TextField
          className="trigger-field"
          label="Trigger Id"
          id="entityTimeId"
          autoFocus
          required
          type="text"
          pattern={ValidCosmosDbResourceIdRegex.source}
          title={ValidCosmosDbResourceIdDescription}
          placeholder="Enter the new trigger id"
          size={40}
          value={triggerId}
          readOnly={!isIdEditable}
          onChange={this.handleTriggerIdChange}
        />
        <Dropdown
          placeholder="Trigger Type"
          label="Trigger Type"
          options={triggerTypeOptions}
          selectedKey={triggerType}
          className="trigger-field"
          onChange={(event, selectedKey) => this.handleTriggerTypeOprationChange(event, selectedKey, "triggerType")}
        />
        <Dropdown
          placeholder="Trigger Operation"
          label="Trigger Operation"
          selectedKey={triggerOperation}
          options={triggerOperationOptions}
          className="trigger-field"
          onChange={(event, selectedKey) =>
            this.handleTriggerTypeOprationChange(event, selectedKey, "triggerOperation")
          }
        />
        <Label className="trigger-field">Trigger Body</Label>
        <EditorReact
          language={"json"}
          content={triggerBody}
          isReadOnly={false}
          ariaLabel={"Graph JSON"}
          onContentChanged={this.handleTriggerBodyChange}
        />
      </div>
    );
  }
}
