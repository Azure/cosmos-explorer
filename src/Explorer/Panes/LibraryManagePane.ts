import * as ko from "knockout";
import * as Constants from "../../Common/Constants";
import * as ViewModels from "../../Contracts/ViewModels";
import * as ErrorParserUtility from "../../Common/ErrorParserUtility";
import TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { Action } from "../../Shared/Telemetry/TelemetryConstants";
import { ConsoleDataType } from "../Menus/NotificationConsole/NotificationConsoleComponent";
import { ContextualPaneBase } from "./ContextualPaneBase";
import { LibraryManageComponentAdapter } from "../Controls/LibraryManagement/LibraryManageComponentAdapter";
import {
  LibraryManageComponentProps,
  LibraryAddNameTextFieldProps,
  LibraryAddUrlTextFieldProps,
  LibraryAddButtonProps,
  LibraryManageGridProps,
} from "../Controls/LibraryManagement/LibraryManage";
import { Library } from "../../Contracts/DataModels";
import * as Logger from "../../Common/Logger";
import { NotificationConsoleUtils } from "../../Utils/NotificationConsoleUtils";

export class LibraryManagePane extends ContextualPaneBase {
  public libraryManageComponentAdapter: LibraryManageComponentAdapter;

  private _libraryManageProps: ko.Observable<LibraryManageComponentProps>;
  private _libraryManageStates: { isNameValid: boolean; isUrlValid: boolean };

  constructor(options: ViewModels.PaneOptions) {
    super(options);
    this.title("Libraries");

    this._libraryManageStates = {
      isNameValid: true,
      isUrlValid: true,
    };
    this._libraryManageProps = ko.observable<LibraryManageComponentProps>({
      addProps: {
        nameProps: {
          libraryName: "",
          onLibraryNameChange: this._onLibraryNameChange,
          onLibraryNameValidated: this._onLibraryNameValidated,
        },
        urlProps: {
          libraryAddress: "",
          onLibraryAddressChange: this._onLibraryAddressChange,
          onLibraryAddressValidated: this._onLibraryAddressValidated,
        },
        buttonProps: {
          disabled: false,
          onLibraryAddClick: this._onLibraryAddClick,
        },
      },
      gridProps: {
        items: [],
        onLibraryDeleteClick: this._onLibraryDeleteClick,
      },
    });
    this.libraryManageComponentAdapter = new LibraryManageComponentAdapter();
    this.libraryManageComponentAdapter.parameters = this._libraryManageProps;

    this.resetData();
  }

  public open(): void {
    const resourceId: string = this.container.databaseAccount() && this.container.databaseAccount().id;
    this._getLibraries(resourceId).then(
      (libraries: Library[]) => {
        this._updateLibraryManageComponentProps(null, null, null, {
          items: libraries,
        });
      },
      (reason) => {
        const parsedError = ErrorParserUtility.parse(reason);
        this.formErrors(parsedError[0].message);
      }
    );
    super.open();
  }

  public submit(): void {
    // override default behavior because this is not a form
  }

  private _updateLibraryManageComponentProps(
    newNameProps?: Partial<LibraryAddNameTextFieldProps>,
    newUrlProps?: Partial<LibraryAddUrlTextFieldProps>,
    newButtonProps?: Partial<LibraryAddButtonProps>,
    newGridProps?: Partial<LibraryManageGridProps>
  ): void {
    let {
      addProps: { buttonProps, nameProps, urlProps },
      gridProps,
    } = this._libraryManageProps();
    if (newNameProps) {
      nameProps = { ...nameProps, ...newNameProps };
    }
    if (newUrlProps) {
      urlProps = { ...urlProps, ...newUrlProps };
    }
    if (newButtonProps) {
      buttonProps = { ...buttonProps, ...newButtonProps };
    }
    if (newGridProps) {
      gridProps = { ...gridProps, ...newGridProps };
    }
    this._libraryManageProps({
      addProps: {
        nameProps,
        urlProps,
        buttonProps,
      },
      gridProps,
    });
    this._libraryManageProps.valueHasMutated();
  }

  private _onLibraryNameChange = (libraryName: string): void => {
    this._updateLibraryManageComponentProps({ libraryName });
  };

  private _onLibraryNameValidated = (errorMessage: string): void => {
    this._libraryManageStates.isNameValid = !errorMessage;
    this._validateAddButton();
  };

  private _onLibraryAddressChange = (libraryAddress: string): void => {
    this._updateLibraryManageComponentProps(null, {
      libraryAddress,
    });

    if (!this._libraryManageProps().addProps.nameProps.libraryName) {
      const parsedLibraryAddress = this._parseLibraryUrl(libraryAddress);
      if (!parsedLibraryAddress) {
        return;
      }

      let libraryName = this._sanitizeLibraryName(parsedLibraryAddress[2]);
      this._updateLibraryManageComponentProps({ libraryName });
    }
  };

  private _sanitizeLibraryName = (libraryName: string): string => {
    const invalidCharRegex = /[^a-zA-Z0-9-]/gm;
    return libraryName
      .replace(invalidCharRegex, "-")
      .substring(0, Math.min(Constants.SparkLibrary.nameMaxLength, libraryName.length));
  };

  private _onLibraryAddressValidated = (errorMessage: string): void => {
    this._libraryManageStates.isUrlValid = !errorMessage;
    this._validateAddButton();
  };

  private _validateAddButton = (): void => {
    const isValid = this._libraryManageStates.isNameValid && this._libraryManageStates.isUrlValid;
    const isUploadDisabled = this._libraryManageProps().addProps.buttonProps.disabled;
    if (isValid === isUploadDisabled) {
      this._updateLibraryManageComponentProps(null, null, {
        disabled: !isUploadDisabled,
      });
    }
  };

  private _onLibraryDeleteClick = (libraryName: string): void => {
    const resourceId: string = this.container.databaseAccount() && this.container.databaseAccount().id;
    this.isExecuting(true);
    this._deleteLibrary(resourceId, libraryName).then(
      () => {
        this.isExecuting(false);
        const items = this._libraryManageProps().gridProps.items.filter((lib) => lib.name !== libraryName);
        this._updateLibraryManageComponentProps(null, null, null, {
          items,
        });
      },
      (reason) => {
        this.isExecuting(false);
        const parsedError = ErrorParserUtility.parse(reason);
        this.formErrors(parsedError[0].message);
      }
    );
  };

  private _onLibraryAddClick = (): void => {
    const libraryAddress = this._libraryManageProps().addProps.urlProps.libraryAddress;
    if (!libraryAddress) {
      this.formErrors("Library Url cannot be null");
      return;
    }
    const libraryName = this._libraryManageProps().addProps.nameProps.libraryName || this._generateLibraryName();
    if (!libraryName) {
      this.formErrors("Library Name cannot be null");
      return;
    }

    const parsedLibraryAddress = this._parseLibraryUrl(libraryAddress);
    if (!parsedLibraryAddress) {
      return;
    }

    const library: Library = {
      name: libraryName,
      properties: {
        kind: "Jar",
        source: {
          kind: "HttpsUri",
          libraryFileName: `${libraryName}.${parsedLibraryAddress[3]}`,
          uri: libraryAddress,
        },
      },
    };
    const resourceId: string = this.container.databaseAccount() && this.container.databaseAccount().id;

    this.isExecuting(true);
    this._updateLibraryManageComponentProps(null, null, { disabled: true });
    this._addLibrary(resourceId, library).then(
      () => {
        this.isExecuting(false);
        this._updateLibraryManageComponentProps(
          {
            libraryName: "",
          },
          {
            libraryAddress: "",
          },
          {
            disabled: false,
          },
          {
            items: [...this._libraryManageProps().gridProps.items, library],
          }
        );
      },
      (reason) => {
        this.isExecuting(false);
        const parsedError = ErrorParserUtility.parse(reason);
        this.formErrors(parsedError[0].message);
      }
    );
  };

  private _parseLibraryUrl = (url: string): RegExpExecArray => {
    const libraryUrlRegex = /^(https:\/\/.+\/)(.+)\.(jar)$/gi;
    return libraryUrlRegex.exec(url);
  };

  private _generateLibraryName = (): string => {
    return `library-${Math.random().toString(32).substring(2)}`;
  };

  private async _getLibraries(resourceId: string): Promise<Library[]> {
    if (!resourceId) {
      return Promise.reject("Invalid inputs");
    }

    if (!this.container.sparkClusterManager) {
      return Promise.reject("Cluster client is not initialized yet");
    }

    const inProgressId = NotificationConsoleUtils.logConsoleMessage(
      ConsoleDataType.InProgress,
      `Fetching libraries...`
    );
    try {
      const libraries = await this.container.sparkClusterManager.getLibrariesAsync(resourceId);
      return libraries;
    } catch (e) {
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Error,
        `Failed to fetch libraries. Reason: ${JSON.stringify(e)}`
      );
      Logger.logError(e, "Explorer/_getLibraries");
      throw e;
    } finally {
      NotificationConsoleUtils.clearInProgressMessageWithId(inProgressId);
    }
  }

  private async _addLibrary(resourceId: string, library: Library): Promise<void> {
    if (!library || !resourceId) {
      return Promise.reject("invalid inputs");
    }

    if (!this.container.sparkClusterManager) {
      return Promise.reject("cluster client is not initialized yet");
    }

    TelemetryProcessor.traceStart(Action.LibraryManage, {
      resourceId,
      defaultExperience: this.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.ContextualPane,
      paneTitle: this.title(),
      area: "LibraryManagePane/_deleteLibrary",
      libraryName: library.name,
    });

    const libraryName = library.name;
    const inProgressId = NotificationConsoleUtils.logConsoleMessage(
      ConsoleDataType.InProgress,
      `Uploading ${libraryName}...`
    );
    try {
      await this.container.sparkClusterManager.addLibraryAsync(resourceId, libraryName, library);
      TelemetryProcessor.traceSuccess(Action.LibraryManage, {
        resourceId,
        area: "LibraryManagePane/_deleteLibrary",
        libraryName: library.name,
      });
    } catch (e) {
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Error,
        `Failed to upload ${libraryName}. Reason: ${JSON.stringify(e)}`
      );
      TelemetryProcessor.traceFailure(Action.LibraryManage, {
        resourceId,
        area: "LibraryManagePane/_deleteLibrary",
        libraryName: library.name,
        error: e,
      });
      Logger.logError(e, "Explorer/_uploadLibrary");
      throw e;
    } finally {
      NotificationConsoleUtils.clearInProgressMessageWithId(inProgressId);
    }
  }

  private async _deleteLibrary(resourceId: string, libraryName: string): Promise<void> {
    if (!libraryName || !resourceId) {
      return Promise.reject("invalid inputs");
    }

    if (!this.container.sparkClusterManager) {
      return Promise.reject("cluster client is not initialized yet");
    }

    TelemetryProcessor.traceStart(Action.LibraryManage, {
      resourceId,
      defaultExperience: this.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.ContextualPane,
      paneTitle: this.title(),
      area: "LibraryManagePane/_deleteLibrary",
      libraryName,
    });
    const inProgressId = NotificationConsoleUtils.logConsoleMessage(
      ConsoleDataType.InProgress,
      `Deleting ${libraryName}...`
    );
    try {
      await this.container.sparkClusterManager.deleteLibraryAsync(resourceId, libraryName);
      TelemetryProcessor.traceSuccess(Action.LibraryManage, {
        resourceId,
        area: "LibraryManagePane/_deleteLibrary",
        libraryName,
      });
    } catch (e) {
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Error,
        `Failed to delete ${libraryName}. Reason: ${JSON.stringify(e)}`
      );
      TelemetryProcessor.traceFailure(Action.LibraryManage, {
        resourceId,
        area: "LibraryManagePane/_deleteLibrary",
        libraryName,
        error: e,
      });
      Logger.logError(e, "Explorer/_deleteLibrary");
      throw e;
    } finally {
      NotificationConsoleUtils.clearInProgressMessageWithId(inProgressId);
    }
  }
}
