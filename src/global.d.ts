import { AuthType } from "./AuthType";
import Explorer from "./Explorer/Explorer";

declare global {
  interface Window {
    authType: AuthType;
    dataExplorer: any;
    __REACT_DEVTOOLS_GLOBAL_HOOK__: any;
    $: any;
    jQuery: any;
    gitSha: string;
  }
}
