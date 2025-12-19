import { Resource, StoredProcedureDefinition } from "@azure/cosmos";
import { Pivot, PivotItem } from "@fluentui/react";
import { KeyboardAction } from "KeyboardShortcuts";
import { logConsoleInfo } from "Utils/NotificationConsoleUtils";
import { ValidCosmosDbIdDescription, ValidCosmosDbIdInputPattern } from "Utils/ValidationUtils";
import React from "react";
import ExecuteQueryIcon from "../../../../images/ExecuteQuery.svg";
import DiscardIcon from "../../../../images/discard.svg";
import SaveIcon from "../../../../images/save-cosmos.svg";
import { NormalizedEventKey } from "../../../Common/Constants";
import { createStoredProcedure } from "../../../Common/dataAccess/createStoredProcedure";
import { ExecuteSprocResult } from "../../../Common/dataAccess/executeStoredProcedure";
import { updateStoredProcedure } from "../../../Common/dataAccess/updateStoredProcedure";
import * as ViewModels from "../../../Contracts/ViewModels";
import { useNotificationConsole } from "../../../hooks/useNotificationConsole";
import { useTabs } from "../../../hooks/useTabs";
import { CommandButtonComponentProps } from "../../Controls/CommandButton/CommandButtonComponent";
import { EditorReact } from "../../Controls/Editor/EditorReact";
import Explorer from "../../Explorer";
import { useCommandBar } from "../../Menus/CommandBar/CommandBarComponentAdapter";
import StoredProcedure from "../../Tree/StoredProcedure";
import { useSelectedNode } from "../../useSelectedNode";
import ScriptTabBase from "../ScriptTabBase";

export interface IStorProcTabComponentAccessor {
  onExecuteSprocsResultEvent: (result: ExecuteSprocResult) => void;
  onExecuteSprocsErrorEvent: (error: string) => void;
  onTabClickEvent: () => void;
}

export interface Button {
  visible: boolean;
  enabled: boolean;
  isSelected?: boolean;
}

interface IStoredProcTabComponentStates {
  hasResults: boolean;
  hasErrors: boolean;
  error: string;
  resultData: string;
  logsData: string;
  originalSprocBody: string;
  initialEditorContent: string;
  sProcEditorContent: string;
  id: string;
  executeButton: Button;
  saveButton: Button;
  updateButton: Button;
  discardButton: Button;
}

export interface IStoredProcTabComponentProps {
  resource: StoredProcedureDefinition;
  isNew: boolean;
  tabKind: ViewModels.CollectionTabKind;
  title: string;
  tabPath: string;
  collectionBase: ViewModels.CollectionBase;
  //eslint-disable-next-line
  node?: any;
  scriptTabBaseInstance: ScriptTabBase;
  collection: ViewModels.Collection;
  iStorProcTabComponentAccessor: (instance: IStorProcTabComponentAccessor) => void;
  container: Explorer;
}

export default class StoredProcedureTabComponent extends React.Component<
  IStoredProcTabComponentProps,
  IStoredProcTabComponentStates
> {
  public node: StoredProcedure;
  public executeResultsEditorId: string;
  public executeLogsEditorId: string;
  public collection: ViewModels.Collection;

  constructor(
    public storedProcTabCompProps: IStoredProcTabComponentProps,
    private storedProcTabCompStates: IStoredProcTabComponentStates,
  ) {
    super(storedProcTabCompProps);
    this.state = {
      error: "",
      hasErrors: false,
      hasResults: false,
      resultData: "",
      logsData: "",
      originalSprocBody: this.props.resource.body.toString(),
      initialEditorContent: this.props.resource.body.toString(),
      sProcEditorContent: this.props.resource.body.toString(),
      id: this.props.resource.id,
      executeButton: {
        enabled: !this.props.scriptTabBaseInstance.isNew(),
        visible: true,
      },
      saveButton: {
        enabled: (() => {
          if (!this.props.scriptTabBaseInstance.formIsValid()) {
            return false;
          }
          if (!this.props.scriptTabBaseInstance.formIsDirty()) {
            return false;
          }
          return true;
        })(),
        visible: this.props.scriptTabBaseInstance.isNew(),
      },
      updateButton: {
        enabled: (() => {
          if (!this.props.scriptTabBaseInstance.formIsValid()) {
            return false;
          }
          if (!this.props.scriptTabBaseInstance.formIsDirty()) {
            return false;
          }
          return true;
        })(),
        visible: !this.props.scriptTabBaseInstance.isNew(),
      },
      discardButton: {
        enabled: (() => {
          if (!this.props.scriptTabBaseInstance.formIsValid()) {
            return false;
          }
          if (!this.props.scriptTabBaseInstance.formIsDirty()) {
            return false;
          }
          return true;
        })(),
        visible: true,
      },
    };

    this.collection = this.props.collection;
    this.executeResultsEditorId = `executestoredprocedureresults${this.props.scriptTabBaseInstance.tabId}`;
    this.executeLogsEditorId = `executestoredprocedurelogs${this.props.scriptTabBaseInstance.tabId}`;
    this.props.scriptTabBaseInstance.ariaLabel("Stored Procedure Body");

    this.props.iStorProcTabComponentAccessor({
      onExecuteSprocsResultEvent: this.onExecuteSprocsResult.bind(this),
      onExecuteSprocsErrorEvent: this.onExecuteSprocsError.bind(this),
      onTabClickEvent: this.onTabClick.bind(this),
    });

    this.node = this.props.node;

    this.buildCommandBarOptions();
  }

  public onTabClick(): void {
    if (useTabs.getState().openedTabs.length > 0) {
      useCommandBar.getState().setContextButtons(this.getTabsButtons());
    }
  }

  public onSaveClick = (): Promise<StoredProcedureDefinition & Resource> => {
    return this._createStoredProcedure({
      id: this.state.id,
      body: this.state.sProcEditorContent,
    });
  };

  public onDiscard = (): Promise<unknown> => {
    const onDiscardPromise = new Promise(() => {
      this.props.scriptTabBaseInstance.setBaselines();
      const original = this.props.scriptTabBaseInstance.editorContent.getEditableOriginalValue();
      if (this.state.updateButton.visible) {
        this.setState({
          updateButton: {
            enabled: false,
            visible: true,
          },
          sProcEditorContent: original,
          discardButton: {
            enabled: false,
            visible: true,
          },
          executeButton: {
            enabled: true,
            visible: true,
          },
        });
      } else {
        this.setState({
          saveButton: {
            enabled: false,
            visible: true,
          },
          sProcEditorContent: original,
          discardButton: {
            enabled: false,
            visible: true,
          },
          executeButton: {
            enabled: false,
            visible: true,
          },
          id: "",
        });
      }
    });

    setTimeout(() => {
      useCommandBar.getState().setContextButtons(this.getTabsButtons());
    }, 100);

    return onDiscardPromise;
  };

  public onUpdateClick = (): Promise<void> => {
    const data = this._getResource();

    this.props.scriptTabBaseInstance.isExecutionError(false);
    this.props.scriptTabBaseInstance.isExecuting(true);

    return updateStoredProcedure(
      this.props.scriptTabBaseInstance.collection.databaseId,
      this.props.scriptTabBaseInstance.collection.id(),
      data,
    )
      .then(
        (updatedResource) => {
          this.props.scriptTabBaseInstance.resource(updatedResource);
          this.props.scriptTabBaseInstance.tabTitle(updatedResource.id);
          this.node.id(updatedResource.id);
          this.node.body(updatedResource.body as string);
          this.props.scriptTabBaseInstance.setBaselines();

          const editorModel =
            this.props.scriptTabBaseInstance.editor() && this.props.scriptTabBaseInstance.editor().getModel();
          editorModel && editorModel.setValue(updatedResource.body as string);
          this.props.scriptTabBaseInstance.editorContent.setBaseline(updatedResource.body as string);
          this.setState({
            discardButton: {
              enabled: false,
              visible: true,
            },
            updateButton: {
              enabled: false,
              visible: true,
            },
            executeButton: {
              enabled: true,
              visible: true,
            },
          });
          useCommandBar.getState().setContextButtons(this.getTabsButtons());
        },
        () => {
          this.props.scriptTabBaseInstance.isExecutionError(true);
        },
      )
      .finally(() => this.props.scriptTabBaseInstance.isExecuting(false));
  };

  public onExecuteSprocsResult(result: ExecuteSprocResult): void {
    const resultData: string = this.props.scriptTabBaseInstance.renderObjectForEditor(result.result, undefined, 4);
    const scriptLogs: string = (result.scriptLogs && decodeURIComponent(result.scriptLogs)) || "";
    const logs: string = this.props.scriptTabBaseInstance.renderObjectForEditor(scriptLogs, undefined, 4);

    this.setState({
      hasResults: false,
    });
    setTimeout(() => {
      this.setState({
        error: undefined,
        resultData: resultData,
        logsData: logs,
        hasResults: resultData ? true : false,
        hasErrors: false,
      });
    }, 100);
  }

  public onExecuteSprocsError(error: string): void {
    this.props.scriptTabBaseInstance.isExecutionError(true);
    console.error(error);
    this.setState({
      error: error,
      hasErrors: true,
      hasResults: false,
    });
  }

  public onErrorDetailsClick = (): boolean => {
    useNotificationConsole.getState().expandConsole();

    return false;
  };

  public onErrorDetailsKeyPress = (event: React.KeyboardEvent<HTMLAnchorElement>): boolean => {
    if (event.key === NormalizedEventKey.Space || event.key === NormalizedEventKey.Enter) {
      this.onErrorDetailsClick();
      return false;
    }

    return true;
  };

  protected updateSelectedNode(): void {
    if (this.props.collectionBase === undefined) {
      return;
    }

    const database: ViewModels.Database = this.props.collectionBase.getDatabase();
    const setSelectedNode = useSelectedNode.getState().setSelectedNode;
    if (!database.isDatabaseExpanded()) {
      setSelectedNode(database);
    } else if (!this.props.collectionBase.isCollectionExpanded() || !this.collection.isStoredProceduresExpanded()) {
      setSelectedNode(this.props.collectionBase);
    } else {
      setSelectedNode(this.node);
    }
  }

  protected buildCommandBarOptions(): void {
    useCommandBar.getState().setContextButtons(this.getTabsButtons());
  }

  protected getTabsButtons(): CommandButtonComponentProps[] {
    const buttons: CommandButtonComponentProps[] = [];
    const label = "Save";
    if (this.state.saveButton.visible) {
      buttons.push({
        iconSrc: SaveIcon,
        iconAlt: label,
        keyboardAction: KeyboardAction.SAVE_ITEM,
        onCommandClick: this.onSaveClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.state.saveButton.enabled,
      });
    }

    if (this.state.updateButton.visible) {
      const label = "Update";
      buttons.push({
        iconSrc: SaveIcon,
        iconAlt: label,
        keyboardAction: KeyboardAction.SAVE_ITEM,
        onCommandClick: this.onUpdateClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.state.updateButton.enabled,
      });
    }

    if (this.state.discardButton.visible) {
      const label = "Discard";
      buttons.push({
        iconSrc: DiscardIcon,
        iconAlt: label,
        keyboardAction: KeyboardAction.CANCEL_OR_DISCARD,
        onCommandClick: this.onDiscard,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.state.discardButton.enabled,
      });
    }

    if (this.state.executeButton.visible) {
      const label = "Execute";
      buttons.push({
        iconSrc: ExecuteQueryIcon,
        iconAlt: label,
        keyboardAction: KeyboardAction.EXECUTE_ITEM,
        onCommandClick: () => {
          this.collection.container.openExecuteSprocParamsPanel(this.node);
        },
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.state.executeButton.enabled,
      });
    }

    return buttons;
  }

  private _getResource() {
    return {
      id: this.state.id,
      body: this.state.sProcEditorContent,
    };
  }

  private _createStoredProcedure(resource: StoredProcedureDefinition): Promise<StoredProcedureDefinition & Resource> {
    this.props.scriptTabBaseInstance.isExecutionError(false);
    this.props.scriptTabBaseInstance.isExecuting(true);

    return createStoredProcedure(this.props.collectionBase.databaseId, this.props.collectionBase.id(), resource)
      .then(
        (createdResource) => {
          this.props.scriptTabBaseInstance.tabTitle(createdResource.id);
          this.props.scriptTabBaseInstance.isNew(false);
          this.props.scriptTabBaseInstance.resource(createdResource);
          this.props.scriptTabBaseInstance.setBaselines();

          const editorModel =
            this.props.scriptTabBaseInstance.editor() && this.props.scriptTabBaseInstance.editor().getModel();
          editorModel && editorModel.setValue(createdResource.body as string);
          this.props.scriptTabBaseInstance.editorContent.setBaseline(createdResource.body as string);
          this.node = this.collection.createStoredProcedureNode(createdResource);
          this.props.scriptTabBaseInstance.node = this.node;
          useTabs.getState().updateTab(this.props.scriptTabBaseInstance);
          this.props.scriptTabBaseInstance.editorState(ViewModels.ScriptEditorState.existingNoEdits);

          this.setState({
            executeButton: {
              enabled: false,
              visible: true,
            },
          });
          setTimeout(() => {
            this.setState({
              executeButton: {
                enabled: true,
                visible: true,
              },
              updateButton: {
                enabled: false,
                visible: true,
              },
              saveButton: {
                enabled: false,
                visible: false,
              },
              discardButton: {
                enabled: false,
                visible: true,
              },
              sProcEditorContent: this.state.sProcEditorContent,
            });
            useCommandBar.getState().setContextButtons(this.getTabsButtons());
          }, 100);
          logConsoleInfo(`Sucessfully created stored procedure ${createdResource.id}`);
          return createdResource;
        },
        (createError) => {
          this.props.scriptTabBaseInstance.isExecutionError(true);

          return Promise.reject(createError);
        },
      )
      .finally(() => this.props.scriptTabBaseInstance.isExecuting(false));
  }

  public onDelete(): Promise<unknown> {
    const isDeleted = false;
    const onDeletePromise = new Promise((resolve) => {
      resolve(isDeleted);
    });
    return onDeletePromise;
  }

  public handleIdOnChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const isValidId: boolean = event.currentTarget.reportValidity();
    if (this.state.saveButton.visible) {
      this.setState({
        id: event.target.value,
        saveButton: {
          enabled: isValidId,
          visible: this.props.scriptTabBaseInstance.isNew(),
        },
        discardButton: {
          enabled: true,
          visible: true,
        },
      });
    }
    setTimeout(() => {
      useCommandBar.getState().setContextButtons(this.getTabsButtons());
    }, 1000);
  }

  public onChangeContent(newConent: string): void {
    if (this.state.updateButton.visible) {
      this.setState({
        updateButton: {
          enabled: true,
          visible: true,
        },
        discardButton: {
          enabled: true,
          visible: true,
        },
        executeButton: {
          enabled: false,
          visible: true,
        },
        sProcEditorContent: newConent,
      });
    } else {
      this.setState({
        saveButton: {
          enabled: false,
          visible: this.props.scriptTabBaseInstance.isNew(),
        },
        executeButton: {
          enabled: false,
          visible: true,
        },
        discardButton: {
          enabled: true,
          visible: true,
        },
        sProcEditorContent: newConent,
      });
    }

    setTimeout(() => {
      useCommandBar.getState().setContextButtons(this.getTabsButtons());
    }, 100);
  }

  render(): JSX.Element {
    return (
      <div className="tab-pane flexContainer stored-procedure-tab" role="tabpanel">
        <div className="storedTabForm flexContainer">
          <div className="formTitleFirst">
            Stored Procedure Id
            <span className="mandatoryStar" style={{ color: "#ff0707", fontSize: "14px", fontWeight: "bold" }}>
              *&nbsp;
            </span>
          </div>
          <span className="formTitleTextbox">
            <input
              className="formTree"
              type="text"
              required
              pattern={ValidCosmosDbIdInputPattern.source}
              title={ValidCosmosDbIdDescription}
              aria-label="Stored procedure id"
              placeholder="Enter the new stored procedure id"
              size={40}
              value={this.state.id}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => this.handleIdOnChange(event)}
            />
          </span>
          <div className="spUdfTriggerHeader">Stored Procedure Body</div>
          <EditorReact
            language={"javascript"}
            content={this.state.sProcEditorContent}
            isReadOnly={false}
            ariaLabel={"Stored procedure body"}
            lineNumbers={"on"}
            theme={"_theme"}
            onContentChanged={(newContent: string) => this.onChangeContent(newContent)}
          />
          {this.state.hasResults && (
            <div className="results-container">
              <Pivot aria-label="Successful execution of stored procedure" style={{ height: "100%" }}>
                <PivotItem
                  headerText="Result"
                  headerButtonProps={{
                    "data-order": 1,
                    "data-title": "Result",
                  }}
                  style={{ height: "100%" }}
                >
                  <EditorReact
                    language={"javascript"}
                    content={this.state.resultData}
                    isReadOnly={true}
                    ariaLabel={"Execute stored procedure result"}
                  />
                </PivotItem>
                <PivotItem
                  headerText="console.log"
                  headerButtonProps={{
                    "data-order": 2,
                    "data-title": "console.log",
                  }}
                  style={{ height: "100%" }}
                >
                  <EditorReact
                    language={"javascript"}
                    content={this.state.logsData}
                    isReadOnly={true}
                    ariaLabel={"Execute stored procedure logs"}
                  />
                </PivotItem>
              </Pivot>
            </div>
          )}
          {this.state.hasErrors && (
            <div className="errors-container">
              <div className="errors-header">Errors:</div>
              <div className="errorContent">
                <span className="errorMessage">{this.state.error}</span>
                <span className="errorDetailsLink">
                  <a
                    aria-label="Error details link"
                    onClick={() => this.onErrorDetailsClick()}
                    onKeyPress={(event: React.KeyboardEvent<HTMLAnchorElement>) => this.onErrorDetailsKeyPress(event)}
                  >
                    More details
                  </a>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}
