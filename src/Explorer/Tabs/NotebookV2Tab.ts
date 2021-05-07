import { stringifyNotebook, toJS } from "@nteract/commutable";
import * as ko from "knockout";
import * as Q from "q";
import * as _ from "underscore";
import ClearAllOutputsIcon from "../../../images/notebook/Notebook-clear-all-outputs.svg";
import CopyIcon from "../../../images/notebook/Notebook-copy.svg";
import CutIcon from "../../../images/notebook/Notebook-cut.svg";
import NewCellIcon from "../../../images/notebook/Notebook-insert-cell.svg";
import PasteIcon from "../../../images/notebook/Notebook-paste.svg";
import RestartIcon from "../../../images/notebook/Notebook-restart.svg";
import RunAllIcon from "../../../images/notebook/Notebook-run-all.svg";
import RunIcon from "../../../images/notebook/Notebook-run.svg";
import { default as InterruptKernelIcon, default as KillKernelIcon } from "../../../images/notebook/Notebook-stop.svg";
import SaveIcon from "../../../images/save-cosmos.svg";
import { ArmApiVersions } from "../../Common/Constants";
import { configContext } from "../../ConfigContext";
import * as DataModels from "../../Contracts/DataModels";
import { useNotebookSnapshotStore } from "../../hooks/useNotebookSnapshotStore";
import { trackEvent } from "../../Shared/appInsights";
import { Action, ActionModifiers, Source } from "../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../UserContext";
import * as NotebookConfigurationUtils from "../../Utils/NotebookConfigurationUtils";
import { logConsoleInfo } from "../../Utils/NotificationConsoleUtils";
import { CommandButtonComponentProps } from "../Controls/CommandButton/CommandButtonComponent";
import * as CommandBarComponentButtonFactory from "../Menus/CommandBar/CommandBarComponentButtonFactory";
import { KernelSpecsDisplay } from "../Notebook/NotebookClientV2";
import * as CdbActions from "../Notebook/NotebookComponent/actions";
import { NotebookComponentAdapter } from "../Notebook/NotebookComponent/NotebookComponentAdapter";
import { CdbAppState, SnapshotRequest } from "../Notebook/NotebookComponent/types";
import { NotebookContentItem } from "../Notebook/NotebookContentItem";
import NotebookTabBase, { NotebookTabBaseOptions } from "./NotebookTabBase";

export interface NotebookTabOptions extends NotebookTabBaseOptions {
  notebookContentItem: NotebookContentItem;
}

export default class NotebookTabV2 extends NotebookTabBase {
  public readonly html = '<div data-bind="react:notebookComponentAdapter" style="height: 100%"></div>';
  public notebookPath: ko.Observable<string>;
  private selectedSparkPool: ko.Observable<string>;
  private notebookComponentAdapter: NotebookComponentAdapter;

  constructor(options: NotebookTabOptions) {
    super(options);

    this.container = options.container;
    this.notebookPath = ko.observable(options.notebookContentItem.path);
    this.container.notebookServerInfo.subscribe(() => logConsoleInfo("New notebook server info received."));
    this.notebookComponentAdapter = new NotebookComponentAdapter({
      contentItem: options.notebookContentItem,
      notebooksBasePath: this.container.getNotebookBasePath(),
      notebookClient: NotebookTabBase.clientManager,
      onUpdateKernelInfo: this.onKernelUpdate,
    });

    this.selectedSparkPool = ko.observable<string>(null);
    this.container &&
      this.container.arcadiaToken.subscribe(async () => {
        const currentKernel = this.notebookComponentAdapter.getCurrentKernelName();
        if (!currentKernel) {
          return;
        }
        await this.configureServiceEndpoints(currentKernel);
      });
  }

  public onCloseTabButtonClick(): Q.Promise<any> {
    const cleanup = () => {
      this.notebookComponentAdapter.notebookShutdown();
      super.onCloseTabButtonClick();
    };

    if (this.notebookComponentAdapter.isContentDirty()) {
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
  }

  public async reconfigureServiceEndpoints() {
    if (!this.notebookComponentAdapter) {
      return;
    }

    return await this.configureServiceEndpoints(this.notebookComponentAdapter.getCurrentKernelName());
  }

  protected getTabsButtons(): CommandButtonComponentProps[] {
    const availableKernels = NotebookTabV2.clientManager.getAvailableKernelSpecs();

    const saveLabel = "Save";
    const copyToLabel = "Copy to ...";
    const publishLabel = "Publish to gallery";
    const workspaceLabel = "No Workspace";
    const kernelLabel = "No Kernel";
    const runLabel = "Run";
    const runActiveCellLabel = "Run Active Cell";
    const runAllLabel = "Run All";
    const interruptKernelLabel = "Interrupt Kernel";
    const killKernelLabel = "Halt Kernel";
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

    const saveButtonChildren = [];
    if (this.container.notebookManager?.gitHubOAuthService.isLoggedIn()) {
      saveButtonChildren.push({
        iconName: "Copy",
        onCommandClick: () => this.copyNotebook(),
        commandButtonLabel: copyToLabel,
        hasPopup: false,
        disabled: false,
        ariaLabel: copyToLabel,
      });
    }

    saveButtonChildren.push({
      iconName: "PublishContent",
      onCommandClick: async () => await this.publishToGallery(),
      commandButtonLabel: publishLabel,
      hasPopup: false,
      disabled: false,
      ariaLabel: publishLabel,
    });

    let buttons: CommandButtonComponentProps[] = [
      {
        iconSrc: SaveIcon,
        iconAlt: saveLabel,
        onCommandClick: () => this.notebookComponentAdapter.notebookSave(),
        commandButtonLabel: saveLabel,
        hasPopup: false,
        disabled: false,
        ariaLabel: saveLabel,
        children: saveButtonChildren.length && [
          {
            iconName: "Save",
            onCommandClick: () => this.notebookComponentAdapter.notebookSave(),
            commandButtonLabel: saveLabel,
            hasPopup: false,
            disabled: false,
            ariaLabel: saveLabel,
          },
          ...saveButtonChildren,
        ],
      },
      {
        iconSrc: null,
        iconAlt: kernelLabel,
        onCommandClick: () => {},
        commandButtonLabel: null,
        hasPopup: false,
        disabled: availableKernels.length < 1,
        isDropdown: true,
        dropdownPlaceholder: kernelLabel,
        dropdownSelectedKey: this.notebookComponentAdapter.getSelectedKernelName(), //this.currentKernelName,
        dropdownWidth: 100,
        children: availableKernels.map(
          (kernel: KernelSpecsDisplay) =>
            ({
              iconSrc: null,
              iconAlt: kernel.displayName,
              onCommandClick: () => this.notebookComponentAdapter.notebookChangeKernel(kernel.name),
              commandButtonLabel: kernel.displayName,
              dropdownItemKey: kernel.name,
              hasPopup: false,
              disabled: false,
              ariaLabel: kernel.displayName,
            } as CommandButtonComponentProps)
        ),
        ariaLabel: kernelLabel,
      },
      {
        iconSrc: RunIcon,
        iconAlt: runLabel,
        onCommandClick: () => {
          this.notebookComponentAdapter.notebookRunAndAdvance();
          this.traceTelemetry(Action.ExecuteCell);
        },
        commandButtonLabel: runLabel,
        ariaLabel: runLabel,
        hasPopup: false,
        disabled: false,
        children: [
          {
            iconSrc: RunIcon,
            iconAlt: runActiveCellLabel,
            onCommandClick: () => {
              this.notebookComponentAdapter.notebookRunAndAdvance();
              this.traceTelemetry(Action.ExecuteCell);
            },
            commandButtonLabel: runActiveCellLabel,
            hasPopup: false,
            disabled: false,
            ariaLabel: runActiveCellLabel,
          },
          {
            iconSrc: RunAllIcon,
            iconAlt: runAllLabel,
            onCommandClick: () => {
              this.notebookComponentAdapter.notebookRunAll();
              this.traceTelemetry(Action.ExecuteAllCells);
            },
            commandButtonLabel: runAllLabel,
            hasPopup: false,
            disabled: false,
            ariaLabel: runAllLabel,
          },
          {
            iconSrc: InterruptKernelIcon,
            iconAlt: interruptKernelLabel,
            onCommandClick: () => this.notebookComponentAdapter.notebookInterruptKernel(),
            commandButtonLabel: interruptKernelLabel,
            hasPopup: false,
            disabled: false,
            ariaLabel: interruptKernelLabel,
          },
          {
            iconSrc: KillKernelIcon,
            iconAlt: killKernelLabel,
            onCommandClick: () => this.notebookComponentAdapter.notebookKillKernel(),
            commandButtonLabel: killKernelLabel,
            hasPopup: false,
            disabled: false,
            ariaLabel: killKernelLabel,
          },
          {
            iconSrc: RestartIcon,
            iconAlt: restartKernelLabel,
            onCommandClick: () => this.notebookComponentAdapter.notebookRestartKernel(),
            commandButtonLabel: restartKernelLabel,
            hasPopup: false,
            disabled: false,
            ariaLabel: restartKernelLabel,
          },
        ],
      },
      {
        iconSrc: ClearAllOutputsIcon,
        iconAlt: clearLabel,
        onCommandClick: () => this.notebookComponentAdapter.notebookClearAllOutputs(),
        commandButtonLabel: clearLabel,
        hasPopup: false,
        disabled: false,
        ariaLabel: clearLabel,
      },
      {
        iconSrc: NewCellIcon,
        iconAlt: newCellLabel,
        onCommandClick: () => this.notebookComponentAdapter.notebookInsertBelow(),
        commandButtonLabel: newCellLabel,
        ariaLabel: newCellLabel,
        hasPopup: false,
        disabled: false,
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
        dropdownSelectedKey: this.notebookComponentAdapter.getActiveCellTypeStr(),
        dropdownWidth: 110,
        children: [
          {
            iconSrc: null,
            iconAlt: null,
            onCommandClick: () => this.notebookComponentAdapter.notebookChangeCellType(cellCodeType),
            commandButtonLabel: codeLabel,
            ariaLabel: codeLabel,
            dropdownItemKey: cellCodeType,
            hasPopup: false,
            disabled: false,
          },
          {
            iconSrc: null,
            iconAlt: null,
            onCommandClick: () => this.notebookComponentAdapter.notebookChangeCellType(cellMarkdownType),
            commandButtonLabel: markdownLabel,
            ariaLabel: markdownLabel,
            dropdownItemKey: cellMarkdownType,
            hasPopup: false,
            disabled: false,
          },
          {
            iconSrc: null,
            iconAlt: null,
            onCommandClick: () => this.notebookComponentAdapter.notebookChangeCellType(cellRawType),
            commandButtonLabel: rawLabel,
            ariaLabel: rawLabel,
            dropdownItemKey: cellRawType,
            hasPopup: false,
            disabled: false,
          },
        ],
      },
      {
        iconSrc: CopyIcon,
        iconAlt: copyLabel,
        onCommandClick: () => this.notebookComponentAdapter.notebokCopy(),
        commandButtonLabel: copyLabel,
        ariaLabel: copyLabel,
        hasPopup: false,
        disabled: false,
        children: [
          {
            iconSrc: CopyIcon,
            iconAlt: copyLabel,
            onCommandClick: () => this.notebookComponentAdapter.notebokCopy(),
            commandButtonLabel: copyLabel,
            ariaLabel: copyLabel,
            hasPopup: false,
            disabled: false,
          },
          {
            iconSrc: CutIcon,
            iconAlt: cutLabel,
            onCommandClick: () => this.notebookComponentAdapter.notebookCut(),
            commandButtonLabel: cutLabel,
            ariaLabel: cutLabel,
            hasPopup: false,
            disabled: false,
          },
          {
            iconSrc: PasteIcon,
            iconAlt: pasteLabel,
            onCommandClick: () => this.notebookComponentAdapter.notebookPaste(),
            commandButtonLabel: pasteLabel,
            ariaLabel: pasteLabel,
            hasPopup: false,
            disabled: false,
          },
        ],
      },
      // TODO: Uncomment when undo/redo is reimplemented in nteract
    ];

    if (this.container.hasStorageAnalyticsAfecFeature()) {
      const arcadiaWorkspaceDropdown: CommandButtonComponentProps = {
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
          selectedSparkPool: this.selectedSparkPool(),
          workspaces: this.container.arcadiaWorkspaces(),
          onSparkPoolSelect: this.onSparkPoolSelect,
          onCreateNewWorkspaceClicked: () => {
            this.container.createWorkspace();
          },
          onCreateNewSparkPoolClicked: (workspaceResourceId: string) => {
            this.container.createSparkPool(workspaceResourceId);
          },
        },
      };
      buttons.splice(1, 0, arcadiaWorkspaceDropdown);
    }
    return buttons;
  }

  protected buildCommandBarOptions(): void {
    this.updateNavbarWithTabsButtons();
  }

  private onSparkPoolSelect = (evt: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>, item: any) => {
    if (!item || !item.text) {
      this.selectedSparkPool(null);
      return;
    }

    trackEvent(
      { name: "SparkPoolSelected" },
      {
        subscriptionId: userContext.subscriptionId,
        accountName: userContext.databaseAccount?.name,
        accountId: userContext.databaseAccount?.id,
      }
    );

    this.container &&
      this.container.arcadiaWorkspaces &&
      this.container.arcadiaWorkspaces() &&
      this.container.arcadiaWorkspaces().forEach(async (workspace) => {
        if (workspace && workspace.name && workspace.sparkPools) {
          const selectedPoolIndex = _.findIndex(workspace.sparkPools, (pool) => pool && pool.name === item.text);
          if (selectedPoolIndex >= 0) {
            const selectedPool = workspace.sparkPools[selectedPoolIndex];
            if (selectedPool && selectedPool.name) {
              this.container.sparkClusterConnectionInfo({
                userName: undefined,
                password: undefined,
                endpoints: [
                  {
                    endpoint: `https://${workspace.name}.${configContext.ARCADIA_LIVY_ENDPOINT_DNS_ZONE}/livyApi/versions/${ArmApiVersions.arcadiaLivy}/sparkPools/${selectedPool.name}/`,
                    kind: DataModels.SparkClusterEndpointKind.Livy,
                  },
                ],
              });
              this.selectedSparkPool(item.text);
              await this.reconfigureServiceEndpoints();
              this.container.sparkClusterConnectionInfo.valueHasMutated();
              return;
            }
          }
        }
      });
  };

  private onKernelUpdate = async () => {
    await this.configureServiceEndpoints(this.notebookComponentAdapter.getCurrentKernelName()).catch((reason) => {
      /* Erroring is ok here */
    });
    this.updateNavbarWithTabsButtons();
  };

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

  private publishToGallery = async () => {
    TelemetryProcessor.trace(Action.NotebooksGalleryClickPublishToGallery, ActionModifiers.Mark, {
      source: Source.CommandBarMenu,
    });

    const notebookReduxStore = NotebookTabV2.clientManager.getStore();
    const unsubscribe = notebookReduxStore.subscribe(() => {
      const cdbState = (notebookReduxStore.getState() as CdbAppState).cdb;
      useNotebookSnapshotStore.setState({
        snapshot: cdbState.notebookSnapshot?.imageSrc,
        error: cdbState.notebookSnapshotError,
      });
    });

    const notebookContent = this.notebookComponentAdapter.getContent();
    const notebookContentRef = this.notebookComponentAdapter.contentRef;
    const onPanelClose = (): void => {
      unsubscribe();
      useNotebookSnapshotStore.setState({
        snapshot: undefined,
        error: undefined,
      });
      notebookReduxStore.dispatch(CdbActions.takeNotebookSnapshot(undefined));
    };

    await this.container.publishNotebook(
      notebookContent.name,
      notebookContent.content,
      notebookContentRef,
      (request: SnapshotRequest) => notebookReduxStore.dispatch(CdbActions.takeNotebookSnapshot(request)),
      onPanelClose
    );
  };

  private copyNotebook = () => {
    const notebookContent = this.notebookComponentAdapter.getContent();
    let content: string;
    if (typeof notebookContent.content === "string") {
      content = notebookContent.content;
    } else {
      content = stringifyNotebook(toJS(notebookContent.content));
    }

    this.container.copyNotebook(notebookContent.name, content);
  };
}
