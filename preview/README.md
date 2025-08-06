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
