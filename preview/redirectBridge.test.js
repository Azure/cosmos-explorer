const assert = require("node:assert/strict");
const { once } = require("node:events");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { after, before, test } = require("node:test");
const express = require("express");
const app = require("./index");
const { installRedirectBridge } = require("./redirectBridge");

let server;

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

function request(requestPath, headers = {}, target = server) {
  return new Promise((resolve, reject) => {
    const req = http.get(
      { hostname: "127.0.0.1", port: target.address().port, path: requestPath, headers },
      (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => (body += chunk));
        response.on("end", () => resolve({ status: response.statusCode, headers: response.headers, body }));
        response.on("error", reject);
      },
    );
    req.on("error", reject);
  });
}

function assertBridgeHeaders(response) {
  assert.equal(response.headers["cache-control"], "no-store");
  assert.equal(response.headers["referrer-policy"], "no-referrer");
  assert.equal(response.headers["cross-origin-opener-policy"], undefined);
  assert.equal(response.headers.etag, undefined);
  assert.equal(response.headers["last-modified"], undefined);
  assert.equal(response.headers.location, undefined);
}

test("root callback serves the existing bridge and every script from the same host", async () => {
  const response = await request("/redirectBridge.html");
  assert.equal(response.status, 200);
  assert.match(response.headers["content-type"], /text\/html/);
  assert.match(response.body, /Processing authentication/);
  assertBridgeHeaders(response);

  const scripts = [...response.body.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(scripts.length, 1);
  for (const script of scripts) {
    assert.match(script, /^\/redirectBridge\.[a-f0-9]+\.js$/);
    const asset = await request(script);
    assert.equal(asset.status, 200);
    assert.match(asset.headers["content-type"], /javascript/);
    assert.match(asset.body, /BroadcastChannel/);
    assertBridgeHeaders(asset);
  }
});

test("callback query values are not reflected and conditional requests are not cached", async () => {
  const response = await request("/redirectBridge.html?code=synthetic-test-code&state=synthetic-test-state", {
    "If-None-Match": '"previous-bridge"',
    "If-Modified-Since": "Wed, 01 Jan 2031 00:00:00 GMT",
  });
  assert.equal(response.status, 200);
  assertBridgeHeaders(response);
  assert.doesNotMatch(response.body, /synthetic-test-code|synthetic-test-state/);
});

test("bridge hosting does not expose server files or intercept unrelated preview routes", async () => {
  assert.equal((await request("/package.json")).status, 404);
  assert.equal((await request("/%2e%2e/index.js")).status, 404);
  const invalidPull = await request("/pull/not-a-number");
  assert.equal(invalidPull.status, 400);
  assert.equal(invalidPull.body, "Invalid pull request number");
});

test("missing bridge fails explicitly rather than starting a broken callback", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "preview-bridge-test-"));
  try {
    assert.throws(() => installRedirectBridge(express(), directory), /npm run build:bridge/);
  } finally {
    fs.rmdirSync(directory);
  }
});

test("bridge removes an application-level COOP header", async () => {
  const isolated = express();
  isolated.use((_request, response, next) => {
    response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    next();
  });
  installRedirectBridge(isolated);
  const isolatedServer = isolated.listen(0, "127.0.0.1");
  await once(isolatedServer, "listening");
  try {
    const response = await request("/redirectBridge.html", {}, isolatedServer);
    assert.equal(response.status, 200);
    assertBridgeHeaders(response);
  } finally {
    await new Promise((resolve, reject) => isolatedServer.close((error) => (error ? reject(error) : resolve())));
  }
});

test("bridge middleware leaves existing root, commit, API, proxy and PR routes untouched", async () => {
  const isolated = express();
  installRedirectBridge(isolated);
  isolated.use((req, res) => res.status(202).send(req.originalUrl));
  const isolatedServer = isolated.listen(0, "127.0.0.1");
  await once(isolatedServer, "listening");
  try {
    for (const route of [
      "/",
      "/commit/example/explorer.html",
      "/commit/example/redirectBridge.html",
      "/api/example",
      "/proxy/example",
      "/pull/2586?feature.example=true",
    ]) {
      const response = await request(route, {}, isolatedServer);
      assert.equal(response.status, 202);
      assert.equal(response.body, route);
      assert.equal(response.headers["cache-control"], undefined);
    }
  } finally {
    await new Promise((resolve, reject) => isolatedServer.close((error) => (error ? reject(error) : resolve())));
  }
});
