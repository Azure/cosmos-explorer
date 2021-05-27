import * as msal from "@azure/msal-browser";
import { useBoolean } from "@fluentui/react-hooks";
import * as React from "react";
import { msalInstance } from "../Utils/AuthorizationUtils";

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
}

export function useAADAuth(): ReturnType {
  const [isLoggedIn, { setTrue: setLoggedIn, setFalse: setLoggedOut }] = useBoolean(
    Boolean(cachedAccount && cachedTenantId) || false
  );
  const [account, setAccount] = React.useState<msal.AccountInfo>(cachedAccount);
  const [tenantId, setTenantId] = React.useState<string>(cachedTenantId);
  const [graphToken, setGraphToken] = React.useState<string>();
  const [armToken, setArmToken] = React.useState<string>();

  msalInstance.setActiveAccount(account);
  const login = React.useCallback(async () => {
    const response = await msalInstance.loginPopup();
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
        authority: `https://login.microsoftonline.com/${id}`,
        scopes: [],
      });
      setTenantId(response.tenantId);
      setAccount(response.account);
    },
    [account, tenantId]
  );

  React.useEffect(() => {
    if (account && tenantId) {
      Promise.all([
        msalInstance.acquireTokenSilent({
          authority: `https://login.microsoftonline.com/${tenantId}`,
          scopes: ["https://graph.windows.net//.default"],
        }),
        msalInstance.acquireTokenSilent({
          authority: `https://login.microsoftonline.com/${tenantId}`,
          scopes: ["https://management.azure.com//.default"],
        }),
      ]).then(([graphTokenResponse, armTokenResponse]) => {
        setGraphToken(graphTokenResponse.accessToken);
        setArmToken(armTokenResponse.accessToken);
      });
    }
  }, [account, tenantId]);

  return {
    account,
    tenantId,
    isLoggedIn,
    graphToken,
    armToken,
    login,
    logout,
    switchTenant,
  };
}
