# Cosmos DB Explorer

UI for Azure Cosmos DB. Powers the [Azure Portal](https://portal.azure.com/), https://cosmos.azure.com/, and the [Cosmos DB Emulator](https://docs.microsoft.com/en-us/azure/cosmos-db/local-emulator)


![](https://sdkctlstore.blob.core.windows.net/exe/dataexplorer.gif)

## Getting Started

- `npm install`
- `npm run build`

## Developing

### Watch mode

Run `npm start` to start the development server and automatically rebuild on changes

### Hosted Development (https://cosmos.azure.com)

- Visit: `https://localhost:1234/hostedExplorer.html`
- The default webpack dev server configuration will proxy requests to the production portal backend: `https://cdb-ms-mpac-pbe.cosmos.azure.com`. This will allow you to use production connection strings on your local machine.

### Emulator Development

- Start the Cosmos Emulator
- Visit: https://localhost:1234/index.html

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

- Visit: https://ms.portal.azure.com/?dataExplorerSource=https%3A%2F%2Flocalhost%3A1234%2Fexplorer.html
- You may have to manually visit https://localhost:1234/explorer.html first and click through any SSL certificate warnings

### Testing

#### Unit Tests

Unit tests are located adjacent to the code under test and run with [Jest](https://jestjs.io/):

`npm run test`

#### End to End CI Tests

Jest and Puppeteer are used for end to end browser based tests and are contained in `test/`. To run these tests locally:

1. Copy .env.example to .env
2. Update the values in .env including your local data explorer endpoint (ask a teammate/codeowner for help with .env values)
3. Make sure all packages are installed `npm install`
4. Run the server `npm run start` and wait for it to start
5. Run `npm run test:e2e`

### Releasing

We generally adhere to the release strategy [documented by the Azure SDK Guidelines](https://azure.github.io/azure-sdk/policies_repobranching.html#release-branches). Most releases should happen from the master branch. If master contains commits that cannot be released, you may create a release from a `release/` or `hotfix/` branch. See linked documentation for more details.

### Architecture

[![](https://mermaid.ink/img/eyJjb2RlIjoiZ3JhcGggTFJcbiAgaG9zdGVkKGh0dHBzOi8vY29zbW9zLmF6dXJlLmNvbSlcbiAgcG9ydGFsKFBvcnRhbClcbiAgZW11bGF0b3IoRW11bGF0b3IpXG4gIGFhZFtBQURdXG4gIHJlc291cmNlVG9rZW5bUmVzb3VyY2UgVG9rZW5dXG4gIGNvbm5lY3Rpb25TdHJpbmdbQ29ubmVjdGlvbiBTdHJpbmddXG4gIHBvcnRhbFRva2VuW0VuY3J5cHRlZCBQb3J0YWwgVG9rZW5dXG4gIG1hc3RlcktleVtNYXN0ZXIgS2V5XVxuICBhcm1bQVJNIFJlc291cmNlIFByb3ZpZGVyXVxuICBkYXRhcGxhbmVbRGF0YSBQbGFuZV1cbiAgcHJveHlbUG9ydGFsIEFQSSBQcm94eV1cbiAgc3FsW1NRTF1cbiAgbW9uZ29bTW9uZ29dXG4gIHRhYmxlc1tUYWJsZXNdXG4gIGNhc3NhbmRyYVtDYXNzYW5kcmFdXG4gIGdyYWZbR3JhcGhdXG5cblxuICBlbXVsYXRvciAtLT4gbWFzdGVyS2V5IC0tLS0-IGRhdGFwbGFuZVxuICBwb3J0YWwgLS0-IGFhZFxuICBob3N0ZWQgLS0-IHBvcnRhbFRva2VuICYgcmVzb3VyY2VUb2tlbiAmIGNvbm5lY3Rpb25TdHJpbmcgJiBhYWRcbiAgYWFkIC0tLT4gYXJtXG4gIGFhZCAtLS0-IGRhdGFwbGFuZVxuICBhYWQgLS0tPiBwcm94eVxuICByZXNvdXJjZVRva2VuIC0tLT4gc3FsIC0tPiBkYXRhcGxhbmVcbiAgcG9ydGFsVG9rZW4gLS0tPiBwcm94eVxuICBwcm94eSAtLT4gZGF0YXBsYW5lXG4gIGNvbm5lY3Rpb25TdHJpbmcgLS0-IHNxbCAmIG1vbmdvICYgY2Fzc2FuZHJhICYgZ3JhZiAmIHRhYmxlc1xuICBzcWwgLS0-IGRhdGFwbGFuZVxuICB0YWJsZXMgLS0-IGRhdGFwbGFuZVxuICBtb25nbyAtLT4gcHJveHlcbiAgY2Fzc2FuZHJhIC0tPiBwcm94eVxuICBncmFmIC0tPiBwcm94eVxuXG5cdFx0IiwibWVybWFpZCI6eyJ0aGVtZSI6ImRlZmF1bHQifSwidXBkYXRlRWRpdG9yIjpmYWxzZX0)](https://mermaid-js.github.io/mermaid-live-editor/#/edit/eyJjb2RlIjoiZ3JhcGggTFJcbiAgaG9zdGVkKGh0dHBzOi8vY29zbW9zLmF6dXJlLmNvbSlcbiAgcG9ydGFsKFBvcnRhbClcbiAgZW11bGF0b3IoRW11bGF0b3IpXG4gIGFhZFtBQURdXG4gIHJlc291cmNlVG9rZW5bUmVzb3VyY2UgVG9rZW5dXG4gIGNvbm5lY3Rpb25TdHJpbmdbQ29ubmVjdGlvbiBTdHJpbmddXG4gIHBvcnRhbFRva2VuW0VuY3J5cHRlZCBQb3J0YWwgVG9rZW5dXG4gIG1hc3RlcktleVtNYXN0ZXIgS2V5XVxuICBhcm1bQVJNIFJlc291cmNlIFByb3ZpZGVyXVxuICBkYXRhcGxhbmVbRGF0YSBQbGFuZV1cbiAgcHJveHlbUG9ydGFsIEFQSSBQcm94eV1cbiAgc3FsW1NRTF1cbiAgbW9uZ29bTW9uZ29dXG4gIHRhYmxlc1tUYWJsZXNdXG4gIGNhc3NhbmRyYVtDYXNzYW5kcmFdXG4gIGdyYWZbR3JhcGhdXG5cblxuICBlbXVsYXRvciAtLT4gbWFzdGVyS2V5IC0tLS0-IGRhdGFwbGFuZVxuICBwb3J0YWwgLS0-IGFhZFxuICBob3N0ZWQgLS0-IHBvcnRhbFRva2VuICYgcmVzb3VyY2VUb2tlbiAmIGNvbm5lY3Rpb25TdHJpbmcgJiBhYWRcbiAgYWFkIC0tLT4gYXJtXG4gIGFhZCAtLS0-IGRhdGFwbGFuZVxuICBhYWQgLS0tPiBwcm94eVxuICByZXNvdXJjZVRva2VuIC0tLT4gc3FsIC0tPiBkYXRhcGxhbmVcbiAgcG9ydGFsVG9rZW4gLS0tPiBwcm94eVxuICBwcm94eSAtLT4gZGF0YXBsYW5lXG4gIGNvbm5lY3Rpb25TdHJpbmcgLS0-IHNxbCAmIG1vbmdvICYgY2Fzc2FuZHJhICYgZ3JhZiAmIHRhYmxlc1xuICBzcWwgLS0-IGRhdGFwbGFuZVxuICB0YWJsZXMgLS0-IGRhdGFwbGFuZVxuICBtb25nbyAtLT4gcHJveHlcbiAgY2Fzc2FuZHJhIC0tPiBwcm94eVxuICBncmFmIC0tPiBwcm94eVxuXG5cdFx0IiwibWVybWFpZCI6eyJ0aGVtZSI6ImRlZmF1bHQifSwidXBkYXRlRWRpdG9yIjpmYWxzZX0)

# Contributing

Please read the [contribution guidelines](./CONTRIBUTING.md).
