# Implementation Plan: Remove Phoenix & Notebooks

## Problem statement

Cosmos Explorer contains a large, deeply-integrated **notebooks** feature backed by
the **Phoenix** compute-container service and the **Juno** service, plus a **GitHub**
integration used to pin/browse notebook repositories. This functionality is being
retired. The goal is to remove all notebooks/Phoenix/Juno/GitHub-for-notebooks code,
dependencies, UI surfaces, telemetry, and configuration, while **preserving the
database shell terminals** (Mongo / Cassandra / Postgres / VCoreMongo), which today
share the Terminal infrastructure with notebooks.

This document is the implementation plan only. No code changes are made here.

## Scope decisions (confirmed)

- **Database shells**: Keep the Mongo/Cassandra/Postgres/VCoreMongo shells, but migrate
  them to use the **CloudShell** path exclusively. Remove the legacy Phoenix
  notebook-server shell path.
- **GitHub integration**: Remove entirely (it exists only for notebook pinned repos).
- **Schema Analyzer** (`src/Explorer/Notebook/SchemaAnalyzer`): Remove.
- **Phasing**: Every phase must leave the app in a **buildable, shippable** state
  (build + lint + strict compile + unit tests green; shells still work).
- **Localization**: Remove notebook/GitHub strings from **all** resource files —
  `src/Localization/en/Resources.json` **and** every non-English locale
  (`src/Localization/<locale>/Resources.json`). (This deletion is an exception to the
  usual convention of editing only the English file.)

## Prior art / related commits

This is a continuation of an in-progress removal effort. Reference commits:

- `7295d63a` — Remove gallery.html and all associated gallery functionality (#2474)
- `a36467f4` — Remove Phoenix `getDbAccountAllowedStatus`; `isPhoenixNotebooks`/
  `isPhoenixFeatures` now always `false` (#2472)
- `31385950` — removed NotebookViewer file (#2281)

> **Note:** An unmerged branch `users/jawelton/remove-notebooks-terminal-052126`
> already contains related work (`5989c77c` "Remove terminal.html webpack entry point
> and notebooks terminal code", `c7f9d7e3` "Switch VCore Mongo quickstart to use
> CloudShell terminal"). These are **not** in `master`. Reconcile with that branch
> before/while starting Phase 1 to avoid duplicate or conflicting work.

## Current-state survey (what exists today)

**Core directories / files**
- `src/Phoenix/PhoenixClient.ts` — container allocation, heartbeat, status polling.
- `src/Juno/JunoClient.ts` (+ test) — pinned-repo / notebook metadata service client.
- `src/Explorer/Notebook/` — the bulk of the feature:
  - `useNotebook.ts` (Zustand store), `NotebookManager.tsx`, `NotebookContentClient.ts`,
    `NotebookClientV2.ts`, `NotebookContainerClient.ts`, `NotebookContentItem.ts`,
    `NotebookUtil.ts`, `NTeractUtil.ts`, `FileSystemUtil.ts`
  - `NotebookComponent/` (nteract redux store, epics, reducers, content providers)
  - `NotebookRenderer/` (nteract cell rendering, decorators, outputs)
  - `SchemaAnalyzer/`, `SecurityWarningBar/`
- `src/Explorer/Controls/Notebook/NotebookTerminalComponent.tsx` (+ less/test)
- `src/Explorer/Controls/NotebookViewer/` — read-only viewer + metadata.
- `src/Explorer/Tabs/NotebookV2Tab.ts`, `NotebookTabBase.ts`, `SchemaAnalyzerTab.ts`
- `src/Explorer/Panes/CopyNotebookPane/`
- `src/Explorer/Tabs/ShellAdapters/NotebookTerminalComponentAdapter.tsx`
- `src/CellOutputViewer/` — webpack entry `cellOutputViewer`.
- `src/Utils/NotebookConfigurationUtils.ts`, `src/hooks/useNotebookSnapshotStore.ts`
- `src/Utils/arm/generatedClients/cosmosNotebooks/` — generated ARM client.

**GitHub integration (notebook-only)**
- `src/GitHub/` (`GitHubClient.ts`, `GitHubContentProvider.ts`, `GitHubOAuthService.ts`,
  `GitHubConnector.ts`), `src/Utils/GitHubUtils.ts`
- `src/Explorer/Controls/GitHub/` (AuthorizeAccess, AddRepo, GitHubRepos components)
- `src/Explorer/Panes/GitHubReposPanel/`
- webpack entry `connectToGitHub` + `src/connectToGitHub.html`

**Integration / glue points (edited, not deleted)**
- `src/Explorer/Explorer.tsx` — `phoenixClient`, `notebookManager`, `gitHubOAuthService`,
  `initNotebooks`, `initiateAndRefreshNotebookList`, `allocateContainer`,
  `openNotebook*`, `openNotebookTerminal`, `createNotebookContentItemFile`, etc.
- `src/Explorer/Menus/CommandBar/CommandBarComponentButtonFactory.tsx` (+ adapter, test)
  — New Notebook / Open Terminal / shell buttons branching on `isShellEnabled`.
- `src/Explorer/Tree/treeNodeUtil.tsx` / `ResourceTreeAdapter.tsx` / `ResourceTree.tsx`
  — "My Notebooks" / "GitHub" tree nodes; `isNotebookEnabled` plumbing.
- `src/Explorer/SplashScreen/SplashScreen.tsx` — notebook cards + `openNotebookTerminal`
  for Postgres/VCoreMongo shells.
- `src/Explorer/Tabs/TerminalTab.tsx` — chooses CloudShell vs notebook-server adapter.
- `src/Explorer/OpenActions/OpenActions.tsx`, `src/Explorer/ContextMenuButtonFactory.tsx`,
  `src/Explorer/Tree/Collection.ts`, `src/Explorer/useSelectedNode.ts`,
  `src/Explorer/MostRecentActivity/MostRecentActivity.ts`
- `src/hooks/useKnockoutExplorer.ts`, `src/hooks/useTabs.ts`
- `src/ConfigContext.ts`, `src/Common/Constants.ts`, `src/Contracts/DataModels.ts`,
  `src/Contracts/ViewModels.ts`, `src/Contracts/ActionContracts.ts`,
  `src/Platform/Hosted/extractFeatures.ts` (+ test)
- `src/Shared/Telemetry/TelemetryConstants.ts`
- `src/Localization/en/Resources.json` **and all non-English** `src/Localization/<locale>/Resources.json`
- `webpack.config.js` — `cellOutputViewer`, `connectToGitHub` entries + HTML plugins.
- `package.json` — `@nteract/*`, `@jupyterlab/*`, `@phosphor/widgets`, `rx-jupyter`,
  and other notebook-only dependencies.

**Critical coupling — Terminal / shells**
- `TerminalTab` uses `CloudShellTerminalComponentAdapter` when
  `userContext.features.enableCloudShell`, otherwise `NotebookTerminalComponentAdapter`
  (which needs a Phoenix-allocated notebook server + `terminal.html` iframe).
- Command-bar/splash shell buttons branch on
  `useNotebook.getState().isShellEnabled || userContext.features.enableCloudShell`.
- `Explorer.openNotebookTerminal(...)` is the shared entry for opening shells and must
  be retained (and rewired to CloudShell-only) — only its notebook-server behavior is
  removed.

## Phased approach

Each phase is independently buildable and shippable. Within each phase, **all
references to removed code are also removed** so the tree compiles. After every phase
run: `npm run compile`, `npm run compile:strict`, `npm run lint`, `npm run format:check`,
`npm test`, and a webpack build (`npm run build:ci`); manually verify the four shells
still open.

### Phase 1 — Decouple database shells to CloudShell-only ✅ COMPLETED
> **Status:** Completed and merged in `d19c7e0c` ("Remove Phoenix & Notebooks — Phase 1:
> Decouple database shells to CloudShell (#2513)").

Remove the legacy Phoenix notebook-server terminal path so shells no longer depend on
notebook provisioning.
- Rewire `TerminalTab` to always use `CloudShellTerminalComponentAdapter`; delete the
  `NotebookTerminalComponentAdapter` branch and `getNotebookServerInfo`.
- Delete `src/Explorer/Tabs/ShellAdapters/NotebookTerminalComponentAdapter.tsx` and
  `src/Explorer/Controls/Notebook/NotebookTerminalComponent.tsx` (+ less/test/snapshot).
- Simplify shell buttons in `CommandBarComponentButtonFactory` and `SplashScreen` to
  drop the `isShellEnabled` branch (CloudShell path only); keep `openNotebookTerminal`.
- Verify whether the `terminal`/`terminal.html` webpack entry is still needed by
  CloudShell. If unused, remove it and `src/Terminal/`; otherwise keep.
- **Outcome:** Shells run purely on CloudShell. Phoenix no longer needed for terminals.

### Phase 2 — Remove the in-app notebook authoring & rendering experience ✅ COMPLETED
> **Status:** Implemented on branch `users/jawelton/removenotebooks-phase2-061526`. Full
> verification sweep is green: `compile`, `compile:strict`, `lint` (0 errors), `format:check`,
> `test` (1945 passing), and `build:ci` (webpack) all pass.
>
> **Implementation notes / deviations:**
> - `src/Explorer/Panes/StringInputPane/` was also deleted — it became unused once
>   `Explorer.renameNotebook` / `onCreateDirectory` were removed.
> - Removing notebook-only npm deps stripped several **phantom (transitively-hoisted)**
>   packages that surviving code still imports, so these were re-added as explicit direct
>   dependencies: `xterm@4.19.0` + `xterm-addon-fit@0.5.0` (CloudShell), `d3-collection@1.0.7`
>   (Graph `D3ForceGraph`), and `@nteract/myths@0.1.9` (needed by kept `@nteract/core`).
> - Jest snapshots regenerated: `SettingsComponent`, `AddGlobalSecondaryIndexPanel`,
>   `GitHubReposPanel` (all just dropped the removed `copyNotebook` function from the
>   serialized Explorer); deleted-component snapshots removed with their dirs.
> - `CommandBarComponentButtonFactory` / `ContextMenuButtonFactory` required no notebook-button
>   removal — they only contained shell entries (kept).

Delete the notebook tabs, the nteract rendering engine, panes, the read-only viewer, and
Schema Analyzer (see decision below), and remove all UI entry points that open notebooks.

> **Cross-phase coupling — revised approach (confirmed):** Several files the original plan
> deferred to later phases are hard-coupled to the deletions above and must be handled here:
> - **Schema Analyzer is pulled forward from Phase 3 into Phase 2.** `SchemaAnalyzer.tsx`
>   renders through the nteract engine (`NotebookComponent/loadTransform`,
>   `NotebookRenderer/outputs/SandboxOutputs`) and `SchemaAnalyzerTab extends NotebookTabBase`,
>   so it cannot compile once the engine is deleted.
> - **`NotebookContentClient.ts` and `FileSystemUtil.ts` are deleted here** (they depend on
>   the deleted `@nteract` content providers and only serve removed authoring paths).
> - **`NotebookManager.tsx` / `useNotebook.ts` get minimal edits** (full deletion stays in
>   Phase 5): strip the content-provider / content-client / CopyNotebookPane / SchemaAnalyzer
>   usages, keeping the GitHub / Juno / `NotebookContainerClient` wiring later phases need.
> - **`NotebookContentItem.ts` and `NotebookUtil.ts` are DEFERRED, not deleted here.** They
>   are still used by the surviving `useNotebook` store and the "My Notebooks" tree
>   (`ResourceTreeAdapter`), and `NotebookUtil.getName`/`isNotebookFile` are still used by the
>   GitHub client/content provider. They are removed in Phase 4/5 with their consumers.

- Delete (engine/content): `src/Explorer/Notebook/NotebookComponent/`,
  `src/Explorer/Notebook/NotebookRenderer/`, `src/Explorer/Notebook/SecurityWarningBar/`,
  `NotebookClientV2.ts`, `notebookClientV2.test.ts`, `NotebookContentClient.ts`,
  `NTeractUtil.ts`, `FileSystemUtil.ts`.
- Delete (tabs/panes/viewer): `src/Explorer/Tabs/NotebookV2Tab.ts`, `NotebookTabBase.ts`,
  `src/Explorer/Panes/CopyNotebookPane/`, `src/Explorer/Controls/NotebookViewer/`,
  `src/CellOutputViewer/` (+ `cellOutputViewer` webpack entry & HTML/inline plugins).
- Delete (Schema Analyzer, pulled forward): `src/Explorer/Notebook/SchemaAnalyzer/` and
  `src/Explorer/Tabs/SchemaAnalyzerTab.ts`; remove its command-bar button and any tree/menu
  entry points.
- Edit to decouple survivors: `NotebookManager.tsx` (see note above), `Explorer.tsx`
  (remove `openNotebook*`, import/copy/rename/createDir/read/download/upload/delete/refresh
  notebook methods + `notebookToImport`; KEEP `openNotebookTerminal` /
  `connectToNotebookTerminal` and the Phoenix container methods for Phase 5),
  `ResourceTreeAdapter.tsx` (drop `NotebookV2Tab` import + open/copy actions; neutralize node
  click handlers — full "My Notebooks" tree removal remains Phase 5), `useTabs.ts` (drop
  `NotebookTabV2`), `Contracts/ViewModels.ts` (fix notebook-tab interfaces that break compile;
  keep `CollectionTabKind` enum values).
- Remove notebook entry points: "New Notebook"/open-notebook buttons in
  `CommandBarComponentButtonFactory` (+ test), `OpenActions.tsx` (`OpenSampleNotebook`),
  `ContextMenuButtonFactory.tsx`, splash-screen notebook cards & recent-notebook items
  (`MostRecentActivity` `OpenNotebook` type).
- `tsconfig.strict.json`: remove entries for deleted files (keep `NotebookContentItem.ts`).
- Remove from `package.json` ONLY the notebook-only deps with **zero** remaining importers
  after the deletions (e.g. `@jupyterlab/*`, `@phosphor/widgets`, and any `@nteract/*` not
  still used). DEFER `@nteract/core`, `@nteract/commutable`, and `rx-jupyter` (still imported
  by the kept `NotebookManager` / GitHub code) to Phase 4/5.
- Update/delete affected tests; regenerate Jest snapshots (`treeNodeUtil`,
  `SettingsComponent`, `StringInputPane`).
- **Outcome:** Notebooks and Schema Analyzer can no longer be authored, opened, or rendered.

### Phase 3 — (folded into Phase 2)
Schema Analyzer removal was pulled forward into Phase 2 because it is rendered by the nteract
engine deleted there. No separate work remains for this phase.

### Phase 4 — Remove GitHub integration ✅ COMPLETED
> **Status:** Implemented on branch `users/jawelton/removenotebooks-phase3-062226`. Full
> verification sweep is green: `compile`, `compile:strict`, `lint` (0 errors), `format:check`,
> `test` (1900 passing), and `build:ci` (webpack) all pass.
>
> **Implementation notes / deviations:**
> - **Localization was a no-op:** there are **zero** GitHub keys in any locale
>   `Resources.json`. The GitHub UI strings were hardcoded literals that were deleted with
>   their components, so no resource-file edits were needed.
> - **`JunoClient` was trimmed, not deleted** (deletion stays in Phase 6). Removed only the
>   GitHub-only members (`cachedPinnedRepos`, `subscribeToPinnedRepos`, `getPinnedRepos`,
>   `updatePinnedRepos`, `deleteGitHubInfo`, `getGitHubToken`, `deleteAppAuthorization`,
>   `getGitHubClientParams`, `IPinnedRepo`/`IPinnedBranch`) plus the now-orphaned private
>   helpers `getNotebooksSubscriptionIdAccountUrl`/`getAccount`/`getSubscriptionId` and the
>   `knockout` import. Kept the Schema (`requestSchema`/`getSchema`, used by `Database.tsx`)
>   and gallery methods. Deleted `JunoClient.test.ts` (it only covered removed GitHub methods).
> - **`src/Utils/JunoUtils.ts` (+ test) was also deleted** — its `toPinnedRepo`/`toGitHubRepo`
>   helpers only converted GitHub pinned-repo shapes and had no other consumers.
> - **`NotebookUtil.ts` (deferred to Phase 5) was edited here** to drop its `GitHubUtils`
>   dependency: the dead `github://` content-URI branches in `getFilePath`/`getParentPath`/
>   `getName`/`replaceName` were removed (its `isNotebookFile` consumer in `ResourceTreeAdapter`
>   is unaffected). `NotebookUtil.test.ts` lost its github-uri cases.
> - **`ConfigContext.ts`:** removed the GitHub-only config fields `GITHUB_CLIENT_ID`,
>   `GITHUB_TEST_ENV_CLIENT_ID`, `GITHUB_CLIENT_SECRET` (their only consumers were deleted).
> - **Telemetry deferred (as planned):** the `Action.NotebooksGitHub*` enum members were left
>   in `TelemetryConstants.ts` for the Phase 6 cleanup (enum-numbering-safe); only their
>   now-deleted usages were removed.

- Delete `src/GitHub/`, `src/Explorer/Controls/GitHub/`,
  `src/Explorer/Panes/GitHubReposPanel/`, `src/Utils/GitHubUtils.ts`,
  `src/connectToGitHub.html`, and the `connectToGitHub` webpack entry & HTML plugin.
- Remove `gitHubOAuthService`, GitHub pinned-repo wiring, and `gitHubNotebooksContentRoot`
  usage from `Explorer.tsx`, `useNotebook.ts`, `NotebookManager.tsx`, and `JunoClient`
  pinned-repo methods.
- Remove GitHub-related localization keys from **all** locale files (`en` + non-English).

### Phase 5 — Remove Phoenix and the notebook container/allocation core
- Delete `src/Phoenix/`, `src/Explorer/Notebook/NotebookContainerClient.ts`,
  `src/Explorer/Notebook/NotebookManager.tsx`, `src/Explorer/Notebook/useNotebook.ts`,
  `src/Explorer/Notebook/NotebookContentItem.ts`, `src/Explorer/Notebook/NotebookUtil.ts`
  (+ `NotebookUtil.test.ts`), `src/Utils/NotebookConfigurationUtils.ts`,
  `src/hooks/useNotebookSnapshotStore.ts`. (`NotebookContentItem.ts` and `NotebookUtil.ts`
  deletion was deferred from Phase 2 because the "My Notebooks" tree/store and the GitHub
  client still referenced them; remove them here once those consumers are gone. If GitHub
  was removed in Phase 4, `NotebookUtil`'s `getName`/`isNotebookFile` helpers were inlined
  there.)
- Remove from `Explorer.tsx`: `phoenixClient`, `notebookManager`, `_isInitializingNotebooks`,
  `initNotebooks`, `initiateAndRefreshNotebookList`, `refreshNotebookList`,
  `allocateContainer`, container heartbeat/connection logic, and notebook-server URL
  feature overrides.
- Remove notebook tree nodes ("My Notebooks") and `isNotebookEnabled` plumbing from
  `treeNodeUtil.tsx`, `ResourceTreeAdapter.tsx`, `ResourceTree.tsx`, `Collection.ts`,
  `useSelectedNode.ts` (+ update tree snapshots/tests).
- Remove notebook initialization from `useKnockoutExplorer.ts` and notebook tab handling
  in `useTabs.ts`.

### Phase 6 — Remove residual clients, config, contracts, telemetry & strings
- Delete `src/Juno/` and `src/Utils/arm/generatedClients/cosmosNotebooks/`.
- Remove notebook fields from `ConfigContext.ts`, `Constants.ts` (Notebook namespace),
  `DataModels.ts` (notebook/Phoenix/container interfaces), `ViewModels.ts`,
  `ActionContracts.ts`, and notebook feature flags from
  `extractFeatures.ts` (+ update test).
- Remove notebook/Phoenix telemetry actions/areas from `TelemetryConstants.ts` (preserve
  enum numbering if other systems depend on it — mirror the cautious approach in
  `a36467f4`).
- Remove remaining notebook strings from **all** locale `Resources.json` files (`en` +
  every non-English locale) and any notebook images (e.g. `images/notebook/`).
- Final full build + test sweep; update `EndpointUtils.ts` (`allowedNotebookServerUrls`)
  and any docs/comments referencing notebooks.

## Cross-cutting verification (run after each phase)

```
npm run compile
npm run compile:strict
npm run lint
npm run format:check
npm test
npm run build:ci
```
Plus manual smoke test: open Mongo, Cassandra, Postgres, and VCoreMongo shells.

## Notes & considerations

- **Strict null checks:** any file edited may need to stay in / be removed from
  `tsconfig.strict.json`. Remove deleted files from that list.
- **Snapshots:** several Jest snapshots reference notebook UI
  (`treeNodeUtil`, `SettingsComponent`, panel snapshots). Regenerate after edits.
- **Telemetry enum safety:** prior commit `a36467f4` deliberately reverted removal of
  enum values to avoid breaking downstream consumers. Prefer leaving enum numeric values
  intact unless confirmed safe to remove.
- **`enableCloudShell` feature flag:** confirm it is enabled in all target environments
  before removing the Phoenix shell fallback, or shells will break.
- **E2E tests:** check `test/` for notebook/terminal specs to update or remove; shells
  may have E2E coverage that needs the CloudShell-only path.
- **Reconcile** with branch `users/jawelton/remove-notebooks-terminal-052126` to avoid
  rework, especially in Phase 1.
