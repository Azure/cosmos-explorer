const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const conf = {};
conf.PORT = process.env.EXPLORER_PORT || 1234;
conf.AZURE_TENANT_ID = process.env.AZURE_TENANT_ID || "72f988bf-86f1-41af-91ab-2d7cd011db47";
conf.EMULATOR_ENDPOINT = process.env.EMULATOR_ENDPOINT || "https://localhost:8081/";

const app = express();

app.all("*", (req, res, next) => {
  const start = new Date();
  res.append("Access-Control-Allow-Origin", "*");
  res.append("Access-Control-Allow-Credentials", "true");
  res.append("Access-Control-Max-Age", "3600");
  res.append("Access-Control-Allow-Headers", "*");
  res.append("Access-Control-Allow-Methods", "*");
  next();
  const ms = new Date() - start;
  console.log(`[${req.method}] ${req.url} -> ${res.statusCode} [${ms}ms]`);
});

app.get("/_ready", (_, res) => {
  if (compilationComplete) {
    res.status(200).send("Compilation complete.");
  } else {
    res.status(503).send("Compilation not complete.");
  }
});

app.get("config.json", (_, res) => {
  res.json({ EMULATOR_ENDPOINT: conf.EMULATOR_ENDPOINT });
});

const bypass = (req, res) => {
  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.send();
  }
};

const apiProxy = createProxyMiddleware({
  target: "https://main.documentdb.ext.azure.com",
  changeOrigin: true,
  logLevel: "debug",
});

app.use("/api", bypass, apiProxy);

const proxyProxy = createProxyMiddleware({
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

app.use("/proxy", proxyProxy);

const explorerProxy = createProxyMiddleware({
  target: conf.EMULATOR_ENDPOINT,
  changeOrigin: true,
  secure: false,
  logLevel: "debug",
});

app.use("/_explorer", explorerProxy);
app.use("/explorerProxy", explorerProxy);

const tenantProxy = createProxyMiddleware({
  target: "https://login.microsoftonline.com/",
  changeOrigin: true,
  secure: false,
  logLevel: "debug",
});

app.use(`/${conf.AZURE_TENANT_ID}`, tenantProxy);

app.use(express.static("dist"));

console.log(`Expecting emulator on [${conf.EMULATOR_ENDPOINT}]`);
console.log(`Listening on [${conf.PORT}]`);
app.listen(conf.PORT);
