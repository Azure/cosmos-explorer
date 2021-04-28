import { useBoolean } from "@uifabric/react-hooks";
import { Account, Configuration, UserAgentApplication } from "msal";
import * as React from "react";

const config: Configuration = {
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

const msal = new UserAgentApplication(config);

const cachedAccount = msal.getAllAccounts()?.[0];
const cachedTenantId = localStorage.getItem("cachedTenantId");

interface ReturnType {
  isLoggedIn: boolean;
  graphToken: string;
  armToken: string;
  aadToken: string;
  login: () => void;
  logout: () => void;
  tenantId: string;
  account: Account;
  switchTenant: (tenantId: string) => void;
}

export function useAADAuth(): ReturnType {
  const [isLoggedIn, { setTrue: setLoggedIn, setFalse: setLoggedOut }] = useBoolean(
    Boolean(cachedAccount && cachedTenantId) || false
  );
  const [account, setAccount] = React.useState<Account>(cachedAccount);
  const [tenantId, setTenantId] = React.useState<string>(cachedTenantId);
  const [graphToken, setGraphToken] = React.useState<string>();
  const [armToken, setArmToken] = React.useState<string>();
  const [aadToken, setAadToken] = React.useState<string>();

  const login = React.useCallback(async () => {
    const response = await msal.loginPopup();
    setLoggedIn();
    setAccount(response.account);
    setTenantId(response.tenantId);
    localStorage.setItem("cachedTenantId", response.tenantId);
  }, []);

  const logout = React.useCallback(() => {
    setLoggedOut();
    localStorage.removeItem("cachedTenantId");
    msal.logout();
  }, []);

  const switchTenant = React.useCallback(
    async (id) => {
      const response = await msal.loginPopup({
        authority: `https://login.microsoftonline.com/${id}`,
      });
      setTenantId(response.tenantId);
      setAccount(response.account);
    },
    [account, tenantId]
  );

  React.useEffect(() => {
    if (account && tenantId) {
      Promise.all([
        msal.acquireTokenSilent({
          // There is a bug in MSALv1 that requires us to refresh the token. Their internal cache is not respecting authority
          forceRefresh: true,
          authority: `https://login.microsoftonline.com/${tenantId}`,
          scopes: ["https://graph.windows.net//.default"],
        }),
        msal.acquireTokenSilent({
          // There is a bug in MSALv1 that requires us to refresh the token. Their internal cache is not respecting authority
          forceRefresh: true,
          authority: `https://login.microsoftonline.com/${tenantId}`,
          scopes: ["https://management.azure.com//.default"],
        }),
        msal.acquireTokenSilent({
          // There is a bug in MSALv1 that requires us to refresh the token. Their internal cache is not respecting authority
          forceRefresh: true,
          scopes: ["https://cosmos.azure.com//.default"],
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
