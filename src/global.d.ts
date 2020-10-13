import { AuthType } from "./AuthType";
import { PlatformType } from "./PlatformType";
import Explorer from "./Explorer/Explorer";

declare global {
  interface Window {
    authType: AuthType;
    dataExplorer: Explorer;
    __REACT_DEVTOOLS_GLOBAL_HOOK__: any;
    $: any;
    jQuery: any;
    gitSha: string;
  }
}
