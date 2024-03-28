import type * as monaco from "monaco-editor/esm/vs/editor/editor.api";
export type { monaco };

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const loadMonaco = () => import(/* webpackChunkName: "lazy-monaco" */ "monaco-editor/esm/vs/editor/editor.api");
export type MonacoNamespace = Awaited<ReturnType<typeof loadMonaco>>;
