# Coding Guidelines and Recommendations

Cosmos Explorer has been under constant development for over 5 years. As a result, there are many different patterns and practices in the codebase. This document serves as a guide to how we write code and helps avoid propagating practices which are no longer preferred. Each requirement in this document is labeled and color-coded to show the relative importance. In order from highest to lowest importance:

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

- Use the [GitHub CLI](https://cli.github.com/). It has helpful workflows for submitting PRs as well as for checking out other team member's PRs.
- Use Windows, Linux (including WSL), or OSX. We have team members developing on all three environments.

✅ DO

- Maintain cross-platform compatibility when modifying any engineering or build systems

## Code Formatting

✅ DO

- Use [Prettier](https://prettier.io/) to format your code
  - This will occur automatically if using the recommended editor setup
  - `npm run format` will also format code

## Linting

✅ DO

- Use [ESLint](https://eslint.org/) to check for code errors.
  - This will occur automatically if using the recommended editor setup
  - `npm run lint` will also check for linting errors

💭 YOU MAY

- Consider adding new lint rules.
  - If you find yourself performing "nits" as part of PR review, consider adding a lint rule that will automatically catch the error in the future

⚠️ YOU SHOULD NOT

- Disable lint rules
  - Lint rules exist as guidance and to catch common mistakes
  - You will find places we disable specific lint rules however it should be exceptional.
  - If a rule does need to be disabled, prefer disabling a specific line instead of the entire file.

⛔️ DO NOT

- Add [TSLint](https://palantir.github.io/tslint/) rules
  - TSLint has been deprecated and is on track to be removed
  - Always prefer ESLint rules

## UI Components

☑️ YOU SHOULD

- Write new components using [React](https://reactjs.org/). We are actively migrating Cosmos Explorer off of [Knockout](https://knockoutjs.com/).
- Use [Fluent](https://developer.microsoft.com/en-us/fluentui#/) components.
  - Fluent components are designed to be highly accessible and composable
  - Using Fluent allows us to build upon the work of the Fluent team and leads to a lower total cost of ownership for UI code

### React

☑️ YOU SHOULD

- Use pure functional components when no state is required

💭 YOU MAY

- Use functional (hooks) or class components
  - The project contains examples of both
  - Neither is strongly preferred at this time

⛔️ DO NOT

- Use inheritance for sharing component behavior.
  - React documentation covers this topic in detail https://reactjs.org/docs/composition-vs-inheritance.html
- Suffix your file or component name with "Component"
  - Even though the code has examples of it, we are ending the practice.

## Libraries

⚠️ YOU SHOULD NOT

- Add new libraries to package.json.
  - Adding libraries may bring in code that explodes the bundled size or attempts to run NodeJS code in the browser
  - Consult with project owners for help with library selection if one is needed

⛔️ DO NOT

- Use underscore.js
  - Much of this library is now native to JS and will be automatically transpiled
- Use jQuery
  - Much of this library is not native to the DOM.
  - We are planning to remove it

## Testing

⛔️ DO NOT

- Decrease test coverage
  - Unit/Functional test coverage is checked as part of the CI process

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

- Use Jest's built-in mocking helpers

☑️ YOU SHOULD

- Write code that does not require mocking
- Build components that do not require mocking extremely large or difficult to mock objects (like Explorer.ts). Pass _only_ what you need.

⛔️ DO NOT

- Use sinon.js for mocking
  - Sinon has been deprecated and planned for removal

### End to End Tests

✅ DO

- Use [Playwright](https://github.com/microsoft/playwright) and [Jest](https://jestjs.io/)
- Write or modify an existing E2E test that covers the primary use case of any major feature.
  - Use caution. Do not try to cover every case. End to End tests can be slow and brittle.

☑️ YOU SHOULD

- Write tests that use accessible attributes to perform actions. Role, Title, Label, etc
  - More information https://testing-library.com/docs/queries/about#priority

⚠️ YOU SHOULD NOT

- Add test specfic `data-*` attributes to dom elements
  - This is a common current practice, but one we would like to avoid in the future
  - End to end tests need to use semantic HTML and accesible attributes to be truely end to end
  - No user or screen reader actually navigates an app using `data-*` attributes
- Add arbitrary time delays to wait for page to render or element to be ready.
  - All the time delays add up and slow down testing.
  - Prefer using the framework's "wait for..." functionality.

### Migrating Knockout to React

✅ DO

- Consult other team members before beginning migration work. There is a significant amount of flux in patterns we are using and it is important we do not propagate incorrect patterns.
- Start by converting HTML to JSX: https://magic.reactjs.net/htmltojsx.htm. Add functionality as a second step.

☑️ YOU SHOULD

- Write React components that require no dependency on Knockout or observables to trigger rendering.

## Browser Support

✅ DO

- Support all [browsers supported by the Azure Portal](https://docs.microsoft.com/en-us/azure/azure-portal/azure-portal-supported-browsers-devices)
- Support IE11
  - In practice, this should not need to be considered as part of a normal development workflow
  - Polyfills and transpilation are already provided by our engineering systems.
  - This requirement will be removed on March 30th, 2021 when Azure drops IE11 support.
