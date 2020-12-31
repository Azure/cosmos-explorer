import * as React from "react";
import * as Msal from "msal";
import { createContext, useState, useCallback } from "react";
import { useBoolean } from "@uifabric/react-hooks";

const defaultError = "Auth context method was called witout a AuthProvider component in the component tree";

const msal = new Msal.UserAgentApplication({
  auth: {
    authority: "https://login.microsoft.com/common",
    clientId: "203f1145-856a-4232-83d4-a43568fba23d",
    redirectUri: "https://dataexplorer-dev.azurewebsites.net" // TODO! This should only be set development
  }
});

interface AuthContext {
  isLoggedIn: boolean;
  account?: Msal.Account;
  graphToken?: string;
  armToken?: string;
  aadlogout: () => unknown;
  aadlogin: () => unknown;
}

export const AuthContext = createContext<AuthContext>({
  isLoggedIn: false,
  aadlogin: () => {
    throw Error(defaultError);
  },
  aadlogout: () => {
    throw Error(defaultError);
  }
});

export const AuthProvider: React.FunctionComponent = ({ children }) => {
  const [isLoggedIn, { setTrue: setLoggedIn, setFalse: setLoggedOut }] = useBoolean(false);
  const [account, setAccount] = useState<Msal.Account>();
  const [graphToken, setGraphToken] = useState<string>();
  const [armToken, setArmToken] = useState<string>();

  const aadlogin = useCallback(async () => {
    const response = await msal.loginPopup();
    setLoggedIn();
    setAccount(response.account);

    const [graphTokenResponse, armTokenResponse] = await Promise.all([
      msal.acquireTokenSilent({ scopes: ["https://graph.windows.net//.default"] }),
      msal.acquireTokenSilent({ scopes: ["https://management.azure.com//.default"] })
    ]);

    setGraphToken(graphTokenResponse.accessToken);
    setArmToken(armTokenResponse.accessToken);
  }, []);

  const aadlogout = useCallback(() => {
    msal.logout();
    setLoggedOut();
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, account, aadlogin, aadlogout, graphToken, armToken }}>
      {children}
    </AuthContext.Provider>
  );
};
