import * as msal from "@azure/msal-browser";
import { useBoolean } from "@fluentui/react-hooks";
import * as React from "react";

const config: msal.Configuration = {
  cache: {
    cacheLocation: "localStorage",
  },
  auth: {
    authority: "https://login.microsoftonline.com/common",
    clientId: "203f1145-856a-4232-83d4-a43568fba23d",
  },
};

if (process.env.NODE_ENV === "development") {
  config.auth.redirectUri = "https://dataexplorer-dev.azurewebsites.net";
}

const msalInstance = new msal.PublicClientApplication(config);

const cachedAccount = msalInstance.getAllAccounts()?.[0];
const cachedTenantId = localStorage.getItem("cachedTenantId");

interface ReturnType {
  isLoggedIn: boolean;
  graphToken: string;
  armToken: string;
  aadToken: string;
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
  const [aadToken, setAadToken] = React.useState<string>();

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
      console.log(account)
      Promise.all([
        msalInstance.acquireTokenSilent({
          authority: `https://login.microsoftonline.com/${tenantId}`,
          scopes: ["https://graph.windows.net//.default"],
        }),
        msalInstance.acquireTokenSilent({
          authority: `https://login.microsoftonline.com/${tenantId}`,
          scopes: ["https://management.azure.com//.default"],
        }),
        msalInstance.acquireTokenSilent({
          scopes: ["https://cosmos.azure.com/.default"],
        }),
      ]).then(([graphTokenResponse, armTokenResponse, aadTokenResponse]) => {
        setGraphToken(graphTokenResponse.accessToken);
        setArmToken(armTokenResponse.accessToken);
        setAadToken(aadTokenResponse.accessToken);
      });
    }
  }, [account, tenantId]);

  return {
    account,
    tenantId,
    isLoggedIn,
    graphToken,
    armToken,
    aadToken,
    login,
    logout,
    switchTenant,
  };
}
