# Coding Guidelines and Recommendations

The Stack:

- Language: [TypeScript](https://www.typescriptlang.org/)
- Framework: [React](https://reactjs.org/) + [Knockout](https://knockoutjs.com/)(Deprecated)
- Bundler: [Webpack](https://webpack.js.org/)
- Unit Test Runner: [Jest](https://jestjs.io/)
- Code Formatter: [Prettier](https://prettier.io/)
- Component Framework: [Fluent](https://developer.microsoft.com/en-us/fluentui#/)
- Linter: [ESLint](https://eslint.org/) + [TSLint](https://palantir.github.io/tslint/)(Deprecated)
- End to End Test Runner: [Jest](https://jestjs.io/)
- End to End Test Framework: [Puppeteer](https://developers.google.com/web/tools/puppeteer)
- Transpiler: [Babel](https://babeljs.io/) + [TypeScript](https://www.typescriptlang.org/)

## Requirements

Cosmos Explorer has been under constant development for over 5 years. As a result there are many different patterns and practices in the code base. This document serves as a guide to how we write code and helps avoid propagating practices which are no longer preferred. Each requirement in this document is labelled and color-coded to show the relative importance. In order from highest importance to lowest importance:

✅ DO this. If you feel you need an exception, engage with the project owners _prior_ to implementation.

⛔️ DO NOT do this. If you feel you need an exception, engage with the project owners _prior_ to implementation.

☑️ YOU SHOULD strongly consider this but it is not a requirement. If not following this advice, please comment code with why and proactively begin a discussion as part of the PR process.

⚠️ YOU SHOULD NOT strongly consider not doing this. If not following this advice, please comment code with why and proactively begin a discussion as part of the PR process.

💭 YOU MAY consider this advice if appropriate to your situation. Other team members may comment on this as part of PR review, but there is no need to be proactive.

## Development Environment

☑️ YOU SHOULD use VSCode and install the following extensions:

- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

This setup will catch most linting/formatting/type errors as you develop.

☑️ YOU SHOULD use the [GitHub CLI](https://cli.github.com/). It has helpful workflows for submitting PRs as well as for checking out other team members PRs.

✔️ YOU MAY use Windows, Linux (including WSL), or OSX. We have team members on all three environments. When modifying any engineering systems please keep cross platform compatability in mind.

## Formatting

✅ DO use [Prettier](https://prettier.io/) to format your code. This will be preformed automatically if using the recommended editor setup. Otherwise `npm run format` will also format code.

## Linting

✅ DO use [ESLint](https://eslint.org/) to check for linting errors your code. This can also be performed by `npm run lint`

✔️ YOU MAY consider adding new lint rules. If you find yourself performing "nits" as part of PR review, consider if it is possible to add a lint rule that will autuomatically catch the error in the future

⚠️ YOU SHOULD NOT disable any lint rules. They are there as guidance and to catch common mistakes. You will find places we disable specific lint rules, but is should be exceptional. If a rule does need to be disabled, prefer disabling a specific line instead of the entire file.

⛔️ DO NOT add any tslint rules. TSLint has been deprecated and is on track to be removed. Always prefer ESLint rules.

## UI Components

☑️ YOU SHOULD write new components using React. We are actively migrating Cosmos Explorer off of Knockout.

☑️ YOU SHOULD use Fluent UI components. These are highly accesible and composable. They allow us to build upon the work of the Fluent team and lead to a lower total cost of ownership for our UI code.

### React

⛔️ DO NOT use inheritance for sharing component behavior. The React documentation covers this topic in detail https://reactjs.org/docs/composition-vs-inheritance.html

☑️ YOU SHOULD use pure functional components when no state is required

✔️ YOU MAY consider using functional (hooks) or class components. The project contains examples of both and neither is strongly preferred right now.

## Libraries

⛔️ DO NOT add new libraries to package.json. Adding libraries has the possibility to bring in code that explodes our bundled size and/or attempts to run NodeJS code in the browser. Consult with project owners first.

## Testing

⛔️ DO NOT decrease test coverage. Unit/Functional test coverage is checked as part of the CI process.

### Unit Tests

✅ DO write unit tests for non-UI and utility code.

☑️ YOU SHOULD abstract non-UI and utility code so it can run either the NodeJS or Browser environment

### Functional(Component) Tests

✅ DO write tests for UI components

✅ DO use either Enzyme or React Testing Library to perform component tests.

### Mocking

☑️ YOU SHOULD write code that does not require mocking

☑️ YOU SHOULD build components that do not require mocking extremely large or difficult to mock objects (like Explorer.ts). Pass _only_ what you need.

✅ DO use Jest's built in mocking helpers

⛔️ DO NOT use sinon.js for mocking. Sinon has been deprecated and scheduled for removal.

### End to End Tests

End to end tests are run using puppeteer in a fully headless browser instance.

☑️ YOU SHOULD try to E2E tests that cover the primary use case of any major feature. Use caution. End to End tests can be slow and brittle.

### Migrating Knockout to React

✅ DO consult other team members before beginning migration work. There is a significant amount of flux in the patterns we are using and it is important we do not propagate incorrect patterns.

✅ DO start by converting HTML to JSX: https://magic.reactjs.net/htmltojsx.htm. Add functionality as a second step.

☑️ YOU SHOULD write React components that require no dependency on knockout or observables to trigger rendering.

## Browser Support

✅ DO support IE11. In practice this should not need to be considered as part of normal development workflow. All polyfills and transpilation is already provided by our engineering systems. This requirement will be removed on March 30th 2020 when Azure drops IE11 support.
