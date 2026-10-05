import express from "express";
import { createProxyServer } from "httpxy";
import fetch from "node-fetch";

const getErrorCode = (error) =>
  typeof error?.code === "string" ? error.code : error instanceof Error ? error.name : "UNKNOWN";

const proxyErrorStatus = (code) => {
  if (code.startsWith("HPE_INVALID")) {
    return 502;
  }
  return ["ECONNRESET", "ENOTFOUND", "ECONNREFUSED", "ETIMEDOUT"].includes(code) ? 504 : 500;
};

const createProxyHandler = (target, { secure = true, dynamic = false } = {}) => {
  const proxy = createProxyServer({
    changeOrigin: true,
    secure,
    agent: false,
    proxyTimeout: 0,
    followRedirects: false,
  });

  return async (req, res) => {
    const override = dynamic && req.headers["x-ms-proxy-target"];
    const destination = override || target;
    if (typeof destination !== "string" || !URL.canParse(destination)) {
      console.error("Invalid preview proxy target");
      return res.sendStatus(override ? 400 : 500);
    }
    const url = new URL(destination);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      console.error("Unsupported preview proxy target protocol");
      return res.sendStatus(override ? 400 : 500);
    }

    try {
      await proxy.web(req, res, { target: url });
    } catch (error) {
      const code = getErrorCode(error);
      console.error("Preview proxy request failed:", code);
      if (res.destroyed || res.writableEnded) {
        return;
      }
      if (res.headersSent) {
        res.destroy();
        return;
      }
      res.sendStatus(proxyErrorStatus(code));
    }
  };
};

export const createApp = ({
  backendEndpoint = "https://cdb-ms-mpac-pbe.cosmos.azure.com",
  previewSiteEndpoint = "https://dataexplorer-preview.portal.cosmos.azure.com",
  previewStorageWebsiteEndpoint,
  githubApiUrl = "https://api.github.com/repos/Azure/cosmos-explorer",
  azurePortalMpacEndpoint = "https://ms.portal.azure.com/",
  fetchGitHub = fetch,
} = {}) => {
  const app = express();
  const api = createProxyHandler(backendEndpoint);

  app.use("/api", (req, res, next) => {
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    next();
  });
  app.use("/api", api);
  app.use("/proxy", createProxyHandler(backendEndpoint, { secure: false, dynamic: true }));
  app.use("/commit", createProxyHandler(previewStorageWebsiteEndpoint, { secure: false }));

  app.get("/pull/:pr", async (req, res) => {
    const pr = req.params.pr;
    if (!/^\d+$/.test(pr)) {
      return res.status(400).send("Invalid pull request number");
    }
    const queryIndex = req.originalUrl.indexOf("?");
    const search = new URLSearchParams(queryIndex === -1 ? "" : req.originalUrl.slice(queryIndex + 1));

    try {
      const response = await fetchGitHub(`${githubApiUrl}/pulls/${pr}`);
      const {
        head: { sha },
      } = await response.json();
      const explorer = new URL(`${previewSiteEndpoint}/commit/${sha}/explorer.html`);
      explorer.search = search.toString();

      const portal = new URL(azurePortalMpacEndpoint);
      portal.searchParams.set("dataExplorerSource", explorer.href);
      res.redirect(portal.href);
    } catch (error) {
      console.error("Preview GitHub pull request lookup failed:", getErrorCode(error));
      res.sendStatus(500);
    }
  });
  app.get("/", async (req, res) => {
    try {
      const response = await fetchGitHub(`${githubApiUrl}/branches/master`);
      const {
        commit: { sha },
      } = await response.json();
      const explorer = new URL(`${previewSiteEndpoint}/commit/${sha}/hostedExplorer.html`);
      res.redirect(explorer.href);
    } catch (error) {
      console.error("Preview GitHub branch lookup failed:", getErrorCode(error));
      res.sendStatus(500);
    }
  });

  return app;
};
