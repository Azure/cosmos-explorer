import { AuthType } from "./AuthType";
import Explorer from "./Explorer/Explorer";

declare global {
  interface Window {
    dataExplorer: Explorer;
    __REACT_DEVTOOLS_GLOBAL_HOOK__: any;
    $: any;
    jQuery: any;
    gitSha: string;
  }
}
