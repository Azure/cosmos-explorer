const { assert } = require("console");
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { inspect } = require("util");

const conf = {};
conf.PORT = process.env.EXPLORER_PORT || 1234;
conf.LOG_LEVEL = process.env.LOG_LEVEL || "info";
conf.EMULATOR_ENDPOINT = process.env.EMULATOR_ENDPOINT || "http://127.0.0.1:8081";
conf.ENDPOINT_DISCOVERY_ENABLED = (process.env.ENDPOINT_DISCOVERY_ENABLED || "false").toLowerCase() === "true";

const LOG_NUM = levelToNumber(conf.LOG_LEVEL);
function log(level, msg, color) {
  if (levelToNumber(level) >= LOG_NUM) {
    console.log(`${colorToCode(color)}[${level || "debug"}]${msg}\x1b[0m`);
  }
}

function debug(msg, color) {
  log("debug", msg, color);
}

function info(msg, color) {
  log("info", msg, color);
}

function warn(msg, color) {
  log("warn", msg, color || "yellow");
}

function err(msg, color) {
  log("error", msg, color || "red");
}

function levelToNumber(level) {
  switch (level) {
    case "debug":
      return 0;
    case "info":
      return 1;
    case "warn":
      return 2;
    case "error":
      return 3;
    default:
      return 0;
  }
}

function colorToCode(color) {
  switch (color) {
    case "red":
      return "\x1b[31m";
    case "green":
      return "\x1b[32m";
    case "blue":
      return "\x1b[34m";
    case "yellow":
      return "\x1b[33m";
    default:
      return "\x1b[0m";
  }
}

function statusToColor(status) {
  if (status < 300) {
    return "green";
  } else if (status < 400) {
    return "blue";
  } else {
    return "red";
  }
}

const testEndpoint = () => {
  fetch(conf.EMULATOR_ENDPOINT)
    .then(async (res) => {
      const body = await res.json();
      info("[EMU] Emulator is accessible");
    })
    .catch((err) => {
      err("[EMU] Emulator is not accessible");
      err(`[EMU] ${inspect(err)}`);
    });
};

testEndpoint();

const app = express();

app.use((err, req, res, next) => {
  err(`[APP] ${inspect(err)}`);
  res.status(500).json({ error: err.message });
});

app.use((req, res, next) => {
  req.startTime = new Date();
  req.requestId = Math.random().toString(36).substring(7);
  res.append("Access-Control-Allow-Origin", "*");
  res.append("Access-Control-Allow-Credentials", "true");
  res.append("Access-Control-Max-Age", "3600");
  res.append("Access-Control-Allow-Headers", "*");
  res.append("Access-Control-Allow-Methods", "*");
  next();
  const ms = new Date() - req.startTime;
  (res.statusCode < 400 ? debug : err)(
    `[APP][${req.requestId}][${req.method}][${res.statusCode}][${ms}ms] ${req.url}`,
    statusToColor(res.statusCode),
  );
});

app.get("/_ready", (_, res) => {
  if (compilationComplete) {
    res.status(200).send("Compilation complete.");
  } else {
    res.status(503).send("Compilation not complete.");
  }
});

const appConf = {
  PROXY_PATH: "/proxy",
  EMULATOR_ENDPOINT: conf.EMULATOR_ENDPOINT,
};
app.get("/config.json", (_, res) => {
  res.status(200).json(appConf).end();
});

const proxyProxy = createProxyMiddleware({
  target: "https://cdb-ms-mpac-pbe.cosmos.azure.com",
  changeOrigin: true,
  secure: false,
  logLevel: conf.LOG_LEVEL,
  pathRewrite: { "^/proxy": "" },
  router: (req) => {
    if (conf.ENDPOINT_DISCOVERY_ENABLED) {
      let newTarget = req.headers["x-ms-proxy-target"];
      return newTarget;
    } else {
      return conf.EMULATOR_ENDPOINT;
    }
  },
});

app.use("/proxy", proxyProxy);

const unsupported = (req, res) => {
  res.status(404).send("Unexpected operation. Please create issue.");
};

// TODO: andersonc - I don't believe these are needed for emulator, should confirm and remove.
app.use("/api", unsupported);
app.use("/_explorer", unsupported);
app.use("/explorerProxy", unsupported);
app.use(`/${conf.AZURE_TENANT_ID}`, unsupported);

app.use(express.static("dist"));

info(`[EMU] Expecting emulator on [${conf.EMULATOR_ENDPOINT}]`);
info(`[APP] Listening on [${conf.PORT}]`);
app.listen(conf.PORT);
