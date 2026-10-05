# Cosmos Explorer Preview

Cosmos Explorer Preview makes it possible to try a working version of any commit on master or in a PR. No need to run the app locally or deploy to staging.

Initial support is for Hosted (Connection string only) or the Azure Portal. Examples:

Connection string URLs: https://dataexplorer-preview.portal.cosmos.azure.com/commit/COMMIT_SHA/hostedExplorer.html
Portal URLs: https://ms.portal.azure.com/?dataExplorerSource=https://dataexplorer-preview.portal.cosmos.azure.com/commit/COMMIT_SHA/explorer.html#home

In both cases replace `COMMIT_SHA` with the commit you want to view. It must have already completed its build on GitHub Actions.

### Local development and validation

Use Node.js 22.x, matching the Azure App Service runtime. This folder is an independent npm package using ES modules.

Run these commands from the `preview` directory:

```powershell
npm ci
npm test
npm run build
npm audit --audit-level=low
npm start
```

`npm run build` checks the syntax of the server and test files and runs the complete native Node.js regression suite. Tests use local upstream servers and GitHub response fixtures, including real entry-point startup checks; they do not require Azure credentials or call live Cosmos accounts. This JavaScript server has no compilation or bundling step. Explorer assets are built separately by the repository's root application; a preview-server build does not rebuild those assets.

The server listens on `PORT`, defaulting to 3000. Before deployment, replace `_REPLACE_STORAGE_WEBSITE_ENDPOINT_` in `index.js` with the preview storage website endpoint, as before.

### Dependency maintenance and proxy compatibility

The proxy uses `httpxy` directly rather than `http-proxy-middleware`. The latter depends on `micromatch` and the unpatched `braces` package, so upgrading the middleware alone does not eliminate all npm audit findings. The validated `httpxy` release is pinned and has no runtime dependencies. Unused direct `body-parser` and `follow-redirects` dependencies have been removed; Express's transitive `body-parser` and `qs` copies are patched in the lockfile.

After changing dependencies, regenerate the lockfile with npm and validate with a clean `npm ci`, `npm audit --audit-level=low`, and `npm run build`. Do not use `npm audit fix --force` to apply npm's suggested downgrade to an obsolete middleware version. CI checks the preview package independently, including low-severity audit findings.

Proxy mount prefixes are removed exactly once; path segments named `proxy` or `commit` within the remaining URL are not stripped again. Requests and responses remain streamed, upstream redirects are returned to the client, and Host rewriting and the existing TLS verification settings are preserved. Proxy connection reuse and upstream timeouts remain disabled, matching the previous proxy implementation rather than adopting httpxy's different defaults.

`OPTIONS` requests under `/api` now explicitly return an empty 200 without contacting the backend. This restores the intent of the old `bypass` option, which the previous middleware version did not support. Invalid dynamic proxy targets return 400; unconfigured static targets return 500. Upstream connection failures retain 504 responses, malformed upstream HTTP responses return 502, and other proxy failures return 500. Failures after response headers have been sent terminate the connection rather than sending a second response. Error logs do not include target URLs, authentication headers, or request bodies.

### Architecture

- This folder contains a NodeJS app deployed to Azure App Service that powers preview URLs:
  - Paths starting with `/commit/` are proxied to an Azure Storage account containing build artifacts
  - Paths starting with `/proxy/` are proxied dynamically to Cosmos account endpoints. Required otherwise CORS would need to be configured for every account accessed.
  - Paths starting with `/api/` are proxied to Portal APIs that do not support CORS.
- On GitHub Actions build completion:
  - All files in dist are uploaded to an Azure Storage account namespaced by the SHA of the commit
  - `/preview/config.json` is uploaded to the same folder with preview specific configuration
