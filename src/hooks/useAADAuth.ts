import * as msal from "@azure/msal-browser";
import { useBoolean } from "@fluentui/react-hooks";
import * as React from "react";
import { configContext } from "../ConfigContext";
import { acquireTokenWithMsal, getMsalInstance } from "../Utils/AuthorizationUtils";
import { updateUserContext } from "UserContext";

const msalInstance = await getMsalInstance();

const cachedAccount = msalInstance.getAllAccounts()?.[0];
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

export function useAADAuth(): ReturnType {
  const [isLoggedIn, { setTrue: setLoggedIn, setFalse: setLoggedOut }] = useBoolean(
    Boolean(cachedAccount && cachedTenantId) || false,
  );
  const [account, setAccount] = React.useState<msal.AccountInfo>(cachedAccount);
  const [tenantId, setTenantId] = React.useState<string>(cachedTenantId);
  const [graphToken, setGraphToken] = React.useState<string>();
  const [armToken, setArmToken] = React.useState<string>();
  const [authFailure, setAuthFailure] = React.useState<AadAuthFailure>(undefined);

  msalInstance.setActiveAccount(account);
  const login = React.useCallback(async () => {
    const response = await msalInstance.loginPopup({
      redirectUri: configContext.msalRedirectURI,
      scopes: [],
    });
    setLoggedIn();
    setAccount(response.account);
    setTenantId(response.tenantId);
    localStorage.setItem("cachedTenantId", response.tenantId);
  }, []);

  const logout = React.useCallback(() => {
    setLoggedOut();
    localStorage.removeItem("cachedTenantId");
    msalInstance.logoutRedirect();
  }, []);

  const switchTenant = React.useCallback(
    async (id) => {
      const response = await msalInstance.loginPopup({
        redirectUri: configContext.msalRedirectURI,
        authority: `${configContext.AAD_ENDPOINT}${id}`,
        scopes: [],
      });
      setTenantId(response.tenantId);
      setAccount(response.account);
      localStorage.setItem("cachedTenantId", response.tenantId);
    },
    [account, tenantId],
  );

  const acquireTokens = React.useCallback(async () => {
    if (!(account && tenantId)) {
      return;
    }

    try {
      const armToken = await acquireTokenWithMsal(msalInstance, {
        authority: `${configContext.AAD_ENDPOINT}${tenantId}`,
        scopes: [`${configContext.ARM_ENDPOINT}/.default`],
      });
      updateUserContext({ armToken: armToken });
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
        authority: `${configContext.AAD_ENDPOINT}${tenantId}`,
        scopes: [`${configContext.GRAPH_ENDPOINT}/.default`],
      });

      setGraphToken(graphToken);
    } catch (error) {
      // Graph token is used only for retrieving user photo at the moment, so
      // it's not critical if this fails.
      console.warn("Error acquiring graph token: " + error);
    }
  }, [account, tenantId]);

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
