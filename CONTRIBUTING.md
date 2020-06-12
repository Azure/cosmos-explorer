# Contribution guidelines to Data Explorer

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Microsoft Open Source Code of Conduct
This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).

Resources:

- [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/)
- [Microsoft Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/)
- Contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with questions or concerns

## Browser support
Please make sure to support all modern browsers as well as Internet Explorer 11.
For IE support, polyfill is preferred over new usage of lodash or underscore. We already polyfill almost everything by importing babel-polyfill at the top of entry points.


## Coding guidelines, conventions and recommendations
### Typescript
* Follow this [typescript style guide](https://github.com/excelmicro/typescript) which is based on [airbnb's style  guide](https://github.com/airbnb/javascript).
* Conventions speficic to this project:
  * Use double-quotes for string
  * Don't use null, use undefined
  * Pascal case for private static readonly fields
  * Camel case for classnames in markup
* Don't use class unless necessary
* Code related to notebooks should be dynamically imported so that it is loaded from a separate bundle only if the account is notebook-enabled. There are already top-level notebook components which are dynamically imported and their dependencies can be statically imported from these files.

### React
* Prefer using React class components over function components and hooks unless you have a simple component and require no nested functions:
  * Nested functions may be harder to test independently
  * Switching from function component to class component later mayb be painful

## Testing
Any PR should not decrease testing coverage.

## Recommended Tools and VS Code extensions
* [Bookmarks](https://github.com/alefragnani/vscode-bookmarks)
* [Bracket pair colorizer](https://github.com/CoenraadS/Bracket-Pair-Colorizer-2)
* [GitHub Pull Requests and Issues](https://github.com/Microsoft/vscode-pull-request-github)