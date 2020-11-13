# Cosmos DB Explorer

UI for Azure Cosmos DB. Powers the [Azure Portal](https://portal.azure.com/), https://cosmos.azure.com/, and the [Cosmos DB Emulator](https://docs.microsoft.com/en-us/azure/cosmos-db/local-emulator)

![](https://sdkctlstore.blob.core.windows.net/exe/dataexplorer.gif)

## Getting Started

- `npm install`
- `npm run build`

## Developing

### Watch mode

Run `npm run watch` to start the development server and automatically rebuild on changes

### Specifying Development Platform

Setting the environment variable `PLATFORM` during the build process will force the explorer to load the specified platform. By default in development it will run in `Hosted` mode. Valid options:

- Hosted
- Emulator
- Portal

`PLATFORM=Emulator npm run watch`

### Hosted Development

The default webpack dev server configuration will proxy requests to the production portal backend: `https://main.documentdb.ext.azure.com`. This will allow you to use production connection strings on your local machine.

To run pure hosted mode, in `webpack.config.js` change index HtmlWebpackPlugin to use hostedExplorer.html and change entry for index to use HostedExplorer.ts.

### Emulator Development

In a window environment, running `npm run build` will automatically copy the built files from `/dist` over to the default emulator install paths. In a non-windows environment you can specify an alternate endpoint using `EMULATOR_ENDPOINT` and webpack dev server will proxy requests for you.

`PLATFORM=Emulator EMULATOR_ENDPOINT=https://my-vm.azure.com:8081 npm run watch`

#### Setting up a Remote Emulator

The Cosmos emulator currently only runs in Windows environments. You can still develop on a non-Windows machine by setting up an emulator on a windows box and exposing its ports publicly:

1. Expose these ports publicly: 8081, 8900, 8979, 10250, 10251, 10252, 10253, 10254, 10255, 10256

2. Download and install the emulator: https://docs.microsoft.com/en-us/azure/cosmos-db/local-emulator

3. Start the emulator from PowerShell:

```
> cd C:/

> .\CosmosDB.Emulator.exe -AllowNetworkAccess -Key="<EMULATOR MASTER KEY>"
```

### Portal Development

The Cosmos Portal that consumes this repo is not currently open source. If you have access to this project, `npm run build` will copy the built files over to the portal where they will be loaded by the portal development environment

You can however load a local running instance of data explorer in the production portal.

1. Turn off browser SSL validation for localhost: chrome://flags/#allow-insecure-localhost OR Install valid SSL certs for localhost (on IE, follow these [instructions](https://www.technipages.com/ie-bypass-problem-with-this-websites-security-certificate) to install the localhost certificate in the right place)
2. Allowlist `https://localhost:1234` domain for CORS in the Azure Cosmos DB portal
3. Start the project in portal mode: `PLATFORM=Portal npm run watch`
4. Load the portal using the following link: https://ms.portal.azure.com/?dataExplorerSource=https%3A%2F%2Flocalhost%3A1234%2Fexplorer.html

Live reload will occur, but data explorer will not properly integrate again with the parent iframe. You will have to manually reload the page.

### Testing

#### Unit Tests

Unit tests are located adjacent to the code under test and run with [Jest](https://jestjs.io/):

`npm run test`

#### End to End CI Tests

[Cypress](https://www.cypress.io/) is used for end to end tests and are contained in `cypress/`. Currently, it operates as sub project with its own typescript config and dependencies. It also only operates against the emulator. To run cypress tests:

1. Ensure the emulator is running
2. Start cosmos explorer in emulator mode: `PLATFORM=Emulator npm run watch`
3. Move into `cypress/` folder: `cd cypress`
4. Install dependencies: `npm install`
5. Run cypress headless(`npm run test`) or in interactive mode(`npm run test:debug`)

#### End to End CI Tests

Jest and Puppeteer are used for end to end production runners and are contained in `test/`. To run these tests locally:

1. Copy .env.example to .env
2. Update the values in .env including your local data explorer endpoint (ask a teammate/codeowner for help with .env values)
3. Make sure all packages are installed `npm install`
4. Run the server `npm run start` and wait for it to start
5. Run `npm run test:e2e`

### Releasing

We generally adhere to the release strategy [documented by the Azure SDK Guidelines](https://azure.github.io/azure-sdk/policies_repobranching.html#release-branches). Most releases should happen from the master branch. If master contains commits that cannot be released, you may create a release from a `release/` or `hotfix/` branch. See linked documentation for more details.

# Contributing

Please read the [contribution guidelines](./CONTRIBUTING.md).
