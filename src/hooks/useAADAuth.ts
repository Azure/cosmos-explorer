import * as msal from "@azure/msal-browser";
import { useBoolean } from "@fluentui/react-hooks";
import * as React from "react";
import { configContext } from "../ConfigContext";
import { getMsalInstance } from "../Utils/AuthorizationUtils";

const msalInstance = getMsalInstance();

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
    Boolean(cachedAccount && cachedTenantId) || false,
  );
  const [account, setAccount] = React.useState<msal.AccountInfo>(cachedAccount);
  const [tenantId, setTenantId] = React.useState<string>(cachedTenantId);
  const [graphToken, setGraphToken] = React.useState<string>();
  const [armToken, setArmToken] = React.useState<string>();

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

  React.useEffect(() => {
    if (account && tenantId) {
      Promise.all([
        msalInstance.acquireTokenSilent({
          authority: `${configContext.AAD_ENDPOINT}${tenantId}`,
          scopes: [`${configContext.GRAPH_ENDPOINT}/.default`],
        }),
        msalInstance.acquireTokenSilent({
          authority: `${configContext.AAD_ENDPOINT}${tenantId}`,
          scopes: [`${configContext.ARM_ENDPOINT}/.default`],
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
