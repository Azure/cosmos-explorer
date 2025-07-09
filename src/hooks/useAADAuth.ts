import * as msal from "@azure/msal-browser";
import { useBoolean } from "@fluentui/react-hooks";
import * as React from "react";
import { ConfigContext } from "../ConfigContext";
import { acquireTokenWithMsal, getMsalInstance } from "../Utils/AuthorizationUtils";

const cachedTenantId = localStorage.getItem("cachedTenantId");

interface ReturnType {
  isLoggedIn: boolean;
  graphToken: string;
  armToken: string;
  login: () => void;
  logout: () => void;
  tenantId: string;
  account: msal.AccountInfo;
  switchTenant: (tenantId: string) => void;
  authFailure: AadAuthFailure;
}

export interface AadAuthFailure {
  failureMessage: string;
  failureLinkTitle?: string;
  failureLinkAction?: () => void;
}

export function useAADAuth(config?: ConfigContext): ReturnType {
  const [msalInstance, setMsalInstance] = React.useState<msal.PublicClientApplication | null>(null);
  const [isLoggedIn, { setTrue: setLoggedIn, setFalse: setLoggedOut }] = useBoolean(false);
  const [account, setAccount] = React.useState<msal.AccountInfo>(null);
  const [tenantId, setTenantId] = React.useState<string>(cachedTenantId);
  const [graphToken, setGraphToken] = React.useState<string>();
  const [armToken, setArmToken] = React.useState<string>();
  const [authFailure, setAuthFailure] = React.useState<AadAuthFailure>(undefined);

  // Initialize MSAL instance when config is available
  React.useEffect(() => {
    if (config && !msalInstance) {
      getMsalInstance().then((instance) => {
        setMsalInstance(instance);
        const cachedAccount = instance.getAllAccounts()?.[0];
        if (cachedAccount && cachedTenantId) {
          setAccount(cachedAccount);
          setLoggedIn();
          instance.setActiveAccount(cachedAccount);
        }
      });
    }
  }, [config, msalInstance]);

  React.useEffect(() => {
    if (msalInstance && account) {
      msalInstance.setActiveAccount(account);
    }
  }, [msalInstance, account]);

  const login = React.useCallback(async () => {
    if (!msalInstance || !config) return;

    const response = await msalInstance.loginPopup({
      redirectUri: config.msalRedirectURI,
      scopes: [],
    });
    setLoggedIn();
    setAccount(response.account);
    setTenantId(response.tenantId);
    localStorage.setItem("cachedTenantId", response.tenantId);
  }, [msalInstance, config]);

  const logout = React.useCallback(() => {
    if (!msalInstance) return;
    setLoggedOut();
    localStorage.removeItem("cachedTenantId");
    msalInstance.logoutRedirect();
  }, [msalInstance]);

  const switchTenant = React.useCallback(
    async (id) => {
      if (!msalInstance || !config) return;

      const response = await msalInstance.loginPopup({
        redirectUri: config.msalRedirectURI,
        authority: `${config.AAD_ENDPOINT}${id}`,
        scopes: [],
      });
      setTenantId(response.tenantId);
      setAccount(response.account);
      localStorage.setItem("cachedTenantId", response.tenantId);
    },
    [msalInstance, config],
  );

  const acquireTokens = React.useCallback(async () => {
    if (!(account && tenantId && msalInstance && config)) {
      return;
    }

    try {
      const armToken = await acquireTokenWithMsal(msalInstance, {
        authority: `${config.AAD_ENDPOINT}${tenantId}`,
        scopes: [`${config.ARM_ENDPOINT}/.default`],
      });

      setArmToken(armToken);
      setAuthFailure(null);
    } catch (error) {
      if (error instanceof msal.AuthError && error.errorCode === msal.BrowserAuthErrorMessage.popUpWindowError.code) {
        // This error can occur when acquireTokenWithMsal() has attempted to acquire token interactively
        // and user has popups disabled in browser. This fails as the popup is not the result of a explicit user
        // action. In this case, we display the failure and a link to repeat the operation. Clicking on the
        // link is a user action so it will work even if popups have been disabled.
        // See: https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/76#issuecomment-324787539
        setAuthFailure({
          failureMessage:
            "We were unable to establish authorization for this account, due to pop-ups being disabled in the browser.\nPlease click below to retry authorization without requiring popups being enabled.",
          failureLinkTitle: "Retry Authorization",
          failureLinkAction: acquireTokens,
        });
      } else {
        const errorJson = JSON.stringify(error);
        setAuthFailure({
          failureMessage: `We were unable to establish authorization for this account, due to the following error: \n${errorJson}`,
        });
      }
    }

    try {
      const graphToken = await acquireTokenWithMsal(msalInstance, {
        authority: `${config.AAD_ENDPOINT}${tenantId}`,
        scopes: [`${config.GRAPH_ENDPOINT}/.default`],
      });

      setGraphToken(graphToken);
    } catch (error) {
      // Graph token is used only for retrieving user photo at the moment, so
      // it's not critical if this fails.
      console.warn("Error acquiring graph token: " + error);
    }
  }, [account, tenantId, msalInstance, config]);

  React.useEffect(() => {
    if (account && tenantId && !authFailure) {
      acquireTokens();
    }
  }, [account, tenantId, acquireTokens, authFailure]);

  return {
    account,
    tenantId,
    isLoggedIn,
    graphToken,
    armToken,
    login,
    logout,
    switchTenant,
    authFailure,
  };
}
