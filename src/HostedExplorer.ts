import "./Shared/appInsights";
import * as _ from "underscore";
import * as ko from "knockout";
import hasher from "hasher";
import { Action } from "./Shared/Telemetry/TelemetryConstants";
import { ArmResourceUtils } from "./Platform/Hosted/ArmResourceUtils";
import AuthHeadersUtil from "./Platform/Hosted/Authorization";
import { AuthType } from "./AuthType";
import { getArcadiaAuthToken } from "./Utils/AuthorizationUtils";
import { ActionType, PaneKind } from "./Contracts/ActionContracts";
import * as Constants from "./Common/Constants";
import { ControlBarComponentAdapter } from "./Explorer/Menus/NavBar/ControlBarComponentAdapter";
import { ConsoleDataType } from "./Explorer/Menus/NotificationConsole/NotificationConsoleComponent";
import { DatabaseAccount, Subscription, AccountKeys, Tenant } from "./Contracts/DataModels";
import {
  DefaultDirectoryDropdownComponent,
  DefaultDirectoryDropdownProps
} from "./Explorer/Controls/Directory/DefaultDirectoryDropdownComponent";
import { DialogComponentAdapter } from "./Explorer/Controls/DialogReactComponent/DialogComponentAdapter";
import { DialogProps } from "./Explorer/Controls/DialogReactComponent/DialogComponent";
import { DirectoryListProps } from "./Explorer/Controls/Directory/DirectoryListComponent";
import { getErrorMessage } from "./Common/ErrorHandlingUtils";
import { initializeIcons } from "office-ui-fabric-react/lib/Icons";
import { LocalStorageUtility, StorageKey, SessionStorageUtility } from "./Shared/StorageUtility";
import * as Logger from "./Common/Logger";
import { MeControlComponentProps } from "./Explorer/Menus/NavBar/MeControlComponent";
import { MeControlComponentAdapter } from "./Explorer/Menus/NavBar/MeControlComponentAdapter";
import { MessageTypes } from "./Contracts/ExplorerContracts";
import * as ReactBindingHandler from "./Bindings/ReactBindingHandler";
import { SwitchDirectoryPane, SwitchDirectoryPaneComponent } from "./Explorer/Panes/SwitchDirectoryPane";
import * as TelemetryProcessor from "./Shared/Telemetry/TelemetryProcessor";
import { isInvalidParentFrameOrigin } from "./Utils/MessageValidation";
import "../less/hostedexplorer.less";
import "./Explorer/Menus/NavBar/MeControlComponent.less";
import ConnectIcon from "../images/HostedConnectwhite.svg";
import SettingsIcon from "../images/HostedSettings.svg";
import FeedbackIcon from "../images/Feedback.svg";
import SwitchDirectoryIcon from "../images/DirectorySwitch.svg";
import { CommandButtonComponentProps } from "./Explorer/Controls/CommandButton/CommandButtonComponent";

ReactBindingHandler.Registerer.register();
ko.components.register("switch-directory-pane", new SwitchDirectoryPaneComponent());

class HostedExplorer {
  public navigationSelection: ko.Observable<string>;
  public isAccountActive: ko.Computed<boolean>;
  public controlBarComponentAdapter: ControlBarComponentAdapter;
  public firewallWarningComponentAdapter: DialogComponentAdapter;
  public dialogComponentAdapter: DialogComponentAdapter;
  public meControlComponentAdapter: MeControlComponentAdapter;
  public switchDirectoryPane: SwitchDirectoryPane;

  private _firewallWarningDialogProps: ko.Observable<DialogProps>;
  private _dialogProps: ko.Observable<DialogProps>;
  private _meControlProps: ko.Observable<MeControlComponentProps>;
  private _controlbarCommands: ko.ObservableArray<CommandButtonComponentProps>;
  private _directoryDropdownProps: ko.Observable<DefaultDirectoryDropdownProps>;
  private _directoryListProps: ko.Observable<DirectoryListProps>;

  constructor() {
    this.navigationSelection = ko.observable("explorer");
    const updateExplorerHash = (newHash: string, oldHash: string) => this._updateExplorerWithHash(newHash);
    // This pull icons from CDN, if we support standalone hosted in National Cloud, we need to change this
    initializeIcons(/* optional base url */);

    this._controlbarCommands = ko.observableArray([
      {
        id: "commandbutton-connect",
        iconSrc: ConnectIcon,
        iconAlt: "connect button",
        onCommandClick: () => this.openConnectPane(),
        commandButtonLabel: undefined,
        ariaLabel: "connect button",
        tooltipText: "Connect to a Cosmos DB account",
        hasPopup: true,
        disabled: false
      },
      {
        id: "commandbutton-settings",
        iconSrc: SettingsIcon,
        iconAlt: "setting button",
        onCommandClick: () => this.openSettingsPane(),
        commandButtonLabel: undefined,
        ariaLabel: "setting button",
        tooltipText: "Global settings",
        hasPopup: true,
        disabled: false
      },
      {
        id: "commandbutton-feedback",
        iconSrc: FeedbackIcon,
        iconAlt: "feeback button",
        onCommandClick: () =>
          window.open("https://aka.ms/cosmosdbfeedback?subject=Cosmos%20DB%20Hosted%20Data%20Explorer%20Feedback"),
        commandButtonLabel: undefined,
        ariaLabel: "feeback button",
        tooltipText: "Send feedback",
        hasPopup: true,
        disabled: false
      }
    ]);
    this.controlBarComponentAdapter = new ControlBarComponentAdapter(this._controlbarCommands);

    this._directoryDropdownProps = ko.observable({
      defaultDirectoryId: undefined,
      directories: [],
      onDefaultDirectoryChange: this._onDefaultDirectoryChange
    });

    this._directoryListProps = ko.observable({
      directories: [],
      selectedDirectoryId: undefined,
      onNewDirectorySelected: this._onNewDirectorySelected
    });

    this.switchDirectoryPane = new SwitchDirectoryPane(this._directoryDropdownProps, this._directoryListProps);

    this._firewallWarningDialogProps = ko.observable<DialogProps>({
      isModal: true,
      visible: false,
      title: "Data Explorer Access",
      subText:
        'The way Data Explorer accesses your databases and containers has changed and you need to update your Firewall settings to add your current IP address to the firewall rules. Please open Firewall blade in Azure portal, click "Add my IP address" and click ‘Save’.',
      primaryButtonText: "OK",
      secondaryButtonText: "Cancel",
      onPrimaryButtonClick: this._closeFirewallWarningDialog,
      onSecondaryButtonClick: this._closeFirewallWarningDialog
    });
    this.firewallWarningComponentAdapter = new DialogComponentAdapter();
    this.firewallWarningComponentAdapter.parameters = this._firewallWarningDialogProps;

    this._dialogProps = ko.observable<DialogProps>({
      isModal: false,
      visible: false,
      title: undefined,
      subText: undefined,
      primaryButtonText: undefined,
      secondaryButtonText: undefined,
      onPrimaryButtonClick: undefined,
      onSecondaryButtonClick: undefined
    });
    this.dialogComponentAdapter = new DialogComponentAdapter();
    this.dialogComponentAdapter.parameters = this._dialogProps;

    this._meControlProps = ko.observable<MeControlComponentProps>({
      isUserSignedIn: false,
      user: {
        name: undefined,
        email: undefined,
        tenantName: undefined,
        imageUrl: undefined
      },
      onSignInClick: this._onSignInClick,
      onSignOutClick: this._onSignOutClick,
      onSwitchDirectoryClick: this._onSwitchDirectoryClick
    });
    this.meControlComponentAdapter = new MeControlComponentAdapter();
    this.meControlComponentAdapter.parameters = this._meControlProps;

    hasher.initialized.add(updateExplorerHash);
    hasher.changed.add(updateExplorerHash);
    hasher.init();
    window.addEventListener("message", this._handleMessage.bind(this), false);
  }

  public explorer_click() {
    this.navigationSelection("explorer");
  }

  public openSettingsPane(): boolean {
    this._sendMessageToExplorerFrame({
      openAction: {
        actionType: ActionType.OpenPane,
        paneKind: PaneKind.GlobalSettings
      }
    });

    return false;
  }

  public openConnectPane(): boolean {
    this._sendMessageToExplorerFrame({
      openAction: {
        actionType: ActionType.OpenPane,
        paneKind: PaneKind.AdHocAccess
      }
    });

    return false;
  }

  public openDirectoryPane(): void {
    this.switchDirectoryPane.open();
  }

  public openAzurePortal(src: any, event: MouseEvent): boolean {
    // TODO: Get environment specific azure portal url from a config file
    window.open("https://portal.azure.com", "_blank");
    return false;
  }

  public onOpenAzurePortalKeyPress(src: any, event: KeyboardEvent): boolean {
    if (event.keyCode === Constants.KeyCodes.Enter || event.keyCode === Constants.KeyCodes.Space) {
      this.openAzurePortal(src, undefined);
      return false;
    }

    return true;
  }

  private _handleMessage(event: MessageEvent) {
    if (isInvalidParentFrameOrigin(event)) {
      return;
    }

    if (typeof event.data !== "object" || event.data["signature"] !== "pcIframe") {
      return;
    }
    if (typeof event.data !== "object" || !("data" in event.data)) {
      return;
    }

    const message: any = event.data.data;
    if (message === "ready") {
      this._updateExplorerWithHash(decodeURIComponent(hasher.getHash()));
    } else if (message && message.type) {
      this._handleMessageTypes(message);
    }
  }

  private _handleMessageTypes(message: any) {
    switch (message.type) {
      case MessageTypes.AadSignIn:
        AuthHeadersUtil.signIn();
        break;
      case MessageTypes.UpdateLocationHash:
        if (message.locationHash) {
          hasher.replaceHash(message.locationHash);
        }
        break;
      case MessageTypes.UpdateAccountSwitch:
        if (message.props) {
          this._updateAccountSwitchProps(message.props);
        }
        if (message.click) {
          this._clickAccountSwitchControl();
        }
        break;
      case MessageTypes.UpdateDirectoryControl:
        if (message.click) {
          this._clickDirectoryControl();
        }
        break;
      case MessageTypes.GetAccessAadRequest:
        this._handleGetAccessAadRequest();
        break;
      case MessageTypes.ExplorerClickEvent:
        this._simulateClick();
        break;
      case MessageTypes.ForbiddenError:
        this._displayFirewallWarningDialog();
        break;
      case MessageTypes.GetArcadiaToken:
        this._getArcadiaToken(message);
    }
  }

  private _updateDirectoryProps(
    dropdownProps?: Partial<DefaultDirectoryDropdownProps>,
    listProps?: Partial<DirectoryListProps>
  ) {
    if (dropdownProps) {
      const propsToUpdate = this._directoryDropdownProps();
      if (dropdownProps.defaultDirectoryId) {
        propsToUpdate.defaultDirectoryId = dropdownProps.defaultDirectoryId;
      }
      if (dropdownProps.directories) {
        propsToUpdate.directories = dropdownProps.directories;
      }
      this._directoryDropdownProps(propsToUpdate);
    }
    if (listProps) {
      const propsToUpdate = this._directoryListProps();
      if (listProps.selectedDirectoryId) {
        propsToUpdate.selectedDirectoryId = listProps.selectedDirectoryId;
      }
      if (listProps.directories) {
        propsToUpdate.directories = listProps.directories;
      }
      this._directoryListProps(propsToUpdate);
    }
  }

  private _updateMeControlProps(props: Partial<MeControlComponentProps>) {
    if (!props) {
      return;
    }

    const propsToUpdate = this._meControlProps();
    if (props.isUserSignedIn != null) {
      propsToUpdate.isUserSignedIn = props.isUserSignedIn;
    }

    if (props.user) {
      if (props.user.name != null) {
        propsToUpdate.user.name = props.user.name;
      }
      if (props.user.email != null) {
        propsToUpdate.user.email = props.user.email;
      }
      if (props.user.imageUrl != null) {
        propsToUpdate.user.imageUrl = props.user.imageUrl;
      }
      if (props.user.tenantName != null) {
        propsToUpdate.user.tenantName = props.user.tenantName;
      }
    }

    this._meControlProps(propsToUpdate);
  }

  private _updateAccountSwitchProps(props: any) {
    if (!props) {
      return;
    }
  }

  private _onAccountChange = (newAccount: DatabaseAccount) => {
    if (!newAccount) {
      return;
    }
    this._openSwitchAccountModalDialog(newAccount);
    TelemetryProcessor.traceStart(Action.AccountSwitch);
  };

  private _onSubscriptionChange = (newSubscription: Subscription) => {
    if (!newSubscription) {
      return;
    }
    this._switchSubscription(newSubscription);
    TelemetryProcessor.trace(Action.SubscriptionSwitch);
  };

  private _openSwitchAccountModalDialog = (newAccount: DatabaseAccount) => {
    const switchAccountDialogProps: DialogProps = {
      isModal: true,
      visible: true,
      title: `Switch account to ${newAccount.name}`,
      subText:
        "Please save your work before you switch! When you switch to a different Azure Cosmos DB account, current Data Explorer tabs will be closed. Proceed anyway?",
      primaryButtonText: "OK",
      secondaryButtonText: "Cancel",
      onPrimaryButtonClick: () => this._onSwitchDialogOkClicked(newAccount),
      onSecondaryButtonClick: this._onSwitchDialogCancelClicked
    };
    this._dialogProps(switchAccountDialogProps);
  };

  private _onSwitchDialogCancelClicked = () => {
    this._closeModalDialog();
    TelemetryProcessor.traceFailure(Action.AccountSwitch);
  };

  private _onSwitchDialogOkClicked = (newAccount: DatabaseAccount) => {
    this._closeModalDialog();
    this._switchAccount(newAccount).then(accountResponse => {
      this._sendMessageToExplorerFrame({
        type: MessageTypes.SwitchAccount,
        account: accountResponse[0],
        keys: accountResponse[1],
        authorizationToken: accountResponse[2]
      });
    });
    TelemetryProcessor.traceSuccess(Action.AccountSwitch);
  };

  private _closeModalDialog = () => {
    this._dialogProps().visible = false;
    this._dialogProps.valueHasMutated();
  };

  private _closeFirewallWarningDialog = () => {
    this._firewallWarningDialogProps().visible = false;
    this._firewallWarningDialogProps.valueHasMutated();
  };

  private _displayFirewallWarningDialog = () => {
    this._firewallWarningDialogProps().visible = true;
    this._firewallWarningDialogProps.valueHasMutated();
  };

  private _updateExplorerWithHash(newHash: string): void {
    this._sendMessageToExplorerFrame({
      type: MessageTypes.UpdateLocationHash,
      locationHash: newHash
    });
  }

  private _sendMessageToExplorerFrame(data: any): void {
    const explorerFrame = document.getElementById("explorerMenu") as HTMLIFrameElement;
    explorerFrame &&
      explorerFrame.contentDocument &&
      explorerFrame.contentDocument.referrer &&
      explorerFrame.contentWindow.postMessage(
        {
          signature: "pcIframe",
          data: data
        },
        explorerFrame.contentDocument.referrer || window.location.href
      );
  }

  private _onSignInClick = () => {
    if (SessionStorageUtility.hasItem(StorageKey.EncryptedKeyToken)) {
      SessionStorageUtility.removeEntry(StorageKey.EncryptedKeyToken);
    }
    const windowUrl = window.location.href;
    const params = new URLSearchParams(window.parent.location.search);
    if (!!params && params.has("key")) {
      const keyIndex = windowUrl.indexOf("key");
      const keyLength = encodeURIComponent(params.get("key")).length;
      const metaDataLength = "key=".length;
      const cleanUrl = windowUrl.slice(0, keyIndex) + windowUrl.slice(keyIndex + keyLength + metaDataLength);
      window.history.pushState({}, document.title, cleanUrl);
    }
    AuthHeadersUtil.signIn();
    TelemetryProcessor.trace(Action.SignInAad, undefined, { area: "HostedExplorer" });
  };

  private _onSignOutClick = () => {
    AuthHeadersUtil.signOut();
    TelemetryProcessor.trace(Action.SignOutAad, undefined, { area: "HostedExplorer" });
  };

  private _onSwitchDirectoryClick = () => {
    this._clickMeControl();
    this.openDirectoryPane();
  };

  private async _getArcadiaToken(message: any): Promise<void> {
    try {
      const token = await getArcadiaAuthToken();
      this._sendMessageToExplorerFrame({
        actionType: ActionType.TransmitCachedData,
        message: {
          id: message && message.id,
          data: JSON.stringify(token) // target expects stringified value
        }
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      Logger.logError(errorMessage, "HostedExplorer/_getArcadiaToken");
      this._sendMessageToExplorerFrame({
        actionType: ActionType.TransmitCachedData,
        message: {
          id: message && message.id,
          error: errorMessage
        }
      });
    }
  }

  private _handleGetAccessAadRequest() {
    this._getAccessAad().then(
      response => {
        this._sendMessageToExplorerFrame({
          type: MessageTypes.GetAccessAadResponse,
          response
        });
      },
      error => {
        this._sendMessageToExplorerFrame({
          type: MessageTypes.GetAccessAadResponse,
          error: getErrorMessage(error)
        });
      }
    );
  }

  private async _getAccessAad(): Promise<[DatabaseAccount, AccountKeys, string]> {
    return this._getAccessCached().catch(() => this._getAccessNew());
  }

  private async _getAccessCached(): Promise<[DatabaseAccount, AccountKeys, string]> {
    if (!this._hasCachedDatabaseAccount() || !this._hasCachedTenant()) {
      throw new Error("No cached account or tenant found.");
    }

    const accountResourceId = LocalStorageUtility.getEntryString(StorageKey.DatabaseAccountId);
    let tenantId = LocalStorageUtility.getEntryString(StorageKey.TenantId);
    tenantId = tenantId && tenantId.indexOf("lastVisited") > -1 ? tenantId.substring("lastVisited".length) : tenantId;

    try {
      this._updateAccountSwitchProps({
        authType: AuthType.AAD,
        displayText: "Loading..."
      });
      this._updateLoadingStatusText("Loading Account...");

      const loadAccountResult = await this._loadAccount(accountResourceId, tenantId);

      this._updateAccountSwitchProps({
        authType: AuthType.AAD,
        displayText: "",
        selectedAccountName: loadAccountResult[0].name
      });
      this._updateLoadingStatusText("Successfully loaded the account.");

      this._setAadControlBar();
      this._getTenantsHelper().then(tenants => {
        this._getDefaultTenantHelper(tenants);
      });
      this._getSubscriptionsHelper(tenantId, true, true).then(subs =>
        this._getDefaultSubscriptionHelper(subs, true, true)
      );
      const subscriptionId: string = accountResourceId && accountResourceId.split("subscriptions/")[1].split("/")[0];
      this._getAccountsHelper(subscriptionId, true, true);

      return loadAccountResult;
    } catch (error) {
      LocalStorageUtility.removeEntry(StorageKey.DatabaseAccountId);
      Logger.logError(getErrorMessage(error), "HostedExplorer/_getAccessCached");
      throw error;
    }
  }

  private async _loadAccount(
    cosmosdbResourceId: string,
    tenantId?: string
  ): Promise<[DatabaseAccount, AccountKeys, string]> {
    const getAccountPromise = ArmResourceUtils.getCosmosdbAccount(cosmosdbResourceId, tenantId);
    const getKeysPromise = ArmResourceUtils.getCosmosdbKeys(cosmosdbResourceId, tenantId);
    const getAuthToken = ArmResourceUtils.getAuthToken(tenantId);

    return Promise.all([getAccountPromise, getKeysPromise, getAuthToken]);
  }

  private async _getAccessNew(): Promise<[DatabaseAccount, AccountKeys, string]> {
    try {
      const tenants = await this._getTenantsHelper();
      const defaultTenant = this._getDefaultTenantHelper(tenants);

      this._setAadControlBar();

      const accountResponse = this._getAccessAfterTenantSelection(defaultTenant.tenantId);
      return accountResponse;
    } catch (error) {
      Logger.logError(getErrorMessage(error), "HostedExplorer/_getAccessNew");
      throw error;
    }
  }

  private async _getAccessAfterTenantSelection(tenantId: string): Promise<[DatabaseAccount, AccountKeys, string]> {
    try {
      this._updateAccountSwitchProps({
        authType: AuthType.AAD,
        displayText: "Loading..."
      });
      const authToken = await ArmResourceUtils.getAuthToken(tenantId);
      const subscriptions = await this._getSubscriptionsHelper(tenantId, true, true);
      const defaultSubscription = this._getDefaultSubscriptionHelper(subscriptions, true, true);

      const accounts = await this._getAccountsHelper(defaultSubscription.subscriptionId, true, true);
      const defaultAccount = this._getDefaultAccountHelper(accounts, true, true);

      const keys = await this._getAccountKeysHelper(defaultAccount, true);
      return [defaultAccount, keys, authToken];
    } catch (error) {
      Logger.logError(getErrorMessage(error), "HostedExplorer/_getAccessAfterTenantSelection");
      throw error;
    }
  }

  private async _getTenantsHelper(
    setControl: boolean = true,
    setLoadingStatus: boolean = true
  ): Promise<Array<Tenant>> {
    if (setLoadingStatus) {
      this._updateLoadingStatusText("Loading directories...");
    }

    try {
      TelemetryProcessor.traceStart(Action.FetchTenants);
      const tenants = await ArmResourceUtils.listTenants();
      TelemetryProcessor.traceSuccess(Action.FetchTenants);

      if (!tenants || !tenants.length) {
        if (setLoadingStatus) {
          this._updateLoadingStatusText("No directories found. Please sign up for Azure.");
        }
        return Promise.reject(new Error("No directories found"));
      }

      if (setLoadingStatus) {
        this._updateLoadingStatusText("Successfully loaded directories.");
      }
      if (setControl) {
        this._updateDirectoryProps({ directories: tenants }, { directories: tenants });
      }
      return tenants;
    } catch (error) {
      if (setLoadingStatus) {
        this._updateLoadingStatusText("Failed to load directoreis.");
      }
      TelemetryProcessor.traceFailure(Action.FetchTenants);
      throw error;
    }
  }

  private _getDefaultTenantHelper(
    tenants: Tenant[],
    setControl: boolean = true,
    setLoadingStatus: boolean = true
  ): Tenant {
    if (!tenants || !tenants.length) {
      return undefined;
    }

    let storedDefaultTenantId = LocalStorageUtility.getEntryString(StorageKey.TenantId);
    const useLastVisitedAsDefault =
      storedDefaultTenantId && storedDefaultTenantId.indexOf(DefaultDirectoryDropdownComponent.lastVisitedKey) > -1;
    storedDefaultTenantId = useLastVisitedAsDefault
      ? storedDefaultTenantId.substring(DefaultDirectoryDropdownComponent.lastVisitedKey.length)
      : storedDefaultTenantId;

    let defaultTenant: Tenant = _.find(tenants, t => t.tenantId === storedDefaultTenantId);
    if (!defaultTenant) {
      defaultTenant = tenants[0];
      LocalStorageUtility.setEntryString(
        StorageKey.TenantId,
        `${DefaultDirectoryDropdownComponent.lastVisitedKey}${defaultTenant.tenantId}`
      );
    }

    if (setControl) {
      const dropdownDefaultDirectoryId = useLastVisitedAsDefault
        ? DefaultDirectoryDropdownComponent.lastVisitedKey
        : defaultTenant.tenantId;

      this._updateDirectoryProps(
        { defaultDirectoryId: dropdownDefaultDirectoryId },
        { selectedDirectoryId: defaultTenant.tenantId }
      );

      this._updateMeControlProps({
        isUserSignedIn: true,
        user: {
          name: undefined,
          email: undefined,
          tenantName: defaultTenant && defaultTenant.displayName,
          imageUrl: undefined
        }
      });
    }
    if (setLoadingStatus) {
      this._updateLoadingStatusText(`Connecting to directory: ${defaultTenant.displayName}`);
    }

    return defaultTenant;
  }

  private async _getSubscriptionsHelper(
    tenantId?: string,
    setControl: boolean = true,
    setLoadingStatus: boolean = true
  ): Promise<Array<Subscription>> {
    if (setLoadingStatus) {
      this._updateLoadingStatusText("Loading subscriptions...");
    }
    if (setControl) {
      this._updateAccountSwitchProps({
        authType: AuthType.AAD,
        isLoadingSubscriptions: true
      });
    }
    try {
      TelemetryProcessor.traceStart(Action.FetchSubscriptions);
      const subscriptions = await ArmResourceUtils.listSubscriptions(tenantId);
      TelemetryProcessor.traceSuccess(Action.FetchSubscriptions);

      if (!subscriptions || !subscriptions.length) {
        const message: string = "No Subscription Found";
        if (setLoadingStatus) {
          this._updateLoadingStatusText(
            `Please <span class="clickableLink" data-bind="click: $data.clickHostedDirectorySwitch">
            switch to a different directory</span> with Cosmos DB accounts, or
            <a href="https://portal.azure.com/#blade/Microsoft_Azure_Billing/SubscriptionsBlade"
            target="_blank" class="clickableLink">create an subscription</a> under this directory`,
            message
          );
        }
        if (setControl) {
          this._updateAccountSwitchProps({
            authType: AuthType.AAD,
            isLoadingSubscriptions: false,
            subscriptions: [],
            accounts: [],
            displayText: message
          });
        }
        return Promise.reject(new Error(message));
      }
      if (setLoadingStatus) {
        this._updateLoadingStatusText("Successfully loaded subscriptions.");
      }
      if (setControl) {
        this._updateAccountSwitchProps({
          authType: AuthType.AAD,
          isLoadingSubscriptions: false,
          subscriptions: subscriptions
        });
      }
      return subscriptions;
    } catch (error) {
      const failureMessage = "Failed to load subscriptions";
      if (setLoadingStatus) {
        this._updateLoadingStatusText(failureMessage);
      }
      if (setControl) {
        this._updateAccountSwitchProps({
          authType: AuthType.AAD,
          isLoadingSubscriptions: false,
          displayText: failureMessage
        });
      }
      TelemetryProcessor.traceFailure(Action.FetchSubscriptions);
      throw error;
    }
  }

  private _getDefaultSubscriptionHelper(
    subscriptions: Subscription[],
    setControl: boolean = true,
    setLoadingStatus: boolean = true
  ): Subscription {
    if (!subscriptions || !subscriptions.length) {
      return undefined;
    }

    const storedAccountId = LocalStorageUtility.getEntryString(StorageKey.DatabaseAccountId);
    const storedSubId = storedAccountId && storedAccountId.split("subscriptions/")[1].split("/")[0];

    let defaultSub = _.find(subscriptions, s => s.subscriptionId === storedSubId);
    if (!defaultSub) {
      defaultSub = subscriptions[0];
    }
    if (setControl) {
      this._updateAccountSwitchProps({
        authType: AuthType.AAD,
        selectedSubscriptionId: defaultSub.subscriptionId
      });
    }
    if (setLoadingStatus) {
      this._updateLoadingStatusText(`Connecting to subscription: ${defaultSub.displayName}`);
    }

    return defaultSub;
  }

  private async _getAccountsHelper(
    subscriptionId: string,
    setControl: boolean = true,
    setLoadingStatus: boolean = true
  ): Promise<Array<DatabaseAccount>> {
    if (!subscriptionId) {
      throw new Error("No subscription Id");
    }

    if (setLoadingStatus) {
      this._updateLoadingStatusText("Loading Accounts...");
    }
    if (setControl) {
      this._updateAccountSwitchProps({
        authType: AuthType.AAD,
        isLoadingAccounts: true,
        accounts: []
      });
    }

    try {
      TelemetryProcessor.traceStart(Action.FetchAccounts);
      const accounts = await ArmResourceUtils.listCosmosdbAccounts([subscriptionId]);
      TelemetryProcessor.traceSuccess(Action.FetchAccounts);

      if (!accounts || !accounts.length) {
        const message: string = "No Account Found";
        if (setLoadingStatus) {
          this._updateLoadingStatusText(
            `Please <span class="clickableLink" data-bind="click: $data.clickHostedAccountSwitch">
            switch to a different subscription</span> with Cosmos DB accounts, or
            <a href="https://portal.azure.com/#create/Microsoft.DocumentDB" target="_blank" class="clickableLink">
            create an account</a> in this subscription`,
            message
          );
        }
        if (setControl) {
          this._updateAccountSwitchProps({
            authType: AuthType.AAD,
            displayText: message,
            isLoadingAccounts: false,
            accounts: []
          });
        }
        return Promise.reject(new Error("No Account Found"));
      }
      if (setLoadingStatus) {
        this._updateLoadingStatusText("Successfully loaded accounts.");
      }
      if (setControl) {
        this._updateAccountSwitchProps({
          authType: AuthType.AAD,
          isLoadingAccounts: false,
          accounts: accounts
        });
      }
      return accounts;
    } catch (error) {
      const failureMessage = "Failed to load accounts.";
      if (setLoadingStatus) {
        this._updateLoadingStatusText(failureMessage);
      }
      if (setControl) {
        this._updateAccountSwitchProps({
          authType: AuthType.AAD,
          isLoadingAccounts: false,
          accounts: [],
          displayText: failureMessage
        });
      }
      TelemetryProcessor.traceFailure(Action.FetchAccounts);
      throw error;
    }
  }

  private _getDefaultAccountHelper(
    accounts: DatabaseAccount[],
    setControl: boolean = true,
    setLoadingStatus: boolean = true
  ): DatabaseAccount {
    if (!accounts || !accounts.length) {
      return undefined;
    }

    let storedDefaultAccountId = LocalStorageUtility.getEntryString(StorageKey.DatabaseAccountId);
    let defaultAccount = _.find(accounts, a => a.id === storedDefaultAccountId);

    if (!defaultAccount) {
      defaultAccount = accounts[0];
      LocalStorageUtility.setEntryString(StorageKey.DatabaseAccountId, defaultAccount.id);
    }
    if (setControl) {
      this._updateAccountSwitchProps({
        authType: AuthType.AAD,
        displayText: "",
        selectedAccountName: defaultAccount.name
      });
    }
    if (setLoadingStatus) {
      this._updateLoadingStatusText(`Connecting to Azure Cosmos DB account: ${defaultAccount.name}`);
    }

    return defaultAccount;
  }

  private async _getAccountKeysHelper(
    account: DatabaseAccount,
    setLoadingStatus: boolean = true
  ): Promise<AccountKeys> {
    try {
      if (setLoadingStatus) {
        this._updateLoadingStatusText(`Getting authentication token for Azure Cosmos DB account: ${account.name}`);
      }

      TelemetryProcessor.traceStart(Action.GetAccountKeys);
      const keys = await ArmResourceUtils.getCosmosdbKeys(account.id);
      TelemetryProcessor.traceSuccess(Action.GetAccountKeys);

      if (setLoadingStatus) {
        this._updateLoadingStatusText(
          `Successfully got authentication token for Azure Cosmos DB account: ${account.name}`
        );
      }
      return keys;
    } catch (error) {
      if (setLoadingStatus) {
        this._updateLoadingStatusText(
          `Failed to get authentication token for Azure Cosmos DB account: ${account.name}`
        );
      }
      TelemetryProcessor.traceFailure(Action.GetAccountKeys);
      throw error;
    }
  }

  private _switchSubscription = async (newSubscription: Subscription): Promise<Array<DatabaseAccount>> => {
    if (!newSubscription) {
      throw new Error("no subscription specified");
    }
    this._updateAccountSwitchProps({
      authType: AuthType.AAD,
      selectedSubscriptionId: newSubscription.subscriptionId
    });
    const id: string = _.uniqueId();
    this._logConsoleMessage(
      ConsoleDataType.InProgress,
      `Getting Cosmos DB accounts from subscription: ${newSubscription.displayName}`,
      id
    );

    try {
      const accounts = await this._getAccountsHelper(newSubscription.subscriptionId, true);

      this._logConsoleMessage(ConsoleDataType.Info, "Successfully fetched Cosmos DB accounts.");
      this._clearInProgressMessageWithId(id);

      return accounts;
    } catch (error) {
      this._logConsoleMessage(ConsoleDataType.Error, `Failed to fetch accounts: ${getErrorMessage(error)}`);
      this._clearInProgressMessageWithId(id);

      throw error;
    }
  };

  private _switchAccount = async (newAccount: DatabaseAccount): Promise<[DatabaseAccount, AccountKeys, string]> => {
    if (!newAccount) {
      throw new Error("No account passed in");
    }

    this._updateAccountSwitchProps({
      authType: AuthType.AAD,
      displayText: "Loading..."
    });
    const id: string = _.uniqueId();
    this._logConsoleMessage(ConsoleDataType.InProgress, `Connecting to Cosmos DB account: ${newAccount.name}`, id);

    try {
      const loadAccountResponse = await this._loadAccount(newAccount.id);
      const account = loadAccountResponse[0];

      LocalStorageUtility.setEntryString(StorageKey.DatabaseAccountId, account.id);
      this._updateAccountSwitchProps({
        authType: AuthType.AAD,
        displayText: "",
        selectedAccountName: account.name
      });
      this._logConsoleMessage(ConsoleDataType.Info, "Connection successful");
      this._clearInProgressMessageWithId(id);

      return loadAccountResponse;
    } catch (error) {
      this._updateAccountSwitchProps({
        authType: AuthType.AAD,
        displayText: "Error loading account"
      });
      this._updateLoadingStatusText(`Failed to load selected account: ${newAccount.name}`);
      this._logConsoleMessage(ConsoleDataType.Error, `Failed to connect: ${getErrorMessage(error)}`);
      this._clearInProgressMessageWithId(id);
      throw error;
    }
  };

  private _hasCachedDatabaseAccount(): boolean {
    return LocalStorageUtility.hasItem(StorageKey.DatabaseAccountId);
  }

  private _hasCachedTenant(): boolean {
    return LocalStorageUtility.hasItem(StorageKey.TenantId);
  }

  private _logConsoleMessage(consoleDataType: ConsoleDataType, message: string, id?: string) {
    this._sendMessageToExplorerFrame({
      type: MessageTypes.SendNotification,
      consoleDataType,
      message,
      id: id || undefined
    });
  }

  private _clearInProgressMessageWithId(id: string) {
    this._sendMessageToExplorerFrame({
      type: MessageTypes.ClearNotification,
      id
    });
  }

  private _updateLoadingStatusText(text: string, title?: string) {
    this._sendMessageToExplorerFrame({
      type: MessageTypes.LoadingStatus,
      text,
      title
    });
  }

  private _setAadControlBar() {
    const switchDirectoryCommand: CommandButtonComponentProps = {
      iconSrc: SwitchDirectoryIcon,
      iconAlt: "switch directory button",
      onCommandClick: () => this.openDirectoryPane(),
      commandButtonLabel: undefined,
      ariaLabel: "switch directory button",
      tooltipText: "Switch Directory",
      hasPopup: true,
      disabled: false,
      id: "directorySwitchButton"
    };

    this._controlbarCommands.splice(0, 1, switchDirectoryCommand);
  }

  private _onDefaultDirectoryChange = (newDirectory: Tenant) => {
    this._updateDirectoryProps({ defaultDirectoryId: newDirectory.tenantId });
    if (newDirectory.tenantId === DefaultDirectoryDropdownComponent.lastVisitedKey) {
      const storedDirectoryId = LocalStorageUtility.getEntryString(StorageKey.TenantId);
      LocalStorageUtility.setEntryString(
        StorageKey.TenantId,
        `${DefaultDirectoryDropdownComponent.lastVisitedKey}${storedDirectoryId}`
      );
      return;
    }
    LocalStorageUtility.setEntryString(StorageKey.TenantId, newDirectory.tenantId);
    TelemetryProcessor.trace(Action.DefaultTenantSwitch);
  };

  private _onNewDirectorySelected = (newDirectory: Tenant) => {
    this.switchDirectoryPane.close();
    this._updateDirectoryProps(null, { selectedDirectoryId: newDirectory.tenantId });
    this._updateCacheOnNewDirectorySelected(newDirectory);
    this._updateMeControlProps({
      user: { tenantName: newDirectory.displayName, name: undefined, email: undefined, imageUrl: undefined }
    });
    this._getAccessAfterTenantSelection(newDirectory.tenantId).then(
      accountResponse => {
        this._sendMessageToExplorerFrame({
          type: MessageTypes.SwitchAccount,
          account: accountResponse[0],
          keys: accountResponse[1],
          authorizationToken: accountResponse[2]
        });
      },
      error => {
        Logger.logError(getErrorMessage(error), "HostedExplorer/_onNewDirectorySelected");
      }
    );
    TelemetryProcessor.trace(Action.TenantSwitch);
  };

  private _updateCacheOnNewDirectorySelected(newDirectory: Tenant) {
    const storedDefaultTenantId = LocalStorageUtility.getEntryString(StorageKey.TenantId);
    if (storedDefaultTenantId.indexOf(DefaultDirectoryDropdownComponent.lastVisitedKey) >= 0) {
      LocalStorageUtility.setEntryString(
        StorageKey.TenantId,
        `${DefaultDirectoryDropdownComponent.lastVisitedKey}${newDirectory.tenantId}`
      );
    }
    LocalStorageUtility.removeEntry(StorageKey.DatabaseAccountId);
  }

  private _clickDirectoryControl() {
    document.getElementById("directorySwitchButton").click();
  }

  private _clickAccountSwitchControl() {
    document.getElementById("accountSwitchButton").click();
  }

  private _clickMeControl() {
    document.getElementById("mecontrolHeader").click();
  }

  /**
   * The iframe swallows any click event which breaks the logic to dismiss the menu, so we simulate a click from the message
   */
  private _simulateClick() {
    const event = document.createEvent("Events");
    event.initEvent("click", true, false);
    document.getElementsByTagName("header")[0].dispatchEvent(event);
  }
}

const hostedExplorer = new HostedExplorer();
ko.applyBindings(hostedExplorer);
