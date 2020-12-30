import * as React from "react";
import * as Msal from "msal";
import { createContext, useState, useCallback } from "react";
import { useBoolean } from "@uifabric/react-hooks";

const defaultError = "Auth context method was called witout a AuthProvider component in the component tree";

const msal = new Msal.UserAgentApplication({
  auth: {
    authority: "https://login.microsoft.com/common",
    clientId: "203f1145-856a-4232-83d4-a43568fba23d",
    redirectUri: "https://dataexplorer-dev.azurewebsites.net"
  }
});

interface AuthContext {
  isLoggedIn: boolean;
  account?: Msal.Account;
  graphToken?: string;
  armToken?: string;
  logout: () => unknown;
  login: () => unknown;
}

export const AuthContext = createContext<AuthContext>({
  isLoggedIn: false,
  login: () => {
    throw Error(defaultError);
  },
  logout: () => {
    throw Error(defaultError);
  }
});

export const AuthProvider: React.FunctionComponent = ({ children }) => {
  const [isLoggedIn, { setTrue: setLoggedIn, setFalse: setLoggedOut }] = useBoolean(false);
  const [account, setAccount] = useState<Msal.Account>();
  const [graphToken, setGraphToken] = useState<string>();
  const [armToken, setArmToken] = useState<string>();

  const login = useCallback(() => {
    msal.loginPopup().then(response => {
      setLoggedIn();
      setAccount(response.account);
      msal
        .acquireTokenSilent({ scopes: ["https://graph.windows.net//.default"] })
        .then(resp => {
          setGraphToken(resp.accessToken);
        })
        .catch(e => {
          console.error(e);
        });
      msal
        .acquireTokenSilent({ scopes: ["https://management.azure.com//.default"] })
        .then(resp => {
          setArmToken(resp.accessToken);
        })
        .catch(e => {
          console.error(e);
        });
    });
  }, []);

  const logout = useCallback(() => {
    msal.logout();
    setLoggedOut();
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, account, login, logout, graphToken, armToken }}>
      {children}
    </AuthContext.Provider>
  );
};
