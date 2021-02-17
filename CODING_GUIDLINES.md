# Coding Guidelines and Recommendations

Cosmos Explorer has been under constant development for over 5 years. As a result there are many different patterns and practices in the code base. This document serves as a guide to how we write code and helps avoid propagating practices which are no longer preferred. Each requirement in this document is labelled and color-coded to show the relative importance. In order from highest importance to lowest importance:

✅ DO this. If you feel you need an exception, engage with the project owners _prior_ to implementation.

⛔️ DO NOT do this. If you feel you need an exception, engage with the project owners _prior_ to implementation.

☑️ YOU SHOULD strongly consider this but it is not a requirement. If not following this advice, please comment code with why and proactively begin a discussion as part of the PR process.

⚠️ YOU SHOULD NOT strongly consider not doing this. If not following this advice, please comment code with why and proactively begin a discussion as part of the PR process.

💭 YOU MAY consider this advice if appropriate to your situation. Other team members may comment on this as part of PR review, but there is no need to be proactive.

## Development Environment

☑️ YOU SHOULD

- Use VSCode and install the following extensions. This setup will catch most linting/formatting/type errors as you develop:
  - [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
  - [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

💭 YOU MAY

- Use the [GitHub CLI](https://cli.github.com/). It has helpful workflows for submitting PRs as well as for checking out other team members PRs.
- Use Windows, Linux (including WSL), or OSX. We have team members developing on all three environments.

✅ DO

- Maintain cross platform compatability when modifying any engineering systems.

## Code Formatting

✅ DO

- Use [Prettier](https://prettier.io/) to format your code
  - This will be preformed automatically if using the recommended editor setup.
  - `npm run format` will also format code.

## Linting

✅ DO

- Use [ESLint](https://eslint.org/) to check for linting errors your code.
  - This will be preformed automatically if using the recommended editor setup.
  - `npm run lint` was also format your code

💭 YOU MAY

- Consider adding new lint rules.
  - If you find yourself performing "nits" as part of PR review, consider adding a lint rule that will autuomatically catch the error in the future

⚠️ YOU SHOULD NOT

- Disable lint rules
  - Lint rules exisst as guidance and to catch common mistakes.
  - You will find places we disable specific lint rules, but is should be exceptional.
  - If a rule does need to be disabled, prefer disabling a specific line instead of the entire file.

⛔️ DO NOT

- Add [TSLint](https://palantir.github.io/tslint/) rules
  - TSLint has been deprecated and is on track to be removed.
  - Always prefer ESLint rules.

## UI Components

☑️ YOU SHOULD

- Write new components using [React](https://reactjs.org/). We are actively migrating Cosmos Explorer off of [Knockout](https://knockoutjs.com/).
- Use [Fluent](https://developer.microsoft.com/en-us/fluentui#/) components.
  - These are highly accesible and composable.
  - They allow us to build upon the work of the Fluent team and leads to a lower total cost of ownership for our UI code.

### React

☑️ YOU SHOULD

- Use pure functional components when no state is required

💭 YOU MAY

- Use functional (hooks) or class components. The project contains examples of both and neither is strongly preferred right now.

⛔️ DO NOT

- Use inheritance for sharing component behavior.
  - The React documentation covers this topic in detail https://reactjs.org/docs/composition-vs-inheritance.html

## Libraries

⚠️ YOU SHOULD NOT

- Add new libraries to package.json.
  - Adding libraries has the possibility to bring in code that explodes our bundled size and/or attempts to run NodeJS code in the browser.
  - Consult with project owners for help with library selection if one is needed.

⛔️ DO NOT

- Use underscore
  - Much of this library is now native to JS and will be automatically transpiled
- Use jQuery
  - Much of this library is not native to the DOM.
  - We are planning to remove it

## Testing

⛔️ DO NOT

- Decrease test coverage.
  - Unit/Functional test coverage is checked as part of the CI process.

### Unit Tests

✅ DO

- Write unit tests for non-UI and utility code.
- Write your tests using [Jest](https://jestjs.io/)

☑️ YOU SHOULD

- Abstract non-UI and utility code so it can run either the NodeJS or Browser environment

### Functional(Component) Tests

✅ DO

- Write tests for UI components
- Write your tests using [Jest](https://jestjs.io/)
- Use either Enzyme or React Testing Library to perform component tests.

### Mocking

✅ DO

- Use Jest's built in mocking helpers

☑️ YOU SHOULD

- Write code that does not require mocking
- Build components that do not require mocking extremely large or difficult to mock objects (like Explorer.ts). Pass _only_ what you need.

⛔️ DO NOT

- Use sinon.js for mocking
  - Sinon has been deprecated and planned for removal

### End to End Tests

✅ DO

- Use [Puppeteer](https://developers.google.com/web/tools/puppeteer) and [Jest](https://jestjs.io/)
- Write or modify an existing E2E test that covers the primary use case of any major feature.
  - Use caution. Do not try to cover every case. End to End tests can be slow and brittle.

### Migrating Knockout to React

✅ DO

- Consult other team members before beginning migration work. There is a significant amount of flux in patterns we are using and it is important we do not propagate incorrect patterns.
- Start by converting HTML to JSX: https://magic.reactjs.net/htmltojsx.htm. Add functionality as a second step.

☑️ YOU SHOULD

- Write React components that require no dependency on knockout or observables to trigger rendering.

## Browser Support

✅ DO

- Support IE11
  - In practice this should not need to be considered as part of normal development workflow.
  - All polyfills and transpilation is already provided by our engineering systems.
  - This requirement will be removed on March 30th 2020 when Azure drops IE11 support.
