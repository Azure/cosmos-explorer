const dns = require("node:dns");
const { once } = require("node:events");
const http = require("node:http");
const https = require("node:https");
const { Writable } = require("node:stream");
const express = require("express");
const { createCosmosProxy, lookupPublicAddress, parseProxyTarget } = require("./cosmosProxy");

afterEach(() => jest.restoreAllMocks());

describe("proxy target policy", () => {
  it.each([
    "account.documents.azure.com",
    "account-westus.documents.azure.com",
    "account.sql.cosmosdb.azure.com",
    "account.sql.cosmos.azure.com",
    "account.sqlx.cosmos.azure.com",
    "account.documents.azure.us",
    "account.documents.azure.cn",
    "account.documents-staging.windows-ppe.net",
    "account-westus.documents-staging.windows-ppe.net",
    "account.sql.cosmosdb.windows-ppe.net",
    "account.sql.cosmos.windows-ppe.net",
    "account.sqlx.cosmos.windows-ppe.net",
  ])("accepts the approved account or regional endpoint %s", (hostname) => {
    expect(parseProxyTarget(`https://${hostname}`)).toBe(`https://${hostname}`);
    expect(parseProxyTarget(`https://${hostname}:443/`)).toBe(`https://${hostname}`);
  });

  it("normalizes hostname casing", () => {
    expect(parseProxyTarget("HTTPS://ACCOUNT.documents.azure.com/")).toBe("https://account.documents.azure.com");
  });

  it.each([
    undefined,
    "",
    ["https://account.documents.azure.com"],
    "not a URL",
    "http://account.documents.azure.com",
    "ftp://account.documents.azure.com",
    "file:///etc/passwd",
    "//account.documents.azure.com",
    "https://localhost",
    "https://127.0.0.1",
    "https://2130706433",
    "https://0x7f000001",
    "https://[::1]",
    "https://[::ffff:127.0.0.1]",
    "https://169.254.169.254",
    "https://168.63.129.16",
    "https://example.com",
    "https://documents.azure.com",
    "https://evildocuments.azure.com",
    "https://account.documents.azure.com.evil.example",
    "https://account.privatelink.documents.azure.com",
    "https://-account.documents.azure.com",
    "https://account-.documents.azure.com",
    "https://account_name.documents.azure.com",
    `https://${"a".repeat(64)}.documents.azure.com`,
    "https://account.documents.azure.com.",
    "https://account.documents.azure.com:8081",
    "https://account.documents.azure.com:80",
    "https://user:password@account.documents.azure.com",
    "https://account.documents.azure.com@evil.example",
    "https://evil.example@account.documents.azure.com",
    "https://account.documents.azure.com\\@evil.example",
    "https://account.documents.azure.com/dbs",
    "https://account.documents.azure.com/..",
    "https://account.documents.azure.com/?target=evil",
    "https://account.documents.azure.com?",
    "https://account.documents.azure.com#fragment",
    "https://account.documents.azure.com#",
    " https://account.documents.azure.com",
    "https://account.documents.azure.com, https://other.documents.azure.com",
  ])("rejects an invalid or unapproved target: %j", (target) => {
    expect(parseProxyTarget(target)).toBeUndefined();
  });
});

describe("socket DNS lookup", () => {
  const hostname = "account.documents.azure.com";
  const publicIPv4 = { address: "52.239.148.88", family: 4 };
  const publicIPv6 = { address: "2603:1030:403::1", family: 6 };

  const resolveTo = (addresses) =>
    jest.spyOn(dns, "lookup").mockImplementation((name, options, callback) => callback(null, addresses));

  it("checks all results and returns the requested single-address callback shape", () => {
    const lookup = resolveTo([publicIPv4, publicIPv6]);
    const callback = jest.fn();
    lookupPublicAddress(hostname, { family: 0 }, callback);

    expect(lookup).toHaveBeenCalledWith(hostname, { family: 0, all: true }, expect.any(Function));
    expect(callback).toHaveBeenCalledWith(null, publicIPv4.address, publicIPv4.family);
  });

  it("preserves the all-address callback shape used by automatic family selection", () => {
    const lookup = resolveTo([publicIPv6, publicIPv4]);
    const callback = jest.fn();
    lookupPublicAddress(hostname, { all: true, hints: dns.ADDRCONFIG }, callback);

    expect(lookup).toHaveBeenCalledWith(hostname, { all: true, hints: dns.ADDRCONFIG }, expect.any(Function));
    expect(callback).toHaveBeenCalledWith(null, [publicIPv6, publicIPv4]);
  });

  it("supports a numeric address-family option", () => {
    const lookup = resolveTo([publicIPv6]);
    const callback = jest.fn();
    lookupPublicAddress(hostname, 6, callback);
    expect(lookup).toHaveBeenCalledWith(hostname, { family: 6, all: true }, expect.any(Function));
    expect(callback).toHaveBeenCalledWith(null, publicIPv6.address, 6);
  });

  it("allows IPv4-mapped public addresses", () => {
    resolveTo([{ address: "::ffff:52.239.148.88", family: 6 }]);
    const callback = jest.fn();
    lookupPublicAddress(hostname, {}, callback);
    expect(callback).toHaveBeenCalledWith(null, "::ffff:52.239.148.88", 6);
  });

  it.each([
    "0.0.0.0",
    "10.1.2.3",
    "100.64.0.1",
    "127.0.0.1",
    "169.254.169.254",
    "172.16.0.1",
    "192.168.1.1",
    "192.0.0.1",
    "192.0.2.1",
    "198.18.0.1",
    "198.51.100.1",
    "203.0.113.1",
    "224.0.0.1",
    "240.0.0.1",
    "255.255.255.255",
    "168.63.129.16",
    "::",
    "::1",
    "fc00::1",
    "fe80::1",
    "ff02::1",
    "2001:db8::1",
    "4000::1",
    "64:ff9b::a00:1",
    "2002:7f00:1::",
    "::ffff:127.0.0.1",
    "::ffff:169.254.169.254",
    "::ffff:168.63.129.16",
    "::ffff:a83f:8110",
    "2603:1030:403::1%lo",
    "not-an-address",
  ])("rejects %s even when accompanied by a public address", (address) => {
    resolveTo([publicIPv4, { address, family: address.includes(":") ? 6 : 4 }]);
    const callback = jest.fn();
    lookupPublicAddress(hostname, { all: true }, callback);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ code: "ERR_PROXY_TARGET_ADDRESS" }));
  });

  it("rejects an empty DNS result", () => {
    resolveTo([]);
    const callback = jest.fn();
    lookupPublicAddress(hostname, {}, callback);
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ code: "ERR_PROXY_TARGET_ADDRESS" }));
  });

  it("propagates DNS errors rather than falling back to another destination", () => {
    const error = Object.assign(new Error("DNS failed"), { code: "ENOTFOUND" });
    jest.spyOn(dns, "lookup").mockImplementation((name, options, callback) => callback(error));
    const callback = jest.fn();
    lookupPublicAddress(hostname, {}, callback);
    expect(callback).toHaveBeenCalledWith(error);
  });

  it("rejects a private address returned on a subsequent connection", () => {
    const lookup = jest
      .spyOn(dns, "lookup")
      .mockImplementationOnce((name, options, callback) => callback(null, [publicIPv4]))
      .mockImplementationOnce((name, options, callback) => callback(null, [{ address: "127.0.0.1", family: 4 }]));
    const first = jest.fn();
    const second = jest.fn();
    lookupPublicAddress(hostname, {}, first);
    lookupPublicAddress(hostname, {}, second);
    expect(first).toHaveBeenCalledWith(null, publicIPv4.address, 4);
    expect(second).toHaveBeenCalledWith(expect.objectContaining({ code: "ERR_PROXY_TARGET_ADDRESS" }));
    expect(lookup).toHaveBeenCalledTimes(2);
  });
});

describe("Cosmos proxy request handling", () => {
  let proxyServer;
  let servers;

  const listen = async (server) => {
    servers.push(server);
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    return server;
  };

  const request = ({ target, method = "GET", path = "/proxy/dbs", headers = {}, body } = {}) =>
    new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: "127.0.0.1",
          port: proxyServer.address().port,
          path,
          method,
          headers: { ...headers, ...(target === undefined ? {} : { "x-ms-proxy-target": target }) },
        },
        (res) => {
          const chunks = [];
          res.on("data", (chunk) => chunks.push(chunk));
          res.on("error", reject);
          res.on("end", () =>
            resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString() }),
          );
        },
      );
      req.on("error", reject);
      req.end(body);
    });

  const forwardToLocalServer = (server) =>
    jest.spyOn(https, "request").mockImplementation((options) =>
      http.request({
        ...options,
        protocol: "http:",
        host: "127.0.0.1",
        hostname: "127.0.0.1",
        port: server.address().port,
        agent: false,
      }),
    );

  beforeEach(async () => {
    servers = [];
    const app = express();
    app.use("/proxy", createCosmosProxy());
    proxyServer = await listen(http.createServer(app));
  });

  afterEach(async () => {
    await Promise.all(
      servers.map(
        (server) =>
          new Promise((resolve, reject) => {
            server.closeAllConnections();
            server.close((error) => (error ? reject(error) : resolve()));
          }),
      ),
    );
  });

  it.each([
    undefined,
    "https://evil.example",
    "http://account.documents.azure.com",
    "https://account.documents.azure.com:8081",
    ["https://account.documents.azure.com", "https://other.documents.azure.com"],
    ["https://account.documents.azure.com", "https://account.documents.azure.com"],
  ])("rejects %j without starting an outbound request", async (target) => {
    const outbound = jest.spyOn(https, "request");
    const lookup = jest.spyOn(dns, "lookup");
    const response = await request({ target });
    expect(response.status).toBe(400);
    expect(response.body).toContain("approved HTTPS Cosmos endpoint");
    expect(outbound).not.toHaveBeenCalled();
    expect(lookup).not.toHaveBeenCalled();
  });

  it.each(["type=master&sig=test", "type=resource&sig=test", "type=aad&sig=test"])(
    "preserves regional routing, paths, queries, bodies, and auth headers (%s)",
    async (authorization) => {
      let received;
      const upstream = await listen(
        http.createServer((req, res) => {
          const chunks = [];
          req.on("data", (chunk) => chunks.push(chunk));
          req.on("end", () => {
            received = {
              method: req.method,
              path: req.url,
              headers: req.headers,
              body: Buffer.concat(chunks).toString(),
            };
            res.writeHead(201, { "x-ms-request-charge": "2" });
            res.end('{"id":"created"}');
          });
        }),
      );
      const outbound = forwardToLocalServer(upstream);
      const body = '{"id":"document"}';
      const response = await request({
        target: "https://account-westus.documents-staging.windows-ppe.net:443/",
        method: "POST",
        path: "/proxy/dbs/db/colls/container/docs?partitionKey=%5B%22key%22%5D",
        headers: { authorization, "content-type": "application/json", "x-ms-date": "test-date" },
        body,
      });

      expect(received).toEqual({
        method: "POST",
        path: "/dbs/db/colls/container/docs?partitionKey=%5B%22key%22%5D",
        headers: expect.objectContaining({
          host: "account-westus.documents-staging.windows-ppe.net",
          authorization,
          "content-type": "application/json",
          "x-ms-date": "test-date",
        }),
        body,
      });
      expect(received.headers).not.toHaveProperty("x-ms-proxy-target");
      expect(response).toEqual({
        status: 201,
        headers: expect.objectContaining({ "x-ms-request-charge": "2" }),
        body: '{"id":"created"}',
      });
      const options = outbound.mock.calls[0][0];
      expect(options.hostname).toBe("account-westus.documents-staging.windows-ppe.net");
      expect(options.port).toBe(443);
      expect(options.rejectUnauthorized).toBe(true);
      expect(options.agent.options.lookup).toBe(lookupPublicAddress);
      expect(options.agent.options.rejectUnauthorized).toBe(true);
    },
  );

  it("returns redirects without following them server-side", async () => {
    const location = "http://169.254.169.254/metadata";
    const upstream = await listen(
      http.createServer((req, res) => {
        res.writeHead(302, { Location: location });
        res.end();
      }),
    );
    const outbound = forwardToLocalServer(upstream);
    const response = await request({ target: "https://account.documents.azure.com" });
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(location);
    expect(outbound).toHaveBeenCalledTimes(1);
  });

  it("blocks private DNS results in the real HTTPS agent before connecting", async () => {
    const lookup = jest
      .spyOn(dns, "lookup")
      .mockImplementation((hostname, options, callback) => callback(null, [{ address: "127.0.0.1", family: 4 }]));
    const warning = jest.spyOn(console, "warn").mockImplementation(() => {});
    const response = await request({ target: "https://account.documents.azure.com" });
    expect(lookup).toHaveBeenCalledWith(
      "account.documents.azure.com",
      expect.objectContaining({ all: true }),
      expect.any(Function),
    );
    expect(response.status).toBe(403);
    expect(response.body).toBe("Proxy target address is not allowed.");
    expect(warning).toHaveBeenCalledWith("Cosmos proxy request failed:", "ERR_PROXY_TARGET_ADDRESS");
  });

  it("returns an explicit gateway error when DNS fails", async () => {
    jest
      .spyOn(dns, "lookup")
      .mockImplementation((hostname, options, callback) =>
        callback(Object.assign(new Error("DNS failed"), { code: "ENOTFOUND" })),
      );
    jest.spyOn(console, "warn").mockImplementation(() => {});
    const response = await request({ target: "https://account.documents.azure.com" });
    expect(response.status).toBe(502);
    expect(response.body).toBe("Unable to reach the Cosmos endpoint.");
  });

  it("surfaces a certificate rejection without retrying insecurely", async () => {
    const outbound = jest.spyOn(https, "request").mockImplementation(() => {
      const req = new Writable({
        write(chunk, encoding, callback) {
          callback();
        },
      });
      req.abort = () => req.destroy();
      process.nextTick(() => {
        req.emit("error", Object.assign(new Error("Untrusted certificate"), { code: "DEPTH_ZERO_SELF_SIGNED_CERT" }));
      });
      return req;
    });
    const warning = jest.spyOn(console, "warn").mockImplementation(() => {});
    const response = await request({ target: "https://account.documents.azure.com" });
    expect(response.status).toBe(502);
    expect(outbound).toHaveBeenCalledTimes(1);
    expect(warning).toHaveBeenCalledWith("Cosmos proxy request failed:", "DEPTH_ZERO_SELF_SIGNED_CERT");
  });
});
