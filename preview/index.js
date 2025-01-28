const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const port = process.env.PORT || 3000;
const fetch = require("node-fetch"); 

const backendEndpoint = "https://cdb-ms-mpac-pbe.cosmos.azure.com";
const previewSiteEndpoint = "https://dataexplorer-preview.azurewebsites.net";
const previewStorageWebsiteEndpoint = "https://dataexplorerpreview.blob.core.windows.net";
const githubApiUrl = "https://api.github.com/repos/Azure/cosmos-explorer";
const githubPullRequestUrl = "https://github.com/Azure/cosmos-explorer/pull";
const azurePortalMpacEndpoint = "https://ms.portal.azure.com/";

const api = createProxyMiddleware("/api", {
  target: backendEndpoint,
  changeOrigin: true,
  logLevel: "debug",
  bypass: (req, res) => {
    if (req.method === "OPTIONS") {
      res.statusCode = 200;
      res.send();
    }
  },
});

const proxy = createProxyMiddleware("/proxy", {
  target: backendEndpoint,
  changeOrigin: true,
  secure: false,
  logLevel: "debug",
  pathRewrite: { "^/proxy": "" },
  router: (req) => {
    let newTarget = req.headers["x-ms-proxy-target"];
    return newTarget;
  },
});

const commit = createProxyMiddleware("/commit", {
  target: previewStorageWebsiteEndpoint,
  changeOrigin: true,
  secure: false,
  logLevel: "debug",
  pathRewrite: { "^/commit": "/" },
});

const app = express();

app.use(api);
app.use(proxy);
app.use(commit);
app.get("/pull/:pr(\\d+)", (req, res) => {
  const pr = req.params.pr;
  const [, query] = req.originalUrl.split("?");
  const search = new URLSearchParams(query);

  fetch(`${githubApiUrl}/pulls/${pr}`)
    .then((response) => response.json())
    .then(({ head: { ref, sha } }) => {
      const prUrl = new URL(`${githubPullRequestUrl}/${pr}`);
      prUrl.hash = ref;
      search.set("feature.pr", prUrl.href);

      const explorer = new URL(`${previewSiteEndpoint}/commit/${sha}/explorer.html`);
      explorer.search = search.toString();

      const portal = new URL(azurePortalMpacEndpoint);
      portal.searchParams.set("dataExplorerSource", explorer.href);

      return res.redirect(portal.href);
    })
    .catch(() => res.sendStatus(500));
});
app.get("/", (req, res) => {
  fetch(`${githubApiUrl}/branches/master`)
    .then((response) => response.json())
    .then(({ commit: { sha } }) => {
      const explorer = new URL(
        `${previewSiteEndpoint}/commit/${sha}/hostedExplorer.html`
      );
      return res.redirect(explorer.href);
    })
    .catch(() => res.sendStatus(500));
});

app.listen(port, () => {
  console.log(`Example app listening on port: ${port}`);
});
