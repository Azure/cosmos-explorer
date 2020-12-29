import { AccountInfo } from "@azure/msal-browser";
import { useAccount, useMsal } from "@azure/msal-react";

export function useAADAccount(): AccountInfo {
  const { accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  return account;
}
