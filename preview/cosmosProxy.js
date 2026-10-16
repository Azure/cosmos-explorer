const dns = require("node:dns");
const https = require("node:https");
const { isIP } = require("node:net");
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const ipaddr = require("ipaddr.js");

const allowedEndpointZones = [
  // from Environment.Prod.json
  "documents.azure.com",
  "analytics.cosmos.azure.com",
  "table.cosmosdb.azure.com",
  "gremlin.cosmosdb.azure.com",
  "cassandra.cosmosdb.azure.com",
  "sql.cosmosdb.azure.com",
  "sqlx.cosmos.azure.com",
  "mongo.cosmos.azure.com",
  "etcd.cosmosdb.azure.com",
  "table.cosmos.azure.com",
  "gremlin.cosmos.azure.com",
  "cassandra.cosmos.azure.com",
  "sql.cosmos.azure.com",
  "etcd.cosmos.azure.com",
  // from Environment.Stage.json
  "documents-staging.windows-ppe.net",
  "analytics.cosmos.windows-ppe.net",
  "table.cosmosdb.windows-ppe.net",
  "gremlin.cosmosdb.windows-ppe.net",
  "cassandra.cosmosdb.windows-ppe.net",
  "sql.cosmosdb.windows-ppe.net",
  "sqlx.cosmos.windows-ppe.net",
  "mongo.cosmos.windows-ppe.net",
  "etcd.cosmosdb.windows-ppe.net",
  "table.cosmos.windows-ppe.net",
  "gremlin.cosmos.windows-ppe.net",
  "cassandra.cosmos.windows-ppe.net",
  "sql.cosmos.windows-ppe.net",
  "etcd.cosmos.windows-ppe.net",
];

const parseProxyTarget = (value) => {
  if (typeof value !== "string" || !/^https:\/\/[^/?#\\\s]+\/?$/i.test(value) || !URL.canParse(value)) {
    return undefined;
  }

  const target = new URL(value);
  if (target.username || target.password || target.port) {
    return undefined;
  }

  const allowed = allowedEndpointZones.some((zone) => {
    const suffix = `.${zone}`;
    if (!target.hostname.endsWith(suffix)) {
      return false;
    }
    const account = target.hostname.slice(0, -suffix.length);
    return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(account);
  });

  return allowed ? target.origin : undefined;
};

const isPublicAddress = (address) => {
  if (!isIP(address) || address.includes("%")) {
    return false;
  }
  const parsed = ipaddr.process(address);
  if (parsed.range() !== "unicast") {
    return false;
  }
  if (parsed.kind() === "ipv6") {
    return parsed.match(ipaddr.parseCIDR("2000::/3"));
  }
  // Azure's platform virtual IP is public-looking but is not a Cosmos endpoint.
  return parsed.toString() !== "168.63.129.16";
};

const lookupPublicAddress = (hostname, options, callback) => {
  const lookupOptions = typeof options === "number" ? { family: options } : options;
  dns.lookup(hostname, { ...lookupOptions, all: true }, (error, addresses) => {
    if (error) {
      callback(error);
      return;
    }
    if (addresses.length === 0 || addresses.some(({ address }) => !isPublicAddress(address))) {
      const blocked = new Error("Proxy target must resolve only to public addresses");
      blocked.code = "ERR_PROXY_TARGET_ADDRESS";
      callback(blocked);
      return;
    }

    if (lookupOptions.all) {
      callback(null, addresses);
    } else {
      callback(null, addresses[0].address, addresses[0].family);
    }
  });
};

const createCosmosProxy = () => {
  const router = express.Router();
  // Validate inside the socket lookup, avoiding a second, unchecked DNS resolution.
  const agent = new https.Agent({ lookup: lookupPublicAddress, rejectUnauthorized: true });

  router.use((req, res, next) => {
    const targets = req.headersDistinct["x-ms-proxy-target"];
    const target = targets?.length === 1 ? parseProxyTarget(targets[0]) : undefined;
    if (!target) {
      res.status(400).send("A single approved HTTPS Cosmos endpoint is required in x-ms-proxy-target.");
      return;
    }
    req.cosmosProxyTarget = target;
    delete req.headers["x-ms-proxy-target"];
    next();
  });

  router.use(
    createProxyMiddleware({
      changeOrigin: true,
      secure: true,
      followRedirects: false,
      agent,
      pathRewrite: { "^/proxy": "" },
      router: (req) => req.cosmosProxyTarget,
      on: {
        error: (error, req, res) => {
          console.warn("Cosmos proxy request failed:", error.code || error.name);
          if (res.headersSent) {
            res.destroy();
            return;
          }
          const blocked = error.code === "ERR_PROXY_TARGET_ADDRESS";
          res.writeHead(blocked ? 403 : 502, { "Content-Type": "text/plain" });
          res.end(blocked ? "Proxy target address is not allowed." : "Unable to reach the Cosmos endpoint.");
        },
      },
    }),
  );

  return router;
};

module.exports = { createCosmosProxy, lookupPublicAddress, parseProxyTarget };
