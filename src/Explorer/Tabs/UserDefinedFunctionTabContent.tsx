import { UserDefinedFunctionDefinition } from "@azure/cosmos";
import { Label, TextField } from "@fluentui/react";
import { FluentProvider, webDarkTheme, webLightTheme } from "@fluentui/react-components";
import { KeyboardAction } from "KeyboardShortcuts";
import { logConsoleInfo } from "Utils/NotificationConsoleUtils";
import { ValidCosmosDbIdDescription, ValidCosmosDbIdInputPattern } from "Utils/ValidationUtils";
import { useThemeStore } from "hooks/useTheme";
import React, { Component } from "react";
import DiscardIcon from "../../../images/discard.svg";
import SaveIcon from "../../../images/save-cosmos.svg";
import * as Constants from "../../Common/Constants";
import { getErrorMessage, getErrorStack } from "../../Common/ErrorHandlingUtils";
import { createUserDefinedFunction } from "../../Common/dataAccess/createUserDefinedFunction";
import { updateUserDefinedFunction } from "../../Common/dataAccess/updateUserDefinedFunction";
import * as ViewModels from "../../Contracts/ViewModels";
import { Action } from "../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { CommandButtonComponentProps } from "../Controls/CommandButton/CommandButtonComponent";
import { EditorReact } from "../Controls/Editor/EditorReact";
import { useCommandBar } from "../Menus/CommandBar/CommandBarComponentAdapter";
import UserDefinedFunctionTab from "./UserDefinedFunctionTab";
interface IUserDefinedFunctionTabContentState {
  udfId: string;
  udfBody: string;
  isUdfIdEditable: boolean;
}

interface Ibutton {
  visible: boolean;
  enabled: boolean;
}

export default class UserDefinedFunctionTabContent extends Component<
  UserDefinedFunctionTab,
  IUserDefinedFunctionTabContentState
> {
  public saveButton: Ibutton;
  public updateButton: Ibutton;
  public discardButton: Ibutton;

  constructor(props: UserDefinedFunctionTab) {
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

    const { id, body } = props.resource();
    this.state = {
      udfId: id,
      udfBody: body,
      isUdfIdEditable: props.isNew() ? true : false,
    };
  }

  private handleUdfIdChange = (
    _event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string,
  ): void => {
    const inputElement = _event.currentTarget as HTMLInputElement;
    let isValidId: boolean = true;
    if (inputElement) {
      isValidId = inputElement.reportValidity();
    }

    this.saveButton.enabled = this.isNotEmpty(newValue) && isValidId;
    this.setState({ udfId: newValue });
  };

  private handleUdfBodyChange = (newContent: string) => {
    this.setState({ udfBody: newContent });
  };

  protected getTabsButtons(): CommandButtonComponentProps[] {
    const buttons: CommandButtonComponentProps[] = [];
    const label = "Save";
    if (this.saveButton.visible) {
      buttons.push({
        ...this,
        setState: this.setState,
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

  private async onSaveClick(): Promise<void> {
    const { udfId, udfBody } = this.state;
    const resource: UserDefinedFunctionDefinition = {
      id: udfId,
      body: udfBody,
    };

    this.props.isExecutionError(false);
    this.props.isExecuting(true);
    const startKey: number = TelemetryProcessor.traceStart(Action.CreateUDF, {
      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: this.props.tabTitle(),
    });

    try {
      const createdResource = await createUserDefinedFunction(
        this.props.collection.databaseId,
        this.props.collection.id(),
        resource,
      );
      if (createdResource) {
        this.props.tabTitle(createdResource.id);
        this.props.isNew(false);
        this.updateButton.visible = true;
        this.saveButton.visible = false;
        this.props.resource(createdResource);
        this.props.addNodeInCollection(createdResource);
        this.setState({ isUdfIdEditable: false });
        this.props.isExecuting(false);
        TelemetryProcessor.traceSuccess(
          Action.CreateUDF,
          {
            dataExplorerArea: Constants.Areas.Tab,

            tabTitle: this.props.tabTitle(),
          },
          startKey,
        );
        this.props.editorState(ViewModels.ScriptEditorState.existingNoEdits);
        logConsoleInfo(`Sucessfully created user defined function ${createdResource.id}`);
      }
    } catch (createError) {
      this.props.isExecutionError(true);
      TelemetryProcessor.traceFailure(
        Action.CreateUDF,
        {
          dataExplorerArea: Constants.Areas.Tab,
          tabTitle: this.props.tabTitle(),
          error: getErrorMessage(createError),
          errorStack: getErrorStack(createError),
        },
        startKey,
      );
      this.props.isExecuting(false);
      return Promise.reject(createError);
    }
  }

  private async onUpdateClick(): Promise<void> {
    const { udfId, udfBody } = this.state;
    const resource: UserDefinedFunctionDefinition = {
      id: udfId,
      body: udfBody,
    };
    this.props.isExecutionError(false);
    this.props.isExecuting(true);
    const startKey: number = TelemetryProcessor.traceStart(Action.UpdateUDF, {
      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: this.props.tabTitle(),
    });

    try {
      const createdResource = await updateUserDefinedFunction(
        this.props.collection.databaseId,
        this.props.collection.id(),
        resource,
      );

      this.props.resource(createdResource);
      this.props.tabTitle(createdResource.id);
      this.props.updateNodeInCollection(createdResource);
      this.props.isExecuting(false);
      TelemetryProcessor.traceSuccess(
        Action.UpdateUDF,
        {
          dataExplorerArea: Constants.Areas.Tab,
          tabTitle: this.props.tabTitle(),
        },
        startKey,
      );

      this.props.editorContent.setBaseline(createdResource.body as string);
    } catch (createError) {
      this.props.isExecutionError(true);
      TelemetryProcessor.traceFailure(
        Action.UpdateUDF,
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
    const { id, body } = this.props.resource();
    this.setState({
      udfId: id,
      udfBody: body,
    });
  }

  private isNotEmpty(value: string): boolean {
    return !!value;
  }

  componentDidUpdate(_prevProps: UserDefinedFunctionTab, prevState: IUserDefinedFunctionTabContentState): void {
    const { udfBody, udfId } = this.state;
    if (udfId !== prevState.udfId || udfBody !== prevState.udfBody) {
      useCommandBar.getState().setContextButtons(this.getTabsButtons());
    }
  }

  render(): JSX.Element {
    const { udfId, udfBody, isUdfIdEditable } = this.state;
    const currentTheme = useThemeStore.getState().isDarkMode ? webDarkTheme : webLightTheme;
    return (
      <div className="tab-pane flexContainer trigger-form" role="tabpanel">
        <FluentProvider theme={currentTheme}>
          <TextField
            className="trigger-field"
            label="User Defined Function Id"
            id="entityTimeId"
            autoFocus
            required
            readOnly={!isUdfIdEditable}
            type="text"
            pattern={ValidCosmosDbIdInputPattern.source}
            title={ValidCosmosDbIdDescription}
            placeholder="Enter the new user defined function id"
            size={40}
            value={udfId}
            onChange={this.handleUdfIdChange}
            styles={{
              root: {
                width: "40%",
                marginTop: "10px",
              },
              fieldGroup: {
                backgroundColor: "var(--colorNeutralBackground1)",
                border: "1px solid var(--colorNeutralStroke1)",
              },
              field: {
                color: "var(--colorNeutralForeground2)",
              },
              subComponentStyles: {
                label: {
                  root: {
                    color: "var(--colorNeutralForeground1)",
                  },
                },
              },
            }}
          />{" "}
        </FluentProvider>
        <Label className="trigger-field">User Defined Function Body</Label>
        <EditorReact
          language={"javascript"}
          content={udfBody}
          isReadOnly={false}
          ariaLabel={"User defined function body"}
          onContentChanged={this.handleUdfBodyChange}
        />
      </div>
    );
  }
}
