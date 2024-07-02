import Explorer from "./Explorer/Explorer";

declare global {
  interface Window {
    /**
     * @deprecated
     * DO NOT take new usage of window.dataExplorer. If you must use Explorer, find it directly.
     * */
    dataExplorer: Explorer;
    __REACT_DEVTOOLS_GLOBAL_HOOK__: any;
    /**
     * @deprecated
     * No new usage of jQuery ($)
     * */
    $: any;
    gitSha: string;
  }

  // msSaveBlob has been removed from typescript 4.4, but not completely deprecated from browsers
  interface Navigator {
    msSaveBlob?: (blob: any, defaultName?: string) => boolean;
  }
}
