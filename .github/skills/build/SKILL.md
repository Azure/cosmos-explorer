---
name: build
description: Build the Cosmos Explorer project. Use this skill when asked to build, compile, or check the build status of the project.
allowed-tools: shell
---

# Build Skill

Use the following commands to build the Cosmos Explorer project. Choose the appropriate command based on the task.

## Full Production Build

Run a complete production build (format check → lint → compile → strict compile → webpack prod → copy):

```bash
npm run build
```

## CI Build (Faster)

Run a CI build that uses webpack dev mode for faster bundling:

```bash
npm run build:ci
```

## TypeScript Compile Only

Run a TypeScript type-check without emitting output:

```bash
npm run compile
```

## Strict TypeScript Compile

Run a strict null-checks compile on the subset of files in `tsconfig.strict.json`:

```bash
npm run compile:strict
```

## Lint Only

Run ESLint across all `.ts` and `.tsx` files:

```bash
npm run lint
```

## Format Check

Run Prettier to verify formatting without modifying files:

```bash
npm run format:check
```

## Pre-Build: Check Dependencies

Before running any build command, check whether `npm install` needs to be run. Do this by comparing `package.json` and `package-lock.json` against the installed `node_modules`:

1. Check if the `node_modules` directory exists. If it does not, run `npm install`.
2. If `node_modules` exists, check whether `package.json` or `package-lock.json` have been modified more recently than `node_modules`. If so, run `npm install`.

```bash
# Check if node_modules is missing or outdated
if [ ! -d node_modules ] || [ package.json -nt node_modules ] || [ package-lock.json -nt node_modules ]; then
  npm install
fi
```

On Windows PowerShell:

```powershell
if (-not (Test-Path node_modules) -or
    (Get-Item package.json).LastWriteTime -gt (Get-Item node_modules).LastWriteTime -or
    (Get-Item package-lock.json).LastWriteTime -gt (Get-Item node_modules).LastWriteTime) {
    npm install
}
```

Always run this check before proceeding with any build command.

## Guidelines

- When asked to simply "build", run `npm run build` for a full production build.
- When asked for a quick or fast build, use `npm run build:ci`.
- When asked to just check types, use `npm run compile`.
- If the build fails, read the error output carefully. Common issues include:
  - **TypeScript errors**: Fix type errors shown in the `npm run compile` output.
  - **Strict null-check errors**: Fix strict errors shown in `npm run compile:strict` output.
  - **Lint errors**: Fix lint issues shown in `npm run lint` output.
  - **Format errors**: Run `npm run format` to auto-fix formatting, then retry the build.
- New files must be added to `tsconfig.strict.json` so they compile under strict mode.
