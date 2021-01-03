import * as React from "react";
import { useBoolean } from "@uifabric/react-hooks";
import { UserAgentApplication, Account } from "msal";

const msal = new UserAgentApplication({
  cache: {
    cacheLocation: "localStorage"
  },
  auth: {
    authority: "https://login.microsoft.com/common",
    clientId: "203f1145-856a-4232-83d4-a43568fba23d",
    redirectUri: "https://dataexplorer-dev.azurewebsites.net" // TODO! This should only be set in development
  }
});

const cachedAccount = msal.getAllAccounts()?.[0];
const cachedTenantId = localStorage.getItem("cachedTenantId");

interface ReturnType {
  isLoggedIn: boolean;
  graphToken: string;
  armToken: string;
  login: () => void;
  logout: () => void;
  tenantId: string;
  account: Account;
}

export function useAADAuth(): ReturnType {
  const [isLoggedIn, { setTrue: setLoggedIn, setFalse: setLoggedOut }] = useBoolean(
    Boolean(cachedAccount && cachedTenantId) || false
  );
  const [account, setAccount] = React.useState<Account>(cachedAccount);
  const [tenantId, setTenantId] = React.useState<string>(cachedTenantId);
  const [graphToken, setGraphToken] = React.useState<string>();
  const [armToken, setArmToken] = React.useState<string>();

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

  React.useEffect(() => {
    if (account && tenantId) {
      Promise.all([
        msal.acquireTokenSilent({
          scopes: ["https://graph.windows.net//.default"]
        }),
        msal.acquireTokenSilent({
          scopes: ["https://management.azure.com//.default"]
        })
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
    logout
  };
}
