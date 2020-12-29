import { useMsal } from "@azure/msal-react";
import { useEffect, useState } from "react";
import { useAADAccount } from "./useAADAccount";

export function useAADToken(): string {
  const { instance } = useMsal();
  const account = useAADAccount();
  const [state, setState] = useState<string>();

  useEffect(() => {
    console.log("Current account", account);
    if (account) {
      instance.acquireTokenSilent({ account, scopes: ["User.Read"] }).then(response => {
        console.log("Fetched token", response.accessToken);
        setState(response.accessToken);
      });
    }
  }, [account]);
  return state;
}
