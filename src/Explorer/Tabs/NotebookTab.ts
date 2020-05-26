import * as Q from "q";
import * as ko from "knockout";
import * as ViewModels from "../../Contracts/ViewModels";
import * as DataModels from "../../Contracts/DataModels";
import TabsBase from "./TabsBase";

import NewCellIcon from "../../../images/notebook/Notebook-insert-cell.svg";
import CutIcon from "../../../images/notebook/Notebook-cut.svg";
import CopyIcon from "../../../images/notebook/Notebook-copy.svg";
import PasteIcon from "../../../images/notebook/Notebook-paste.svg";
import RunIcon from "../../../images/notebook/Notebook-run.svg";
import RunAllIcon from "../../../images/notebook/Notebook-run-all.svg";
import RestartIcon from "../../../images/notebook/Notebook-restart.svg";
import SaveIcon from "../../../images/save-cosmos.svg";
import ClearAllOutputsIcon from "../../../images/notebook/Notebook-clear-all-outputs.svg";
import UndoIcon from "../../../images/notebook/Notebook-undo.svg";
import RedoIcon from "../../../images/notebook/Notebook-redo.svg";
import { CommandBarComponentButtonFactory } from "../Menus/CommandBar/CommandBarComponentButtonFactory";
import { NotebookAppMessageHandler } from "../Controls/Notebook/NotebookAppMessageHandler";
import * as NotebookAppContracts from "../../Terminal/NotebookAppContracts";
import { ConsoleDataType } from "../Menus/NotificationConsole/NotificationConsoleComponent";
import { isInvalidParentFrameOrigin } from "../../Utils/MessageValidation";
import { NotificationConsoleUtils } from "../../Utils/NotificationConsoleUtils";
import { NotebookTerminalComponent } from "../Controls/Notebook/NotebookTerminalComponent";
import { NotebookConfigurationUtils } from "../../Utils/NotebookConfigurationUtils";
import { NotebookContentItem } from "../Notebook/NotebookContentItem";

interface Kernel {
  name: string;
  displayName: string;
}

export default class NotebookTab extends TabsBase implements ViewModels.Tab {
  private notebookAppIFrameSrc: ko.Computed<string>;
  private container: ViewModels.Explorer;
  public notebookPath: ko.Observable<string>;
  private messageListener: (ev: MessageEvent) => any;
  private activeCellTypeStr: string;
  private notebookContainerId: string;
  private currentKernelName: string;
  private availableKernels: Kernel[];
  private messageHandler: NotebookAppMessageHandler;
  private notificationProgressId: string;
  private isSwitchingKernels: ko.Observable<boolean>;

  constructor(options: ViewModels.NotebookTabOptions) {
    super(options);
    this.availableKernels = [];
    this.isSwitchingKernels = ko.observable<boolean>(false);
    this.messageListener = async (ev: MessageEvent) => {
      if (isInvalidParentFrameOrigin(ev)) {
        return;
      }

      const msg: NotebookAppContracts.FromNotebookMessage = ev.data;

      if (msg.actionType === NotebookAppContracts.ActionTypes.Response) {
        this.messageHandler.handleCachedDataMessage(msg);
      } else if (msg.actionType === NotebookAppContracts.ActionTypes.Update) {
        const updateMessage = msg.message as NotebookAppContracts.FromNotebookUpdateMessage;
        switch (updateMessage.type) {
          case NotebookAppContracts.NotebookUpdateTypes.ActiveCellType:
            this.activeCellTypeStr = updateMessage.arg;
            this.updateNavbarWithTabsButtons();
            break;
          case NotebookAppContracts.NotebookUpdateTypes.KernelChange:
            this.isSwitchingKernels(false);
            this.currentKernelName = updateMessage.arg;
            this.messageHandler
              .sendCachedDataMessage<NotebookAppContracts.KernelSpecs>(NotebookAppContracts.MessageTypes.KernelList)
              .then(specs => {
                this.availableKernels = Object.keys(specs.kernelSpecs)
                  .map((name: string) => ({ name: name, displayName: specs.kernelSpecs[name].displayName }))
                  .sort((a: NotebookAppContracts.KernelOption, b: NotebookAppContracts.KernelOption) => {
                    // Put default at the top, otherwise lexicographically compare
                    if (a.name === specs.defaultName) {
                      return -1;
                    } else if (b.name === specs.defaultName) {
                      return 1;
                    } else {
                      return a.displayName.localeCompare(b.displayName);
                    }
                  });
                this.updateNavbarWithTabsButtons();
              });

            this.updateNavbarWithTabsButtons();
            await this.configureServiceEndpoints(this.currentKernelName);
            break;
          case NotebookAppContracts.NotebookUpdateTypes.ClickEvent:
            this.simulateClick();
            break;
          case NotebookAppContracts.NotebookUpdateTypes.SessionStatusChange: {
            this.handleSessionStateChange(updateMessage.arg as NotebookAppContracts.KernelStatusStates);
            break;
          }
          default:
            console.error("Unknown command", updateMessage);
            break;
        }
      }
    };

    super.onTemplateReady((isTemplateReady: boolean) => {
      if (isTemplateReady) {
        window.addEventListener("message", this.messageListener, false);

        const iFrame: HTMLIFrameElement = document.getElementById(this.notebookContainerId) as HTMLIFrameElement;
        this.messageHandler = new NotebookAppMessageHandler(iFrame.contentWindow);

        this.sendMessageToNotebook(NotebookAppContracts.MessageTypes.Status);
      }
    });
    this.container = options.container;

    this.notebookAppIFrameSrc = ko.computed<string>(() =>
      NotebookTerminalComponent.createNotebookAppSrc(
        this.container.notebookServerInfo(),
        new Map<string, string>([["notebookpath", options.notebookContentItem.path]])
      )
    );
    this.notebookPath = ko.observable(options.notebookContentItem.path);

    this.notebookContainerId = `notebookContainer-${this.tabId}`;

    this.container.notebookServerInfo.subscribe((newValue: DataModels.NotebookWorkspaceConnectionInfo) => {
      NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Info, "New notebook server info received.");
    });

    this.container &&
      this.container.arcadiaToken.subscribe(async () => {
        const currentKernel = this.currentKernelName;
        if (!currentKernel) {
          return;
        }
        await this.configureServiceEndpoints(currentKernel);
      });
  }

  public onCloseTabButtonClick(): Q.Promise<any> {
    const cleanup = () => {
      this.sendMessageToNotebook(NotebookAppContracts.MessageTypes.Shutdown);
      window.removeEventListener("message", this.messageListener);
      this.isActive(false);
      super.onCloseTabButtonClick();
    };

    return this.sendMessageToNotebook(NotebookAppContracts.MessageTypes.IsDirty).then((isDirty: boolean) => {
      if (isDirty) {
        this.container.showOkCancelModalDialog(
          "Close without saving?",
          `File has unsaved changes, close without saving?`,
          "Close",
          cleanup,
          "Cancel",
          undefined
        );
        return Q.resolve(null);
      } else {
        cleanup();
        return Q.resolve(null);
      }
    });
  }

  public onActivate(): Q.Promise<any> {
    if (this.messageHandler) {
      this.sendMessageToNotebook(NotebookAppContracts.MessageTypes.Status);
    }
    return super.onActivate();
  }

  public async reconfigureServiceEndpoints() {
    return await this.configureServiceEndpoints(this.currentKernelName);
  }

  private handleSessionStateChange(state: NotebookAppContracts.KernelStatusStates) {
    switch (state) {
      case "reconnecting":
        this.clearProgressNotification();
        this.notificationProgressId = NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.InProgress,
          "Connection with Notebook Server lost. Reconnecting..."
        );
        break;
      case "dead":
        // This happens when the jupyter server detects that the kernel to which the cell was connected is no longer alive.
        // It can be caused by the jupyter server going down and back up again and informing the client that the kernel to which
        // it was previously connected to doesn't exist anymore. Send a restart kernel command.
        if (!this.isSwitchingKernels()) {
          this.notificationProgressId = NotificationConsoleUtils.logConsoleMessage(
            ConsoleDataType.InProgress,
            "Connection with Notebook Server dead. Trying to reconnect..."
          );
          this.sendMessageToNotebook(NotebookAppContracts.MessageTypes.RestartKernel);
        }
        break;
      case "connected":
        this.clearProgressNotification();
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Info,
          "Connection with Notebook Server established."
        );
        break;
      default:
        this.clearProgressNotification();
        break;
    }
  }

  private clearProgressNotification() {
    if (this.notificationProgressId) {
      NotificationConsoleUtils.clearInProgressMessageWithId(this.notificationProgressId);
      this.notificationProgressId = undefined;
    }
  }

  private static isUntitledNotebook(notebookFile: NotebookContentItem): boolean {
    return notebookFile.name.indexOf("Untitled") === 0;
  }

  protected getContainer(): ViewModels.Explorer {
    return this.container;
  }

  protected getTabsButtons(): ViewModels.NavbarButtonConfig[] {
    const saveLabel = "Save";
    const workspaceLabel = "Workspace";
    const kernelLabel = "Kernel";
    const runLabel = "Run";
    const runActiveCellLabel = "Run Active Cell";
    const runAllLabel = "Run All";
    const restartKernelLabel = "Restart Kernel";
    const clearLabel = "Clear outputs";
    const newCellLabel = "New Cell";
    const cellTypeLabel = "Cell Type";
    const codeLabel = "Code";
    const markdownLabel = "Markdown";
    const rawLabel = "Raw";
    const copyLabel = "Copy";
    const cutLabel = "Cut";
    const pasteLabel = "Paste";
    const undoLabel = "Undo";
    const redoLabel = "Redo";
    const cellCodeType = "code";
    const cellMarkdownType = "markdown";
    const cellRawType = "raw";
    let buttons: ViewModels.NavbarButtonConfig[] = [
      {
        iconSrc: SaveIcon,
        iconAlt: saveLabel,
        onCommandClick: () =>
          this.sendMessageToNotebook(
            NotebookAppContracts.MessageTypes.Save
          ).then((result: NotebookAppContracts.ContentItem) =>
            NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Info, `File "${result.name}" was saved.`)
          ),
        commandButtonLabel: saveLabel,
        hasPopup: false,
        disabled: false,
        ariaLabel: saveLabel
      },
      {
        iconSrc: null,
        iconAlt: kernelLabel,
        onCommandClick: () => {},
        commandButtonLabel: null,
        hasPopup: false,
        disabled: this.availableKernels.length < 1,
        isDropdown: true,
        dropdownPlaceholder: kernelLabel,
        dropdownSelectedKey: this.currentKernelName,
        dropdownWidth: 100,
        children: this.availableKernels.map((kernel: { name: string; displayName: string }) => ({
          iconSrc: null,
          iconAlt: kernel.displayName,
          onCommandClick: () => {
            this.isSwitchingKernels(true);
            this.sendMessageToNotebook(NotebookAppContracts.MessageTypes.ChangeKernel, kernel.name);
          },
          commandButtonLabel: kernel.displayName,
          dropdownItemKey: kernel.name,
          hasPopup: false,
          disabled: false,
          ariaLabel: kernel.displayName
        })),
        ariaLabel: kernelLabel
      },
      {
        iconSrc: RunIcon,
        iconAlt: runLabel,
        onCommandClick: () => this.sendMessageToNotebook(NotebookAppContracts.MessageTypes.RunAndAdvance),
        commandButtonLabel: runLabel,
        ariaLabel: runLabel,
        hasPopup: false,
        disabled: false,
        children: [
          {
            iconSrc: RunIcon,
            iconAlt: runActiveCellLabel,
            onCommandClick: () => this.sendMessageToNotebook(NotebookAppContracts.MessageTypes.RunAndAdvance),
            commandButtonLabel: runActiveCellLabel,
            hasPopup: false,
            disabled: false,
            ariaLabel: runActiveCellLabel
          },
          {
            iconSrc: RunAllIcon,
            iconAlt: runAllLabel,
            onCommandClick: () => this.sendMessageToNotebook(NotebookAppContracts.MessageTypes.RunAll),
            commandButtonLabel: runAllLabel,
            hasPopup: false,
            disabled: false,
            ariaLabel: runAllLabel
          },
          // {
          //   iconSrc: null,
          //   onCommandClick: () => this.postMessage("switchKernel"),
          //   commandButtonLabel: "Switch Kernel",
          //   hasPopup: false,
          //   disabled: false
          // },
          {
            iconSrc: RestartIcon,
            iconAlt: restartKernelLabel,
            onCommandClick: () =>
              this.sendMessageToNotebook(NotebookAppContracts.MessageTypes.RestartKernel).then(
                (isSuccessful: boolean) => {
                  // Note: don't handle isSuccessful === false as it gets triggered if user cancels kernel restart modal dialog
                  if (isSuccessful) {
                    NotificationConsoleUtils.logConsoleMessage(
                      ConsoleDataType.Info,
                      "Kernel was successfully restarted"
                    );
                  }
                }
              ),
            commandButtonLabel: restartKernelLabel,
            hasPopup: false,
            disabled: false,
            ariaLabel: restartKernelLabel
          }
        ]
      },
      {
        iconSrc: ClearAllOutputsIcon,
        iconAlt: clearLabel,
        onCommandClick: () => this.sendMessageToNotebook(NotebookAppContracts.MessageTypes.ClearAllOutputs),
        commandButtonLabel: clearLabel,
        hasPopup: false,
        disabled: false,
        ariaLabel: clearLabel
      },
      {
        iconSrc: NewCellIcon,
        iconAlt: newCellLabel,
        onCommandClick: () => this.sendMessageToNotebook(NotebookAppContracts.MessageTypes.InsertBelow),
        commandButtonLabel: newCellLabel,
        ariaLabel: newCellLabel,
        hasPopup: false,
        disabled: false
      },
      CommandBarComponentButtonFactory.createDivider(),
      {
        iconSrc: null,
        iconAlt: null,
        onCommandClick: () => {},
        commandButtonLabel: null,
        ariaLabel: cellTypeLabel,
        hasPopup: false,
        disabled: false,
        isDropdown: true,
        dropdownPlaceholder: cellTypeLabel,
        dropdownSelectedKey: this.activeCellTypeStr,
        dropdownWidth: 110,
        children: [
          {
            iconSrc: null,
            iconAlt: null,
            onCommandClick: () =>
              this.sendMessageToNotebook(NotebookAppContracts.MessageTypes.ChangeCellType, cellCodeType),
            commandButtonLabel: codeLabel,
            ariaLabel: codeLabel,
            dropdownItemKey: cellCodeType,
            hasPopup: false,
            disabled: false
          },
          {
            iconSrc: null,
            iconAlt: null,
            onCommandClick: () =>
              this.sendMessageToNotebook(NotebookAppContracts.MessageTypes.ChangeCellType, cellMarkdownType),
            commandButtonLabel: markdownLabel,
            ariaLabel: markdownLabel,
            dropdownItemKey: cellMarkdownType,
            hasPopup: false,
            disabled: false
          },
          {
            iconSrc: null,
            iconAlt: null,
            onCommandClick: () =>
              this.sendMessageToNotebook(NotebookAppContracts.MessageTypes.ChangeCellType, cellRawType),
            commandButtonLabel: rawLabel,
            ariaLabel: rawLabel,
            dropdownItemKey: cellRawType,
            hasPopup: false,
            disabled: false
          }
        ]
      },
      {
        iconSrc: CopyIcon,
        iconAlt: copyLabel,
        onCommandClick: () => this.sendMessageToNotebook(NotebookAppContracts.MessageTypes.Copy),
        commandButtonLabel: copyLabel,
        ariaLabel: copyLabel,
        hasPopup: false,
        disabled: false,
        children: [
          {
            iconSrc: CopyIcon,
            iconAlt: copyLabel,
            onCommandClick: () => this.sendMessageToNotebook(NotebookAppContracts.MessageTypes.Copy),
            commandButtonLabel: copyLabel,
            ariaLabel: copyLabel,
            hasPopup: false,
            disabled: false
          },
          {
            iconSrc: CutIcon,
            iconAlt: cutLabel,
            onCommandClick: () => this.sendMessageToNotebook(NotebookAppContracts.MessageTypes.Cut),
            commandButtonLabel: cutLabel,
            ariaLabel: cutLabel,
            hasPopup: false,
            disabled: false
          },
          {
            iconSrc: PasteIcon,
            iconAlt: pasteLabel,
            onCommandClick: () => this.sendMessageToNotebook(NotebookAppContracts.MessageTypes.Paste),
            commandButtonLabel: pasteLabel,
            ariaLabel: pasteLabel,
            hasPopup: false,
            disabled: false
          }
        ]
      },
      {
        iconSrc: UndoIcon,
        iconAlt: undoLabel,
        onCommandClick: () => this.sendMessageToNotebook(NotebookAppContracts.MessageTypes.Undo),
        commandButtonLabel: undoLabel,
        ariaLabel: undoLabel,
        hasPopup: false,
        disabled: false,
        children: [
          {
            iconSrc: UndoIcon,
            iconAlt: undoLabel,
            onCommandClick: () => this.sendMessageToNotebook(NotebookAppContracts.MessageTypes.Undo),
            commandButtonLabel: undoLabel,
            ariaLabel: undoLabel,
            hasPopup: false,
            disabled: false
          },
          {
            iconSrc: RedoIcon,
            iconAlt: redoLabel,
            onCommandClick: () => this.sendMessageToNotebook(NotebookAppContracts.MessageTypes.Redo),
            commandButtonLabel: redoLabel,
            ariaLabel: redoLabel,
            hasPopup: false,
            disabled: false
          }
        ]
      }
    ];

    if (this.container.hasStorageAnalyticsAfecFeature()) {
      const arcadiaWorkspaceDropdown: ViewModels.NavbarButtonConfig = {
        iconSrc: null,
        iconAlt: workspaceLabel,
        ariaLabel: workspaceLabel,
        onCommandClick: () => {},
        commandButtonLabel: null,
        hasPopup: false,
        disabled: this.container.arcadiaWorkspaces.length < 1,
        isDropdown: false,
        isArcadiaPicker: true,
        arcadiaProps: {
          selectedSparkPool: null,
          workspaces: this.container.arcadiaWorkspaces(),
          onSparkPoolSelect: () => {},
          onCreateNewWorkspaceClicked: () => {
            this.container.createWorkspace();
          },
          onCreateNewSparkPoolClicked: (workspaceResourceId: string) => {
            this.container.createSparkPool(workspaceResourceId);
          }
        }
      };
      buttons.splice(1, 0, arcadiaWorkspaceDropdown);
    }
    return buttons;
  }

  protected buildCommandBarOptions(): void {
    this.updateNavbarWithTabsButtons();
  }

  private async configureServiceEndpoints(kernelName: string) {
    const notebookConnectionInfo = this.container && this.container.notebookServerInfo();
    const sparkClusterConnectionInfo = this.container && this.container.sparkClusterConnectionInfo();
    await NotebookConfigurationUtils.configureServiceEndpoints(
      this.notebookPath(),
      notebookConnectionInfo,
      kernelName,
      sparkClusterConnectionInfo
    );
  }

  private sendMessageToNotebook(type: NotebookAppContracts.MessageTypes, arg?: string): Q.Promise<any> {
    return this.messageHandler.sendCachedDataMessage(type, arg);
  }

  /**
   * The iframe swallows any click event which breaks the logic to dismiss the menu, so we simulate a click from the message
   */
  private simulateClick() {
    if (!this.tabId) {
      return;
    }
    const event = document.createEvent("Events");
    event.initEvent("click", true, false);
    document.getElementById(this.tabId).dispatchEvent(event);
  }
}
