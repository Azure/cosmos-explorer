---
name: run-unit-tests
description: Run unit tests for the Cosmos Explorer project. Use this skill when asked to run tests, check test results, or debug test failures.
allowed-tools: shell
---

# Test Skill

Use the following commands to run unit tests for the Cosmos Explorer project.

## Pre-Test: Check Dependencies

Before running tests, check whether `npm install` needs to be run:

```bash
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

Always run this check before proceeding with any test command.

## Run All Unit Tests

Run the full test suite with coverage:

```bash
npm test
```

This clears the `coverage/` directory and runs Jest with coverage collection enabled.

## Run a Single Test File

Run a specific test file without coverage (faster):

```bash
npm run test:file -- path/to/file.test.ts
```

## Run Tests in Debug Mode

Run tests serially (useful for debugging flaky or interdependent tests):

```bash
npm run test:debug
```

## Run Tests Matching a Pattern

Run only tests whose names match a pattern:

```bash
npx jest --coverage=false --testPathPattern="SomeComponent"
```

## Guidelines

- When asked to simply "run tests" or "test", run `npm test` for the full suite.
- When asked to test a specific file or component, use `npm run test:file -- <path>`.
- When debugging test failures, use `npm run test:debug` to run serially.
- Unit test files live adjacent to source files (`Foo.test.ts` next to `Foo.ts` in `src/`).
- Tests use **Jest** with `jest-environment-jsdom`.
- Use `@testing-library/react` for new component tests. Do not use Enzyme for new tests.
- Use Jest built-in mocking, not sinon.js.
- Coverage thresholds are enforced globally: branches 25%, functions 24%, lines 28%, statements 28%.
- If tests fail, read the error output carefully. Common issues include:
  - **Snapshot mismatches**: Review the diff. If the change is intentional, update snapshots with `npx jest --updateSnapshot`.
  - **Mock issues**: Ensure mocks are set up correctly and reset between tests.
  - **Import errors**: Check that module name mappings in `jest.config.js` are correct.
  - **Type errors in tests**: Run `npm run compile` to check for TypeScript issues.
