const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { inspect } = require("util");
const fs = require("fs");
const https = require("https");

const conf = {};
conf.PORT = process.env.EXPLORER_PORT || 1234;
conf.LOG_LEVEL = process.env.LOG_LEVEL || "info";
conf.EMULATOR_ENDPOINT = process.env.EMULATOR_ENDPOINT || "http://localhost:8081";
conf.ENDPOINT_DISCOVERY_ENABLED = (process.env.ENDPOINT_DISCOVERY_ENABLED || "false").toLowerCase() === "true";
conf.GATEWAY_TLS_ENABLED = (process.env.GATEWAY_TLS_ENABLED || "false").toLowerCase() === "true";
conf.CERT_PATH = process.env.CERT_PATH;
conf.CERT_SECRET = process.env.CERT_SECRET;

const LOG_NUM = levelToNumber(conf.LOG_LEVEL);
function _log(level, msg, color) {
  if (levelToNumber(level) >= LOG_NUM) {
    console.log(`${colorToCode(color)}[${level || "debug"}]${msg}\x1b[0m`);
  }
}

function _debug(msg, color) {
  _log("debug", msg, color);
}

function _info(msg, color) {
  _log("info", msg, color);
}

function _warn(msg, color) {
  _log("warn", msg, color || "yellow");
}

function _err(msg, color) {
  _log("error", msg, color || "red");
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
      _info("[EMU] Emulator is accessible");
    })
    .catch((e) => {
      _warn("[EMU] Emulator is not accessible");
      _warn(`[EMU] ${inspect(e)}`);
    });
};

testEndpoint();

const app = express();

app.use((e, req, res, next) => {
  _err(`[APP] ${inspect(e)}`);
  res.status(500).json({ error: _err.message });
});

app.use((req, res, next) => {
  req.startTime = new Date();
  res.append("Access-Control-Allow-Origin", "*");
  res.append("Access-Control-Allow-Credentials", "true");
  res.append("Access-Control-Max-Age", "3600");
  res.append("Access-Control-Allow-Headers", "*");
  res.append("Access-Control-Allow-Methods", "*");
  res.once("finish", () => {
    const ms = new Date() - req.startTime;
    (res.statusCode < 400 ? _debug : _err)(
      `[APP] ${req.method} ${req.url} ${res.statusCode} - ${ms}ms`,
      statusToColor(res.statusCode),
    );
  });
  next();
});

app.get("/_ready", (_, res) => {
  res.status(200).send("Compilation complete.");
});

const appConf = {
  PROXY_PATH: "/proxy",
  EMULATOR_ENDPOINT: conf.EMULATOR_ENDPOINT,
  platform: "VNextEmulator",
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

_info(`[EMU] Expecting emulator on [${conf.EMULATOR_ENDPOINT}]`);
_info(`[APP] Listening on [${conf.PORT}]`);
if (conf.GATEWAY_TLS_ENABLED) {
  if (!conf.CERT_PATH || !conf.CERT_SECRET) {
    _err("[APP] Certificate path or secret not provided");
    process.exit(1);
  }

  const options = {
    pfx: fs.readFileSync(conf.CERT_PATH),
    passphrase: conf.CERT_SECRET,
  };

  const server = https.createServer(options, app);
  server.listen(conf.PORT);
} else {
  app.listen(conf.PORT);
}
