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
  const [cachedAccount, setCachedAccount] = React.useState<msal.AccountInfo | null>(null);
  const [hasInteractiveLogin, setHasInteractiveLogin] = React.useState<boolean>(false);

  // Initialize MSAL instance when config is available
  React.useEffect(() => {
    if (config && !msalInstance) {
      getMsalInstance().then((instance) => {
        setMsalInstance(instance);
        const account = instance.getAllAccounts()?.[0];
        setCachedAccount(account);
      });
    }
  }, [config, msalInstance]);

  const [isLoggedIn, { setTrue: setLoggedIn, setFalse: setLoggedOut }] = useBoolean(false);
  const [account, setAccount] = React.useState<msal.AccountInfo>(cachedAccount);
  const [tenantId, setTenantId] = React.useState<string>(cachedTenantId);
  const [graphToken, setGraphToken] = React.useState<string>();
  const [armToken, setArmToken] = React.useState<string>();
  const [authFailure, setAuthFailure] = React.useState<AadAuthFailure>(undefined);

  // Update account state when cachedAccount changes
  React.useEffect(() => {
    if (cachedAccount) {
      setAccount(cachedAccount);
    }
  }, [cachedAccount]);

  // Initialize logged in state based on cached values when we have the config
  React.useEffect(() => {
    if (config && cachedAccount && cachedTenantId) {
      // Don't automatically set as logged in just because we have cached values
      // The user should explicitly log in, and then we'll have hasInteractiveLogin = true
      // Note: Found cached account and tenant, but user needs to sign in
    }
  }, [config, cachedAccount]);

  // Update login state when we have both account and tenant
  React.useEffect(() => {
    // Only consider user as logged in if they have completed interactive login
    // or if we successfully have both account/tenant AND tokens
    if (account && tenantId && (hasInteractiveLogin || (armToken && graphToken))) {
      setLoggedIn();
    } else {
      setLoggedOut();
    }
  }, [account, tenantId, setLoggedIn, setLoggedOut, hasInteractiveLogin, armToken, graphToken]);

  if (msalInstance && account) {
    msalInstance.setActiveAccount(account);
  }
  const login = React.useCallback(async () => {
    if (!msalInstance || !config) {
      return;
    }

    try {
      const response = await msalInstance.loginPopup({
        redirectUri: config.msalRedirectURI,
        scopes: [],
      });
      setLoggedIn();
      setAccount(response.account);
      setTenantId(response.tenantId);
      setHasInteractiveLogin(true);
      localStorage.setItem("cachedTenantId", response.tenantId);
    } catch (error) {
      console.error("Login failed:", error);
      setAuthFailure({
        failureMessage: `Login failed: ${JSON.stringify(error)}`,
      });
    }
  }, [msalInstance, config, setLoggedIn]);

  const logout = React.useCallback(() => {
    if (!msalInstance) {
      return;
    }

    setLoggedOut();
    setHasInteractiveLogin(false);
    setAuthFailure(null);
    localStorage.removeItem("cachedTenantId");
    msalInstance.logoutRedirect();
  }, [msalInstance, setLoggedOut]);

  const switchTenant = React.useCallback(
    async (id) => {
      if (!msalInstance || !config) {
        return;
      }

      try {
        const response = await msalInstance.loginPopup({
          redirectUri: config.msalRedirectURI,
          authority: `${config.AAD_ENDPOINT}${id}`,
          scopes: [],
        });
        setTenantId(response.tenantId);
        setAccount(response.account);
        setHasInteractiveLogin(true);
        localStorage.setItem("cachedTenantId", response.tenantId);
      } catch (error) {
        console.error("Tenant switch failed:", error);
        setAuthFailure({
          failureMessage: `Tenant switch failed: ${JSON.stringify(error)}`,
        });
      }
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
      // ARM token acquisition error logged for debugging

      if (error instanceof msal.InteractionRequiredAuthError) {
        // This is expected when there are no cached tokens - don't show an error for this
        // Interactive login required for ARM token
      } else if (
        error instanceof msal.AuthError &&
        error.errorCode === msal.BrowserAuthErrorMessage.popUpWindowError.code
      ) {
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
      } else if (
        error instanceof msal.AuthError &&
        (error.errorCode === "no_tokens_found" || error.errorCode === "no_account_error")
      ) {
        // This happens when there are no cached tokens - this is normal for first-time users
        // Only show this as an error if we expected to have tokens (i.e., after interactive login)
        if (hasInteractiveLogin) {
          // No tokens found after interactive login
          setAuthFailure({
            failureMessage: `Authorization tokens were not found. Please try signing in again.`,
          });
        } else {
          // No cached tokens found, user needs to sign in
        }
      } else {
        const errorJson = JSON.stringify(error);
        // ARM token acquisition failed with error
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
  }, [account, tenantId, msalInstance, config, hasInteractiveLogin]);

  React.useEffect(() => {
    // Only try to acquire tokens after an interactive login or if we have a cached account with tenant
    if (
      account &&
      tenantId &&
      !authFailure &&
      msalInstance &&
      config &&
      (hasInteractiveLogin || (cachedAccount && cachedTenantId))
    ) {
      acquireTokens();
    }
  }, [account, tenantId, acquireTokens, authFailure, msalInstance, config, hasInteractiveLogin, cachedAccount]);

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
