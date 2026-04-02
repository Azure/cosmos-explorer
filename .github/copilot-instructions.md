# Copilot Instructions for Cosmos Explorer

## Build, Test, and Lint

**To build the project, use the `/build` skill.** It handles dependency checks (`npm install`) and all build variants. See `.github/skills/build/SKILL.md` for full details.

Quick reference:

```bash
npm install              # Install dependencies (runs patch-package and i18n key generation automatically)
npm run build            # Full build: format check → lint → compile → strict compile → webpack prod → copy
npm run build:ci         # CI build: same as above but uses webpack dev mode (faster)
npm start                # Dev server with hot reload at https://localhost:1234

npm run compile          # TypeScript check only (no emit)
npm run compile:strict   # TypeScript strict mode check (subset of files in tsconfig.strict.json)
npm run lint             # ESLint across all .ts/.tsx files
npm run format           # Prettier format (write)
npm run format:check     # Prettier format (check only)
```

### Testing

**To run unit tests, use the `/run-unit-tests` skill.** It handles dependency checks and all test variants. See `.github/skills/run-unit-tests/SKILL.md` for full details.

Quick reference:

```bash
npm test                 # Run all unit tests with Jest (includes coverage)
npm run test:file -- path/to/file.test.ts   # Run a single test file (no coverage)
npm run test:debug       # Run tests serially for debugging (--runInBand)

# E2E tests (requires .env config and running dev server)
npm run test:e2e         # Playwright E2E tests
npx playwright test test/sql/document.spec.ts  # Run a single E2E spec
```

Unit tests live adjacent to source files (`*.test.ts` / `*.test.tsx` in `src/`). E2E tests are in `test/` organized by API type (sql, mongo, cassandra, gremlin, tables).

## Architecture

### Platform Modes

The app runs in four hosting contexts, determined by `ConfigContext.platform`:
- **Portal** – Embedded as an iframe inside Azure Portal
- **Hosted** – Standalone at cosmos.azure.com, supports AAD, connection string, and resource token auth
- **Emulator** – Connects to local Cosmos DB Emulator via master key
- **Fabric** – Embedded in Microsoft Fabric, communicates via postMessage RPC

Platform-specific code lives in `src/Platform/{Emulator,Hosted,Fabric}/`. The active platform is set during initialization in `src/hooks/useKnockoutExplorer.ts`, which orchestrates bootstrapping for all modes.

### Global State (Module Singletons + Zustand)

State is **not** managed by React Context or Redux for most application concerns. Instead:

- **`userContext`** (`src/UserContext.ts`) – Module-level singleton holding current account info, auth tokens, API type, and feature flags. Updated via `updateUserContext()`. Not a React store; components read it directly.
- **`configContext`** (`src/ConfigContext.ts`) – Module-level singleton for environment/endpoint configuration. Updated via `updateConfigContext()`.
- **Zustand stores** (`src/hooks/use*.ts`) – Used for UI state that React components need to subscribe to reactively. Key stores:
  - `useDatabases` – Database/collection tree state
  - `useTabs` – Open tab management
  - `useQueryCopilot` – Copilot query assistant state
  - `useNotificationConsole` – Console notifications
  - `useSidePanel` – Side panel visibility
  - `useSelectedNode` – Currently selected tree node

### Data Access Layer

`src/Common/dataAccess/` contains all Cosmos DB CRUD operations (createCollection, readDatabases, queryDocuments, etc.). These functions call either the Cosmos SDK (`@azure/cosmos`) directly or go through proxy endpoints depending on the API type and auth method.

ARM (Azure Resource Manager) clients are auto-generated in `src/Utils/arm/generatedClients/` — regenerate with `npm run generateARMClients`.

### Multi-API Support

Cosmos DB supports multiple APIs: SQL, Mongo, Gremlin, Tables, Cassandra, Postgres, and VCoreMongo. The current API type is determined from `userContext.apiType` (derived from the database account's capabilities). API-specific UI components branch on this value.

### Entry Points

Webpack builds multiple independent entry points (see `webpack.config.js`):
- `src/Main.tsx` → `explorer.html` (Portal iframe)
- `src/Index.tsx` → `index.html` (Emulator)
- `src/HostedExplorer.tsx` → `hostedExplorer.html` (cosmos.azure.com)
- Plus: terminal, cellOutputViewer, galleryViewer, selfServe, connectToGitHub, quickstart

### Knockout → React Migration

The codebase is actively migrating from Knockout.js to React. Legacy Knockout code still exists (observables, bindings), but all new UI must be React. The main `Explorer` class (`src/Explorer/Explorer.tsx`) is a large legacy class that orchestrates much of the app — it is not a React component but interacts with React via hooks and stores.

## Key Conventions

### Ignored Directories

The `src/preview/` folder is a separate project and should not be modified or referenced.

### Localization

All user-facing strings must be defined in `src/Localization/en/Resources.json` and referenced via the type-safe `t()` helper:
```typescript
import { t } from "Localization/t";

// Use dot-notation keys matching the JSON structure
const label = t("common.save");
const title = t("splashScreen.title.default");
```
The `ResourceKey` type (derived from `Resources.json`) ensures compile-time safety — invalid keys will cause a type error. When adding new strings, add the English entry to `Resources.json` first, then reference it with `t()`.

### Imports

TypeScript `baseUrl` is set to `src/`, so imports from `src/` are written without a leading `./src/` prefix:
```typescript
import { userContext } from "UserContext";         // src/UserContext.ts
import { configContext } from "ConfigContext";      // src/ConfigContext.ts
import { readDatabases } from "Common/dataAccess/readDatabases";
```

### React Components

- Use **Fluent UI v9** (`@fluentui/react-components`) for new components. Legacy code uses v8 (`@fluentui/react`), but new code should prefer v9.
- Prefer pure functional components; hooks and class components are both acceptable
- Do **not** use component inheritance for shared behavior
- Do **not** suffix file or component names with "Component"

### ESLint Rules to Note

- `no-console`: Only `console.error` and `console.warn` are allowed (not `console.log`)
- `@typescript-eslint/no-explicit-any`: Error — avoid `any` types
- `prefer-arrow/prefer-arrow-functions`: Arrow functions preferred (standalone declarations allowed)
- `eqeqeq`: Strict equality required
- `@typescript-eslint/switch-exhaustiveness-check`: Switch statements must handle all cases
- Do not use `JSON.stringify(error)` — it prints `'{}'`. The linter catches variable names matching `$err`.

### Testing

Any code change should consider both unit and E2E test coverage:

- **Unit tests** – Write or update unit tests for all logic, utility, and component changes. Place test files adjacent to the source file (`Foo.test.ts` next to `Foo.ts`). Do not decrease existing coverage.
- **E2E tests** – Write or update a Playwright E2E test when a change affects a user-facing workflow (e.g., creating a container, running a query, editing a document). E2E tests live in `test/` organized by API type.

Tooling and conventions:
- Use **Jest** for unit tests with `jest-environment-jsdom`
- Use `@testing-library/react` for new component tests. Enzyme exists in legacy tests but should not be used for new code.
- Use Jest built-in mocking (not sinon.js)
- E2E tests use **Playwright** (configured in `playwright.config.ts`); use accessible attributes (role, title, label) over `data-*` attributes for selectors

### Strict Null Checks

The project is incrementally adopting strict null checks. `tsconfig.strict.json` lists files that compile under `--strictNullChecks`. **New files must be added to `tsconfig.strict.json`** so they compile under strict mode. Use `npm run strict:add` to add eligible files.

### Libraries to Avoid

- **underscore.js** – Use native JS methods instead (legacy usage exists)
- **jQuery** – Being removed; do not add new usage
- **sinon.js** – Deprecated; use Jest mocking
- **TSLint** – Removed; use ESLint only

### Formatting

Prettier with `printWidth: 120` and `endOfLine: auto`. Format is enforced in the build pipeline via `npm run format:check`.
