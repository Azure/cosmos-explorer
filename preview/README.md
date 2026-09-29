# Cosmos Explorer Preview

Cosmos Explorer Preview makes it possible to try a working version of any commit on master or in a PR. No need to run the app locally or deploy to staging.

Initial support is for Hosted (Connection string only) or the Azure Portal. Examples:

Connection string URLs: https://dataexplorer-preview.azurewebsites.net/commit/COMMIT_SHA/hostedExplorer.html
Portal URLs: https://ms.portal.azure.com/?dataExplorerSource=https://dataexplorer-preview.azurewebsites.net/commit/COMMIT_SHA/explorer.html#home

In both cases replace `COMMIT_SHA` with the commit you want to view. It must have already completed its build on GitHub Actions.

### Architechture

- This folder contains a NodeJS app deployed to Azure App Service that powers preview URLs:
  - Paths starting with `/commit/` are proxied to an Azure Storage account containing build artifacts
  - Paths starting with `/proxy/` are proxied dynamically to Cosmos account endpoints. Required otherwise CORS would need to be configured for every account accessed.
  - Paths starting with `/api/` are proxied to Portal APIs that do not support CORS.
- On GitHub Actions build completion:
  - All files in dist are uploaded to an Azure Storage account namespaced by the SHA of the commit
  - `/preview/config.json` is uploaded to the same folder with preview specific configuration

### Authentication callback

Preview DE builds select `/redirectBridge.html` on the preview origin as their MSAL callback.
The preview host serves that page and its bundled scripts at the root, independently of the
`/commit/<SHA>/` routes. `webpack.redirectBridge.config.js` bundles the existing
`src/redirectBridge.ts` and HTML template using the repository's locked MSAL/build dependencies.
It does not change production, MPAC, or local-development callback selection.

From the repository root:

```sh
npm ci
npm ci --prefix preview
npm test --prefix preview
npm start --prefix preview
```

`npm test` builds the bridge before running the host tests. To build without testing, run
`npm run build:bridge --prefix preview`. Generated files are placed in `preview/redirect-bridge/`
and must be included in the preview host deployment. The server fails at startup if the bridge
has not been built. The existing `npm run deploy --prefix preview` command now builds the bridge
before deploying; only run it with deployment approval. It requires the repository-root build
dependencies, so build the deployment artifact from a full checkout rather than the preview
folder alone.

Rebuild and redeploy the host bridge when upgrading MSAL in preview builds, and verify
compatibility with the DE versions still being previewed; all commit previews share this callback.

Deploying a PR's `dist` files to its commit folder does **not** update these root routes.
This change requires a separate preview App Service deployment. Serve the callback HTML and
scripts from the preview origin, with `Cache-Control: no-store` and without
`Cross-Origin-Opener-Policy`. Ensure any front-end proxy preserves these response headers and
does not log callback query strings, which can contain authentication material.

Before deployment, the Entra application owner must verify that the exact root callback URL
for the preview hostname is registered for the application used by `getMsalInstance()`.
Do not substitute a production or third-party callback, or register arbitrary PR commit URLs.

After deployment, verify the root HTML and its referenced scripts return 200 without
redirecting, then test a fresh Entra login and an existing-item read in the real Portal-hosted
preview. HTTP success alone does not validate sign-in. MSAL's cross-origin iframe/storage
partitioning limitations may require an additional supported host-authentication solution.
See the [MSAL redirect bridge guidance](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/redirect-bridge.md).
