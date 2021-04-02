const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const port = process.env.PORT || 3000;

const api = createProxyMiddleware("/api", {
  target: "https://main.documentdb.ext.azure.com",
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
  target: "https://main.documentdb.ext.azure.com",
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
  target: "https://cosmosexplorerpreview.blob.core.windows.net",
  changeOrigin: true,
  secure: false,
  logLevel: "debug",
  pathRewrite: { "^/commit": "$web/" },
});

const app = express();

app.use(api);
app.use(proxy);
app.use(commit);
app.listen(port, () => {
  console.log(`Example app listening on port: ${port}`);
});
