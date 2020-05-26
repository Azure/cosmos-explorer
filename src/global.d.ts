import { AuthType } from "./AuthType";
import { PlatformType } from "./PlatformType";
import { Explorer } from "./Contracts/ViewModels";

declare global {
  interface Window {
    authType: AuthType;
    dataExplorerPlatform: PlatformType;
    dataExplorer: Explorer;
    __REACT_DEVTOOLS_GLOBAL_HOOK__: any;
    $: any;
    jQuery: any;
    gitSha: string;
  }
}
