import { PageWaitForSelectorOptions, PlaywrightMatchers } from "expect-playwright";
import Explorer from "./Explorer/Explorer";

declare global {
  namespace jest {
    interface Matchers<R> extends PlaywrightMatchers<R> {
      toHaveFocus(selector: string, options?: PageWaitForSelectorOptions): Promise<R>;
      toHaveTextContent(htmlElement: string): object;
      toHaveValue(value: string | string[] | number): object;
    }
  }
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
    /**
     * @deprecated
     * No new usage of jQuery
     * */
    jQuery: any;
    gitSha: string;
  }
}
