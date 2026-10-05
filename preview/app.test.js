import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer, request as httpRequest } from "node:http";
import { createServer as createNetServer } from "node:net";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";

const testOptions = { timeout: 10000 };

const listen = async (t, server, loopbackOnly = true) => {
  const sockets = new Set();
  server.on("connection", (socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
  });
  t.after(async () => {
    for (const socket of sockets) {
      socket.destroy();
    }
    if (server.listening) {
      await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    }
  });
  server.listen({ port: 0, ...(loopbackOnly ? { host: "127.0.0.1" } : {}) });
  await once(server, "listening");
  return { server, url: `http://127.0.0.1:${server.address().port}` };
};

const startServer = (t, handler) => listen(t, createServer(handler));

const echoServer = (t) =>
  startServer(t, async (req, res) => {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    res.writeHead(201, { "content-type": "application/json", "x-preview-fixture": "upstream" });
    res.end(
      JSON.stringify({
        url: req.url,
        method: req.method,
        headers: req.headers,
        body: Buffer.concat(chunks).toString("base64"),
      }),
    );
  });

const request = (url, { method = "GET", headers = {}, chunks = [], onResponse, onData } = {}) =>
  new Promise((resolve, reject) => {
    const req = httpRequest(url, { method, headers, agent: false }, (res) => {
      const body = [];
      res.on("error", reject);
      res.on("data", (chunk) => {
        body.push(chunk);
        onData?.(res, chunk);
      });
      res.on("end", () =>
        resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(body).toString() }),
      );
      onResponse?.(res);
    });
    req.on("error", reject);
    req.setTimeout(5000, () => req.destroy(new Error("Fixture request timed out")));
    for (const chunk of chunks) {
      req.write(chunk);
    }
    req.end();
  });

const startApp = async (t, options = {}) => startServer(t, createApp(options));

for (const [path, expected] of [
  ["/api", "/"],
  ["/api/", "/"],
  ["/api/dbs/items/?q=a%2Fb&space=a+b&raw=a?b", "/dbs/items/?q=a%2Fb&space=a+b&raw=a?b"],
  ["/proxy", "/"],
  ["/proxy/dbs/a%2Fb?x=1&x=2", "/dbs/a%2Fb?x=1&x=2"],
  ["/proxy/proxy/items", "/proxy/items"],
  ["/commit", "/"],
  ["/commit/abc/explorer.html?feature.test=true", "/abc/explorer.html?feature.test=true"],
  ["/commit/commit/items/", "/commit/items/"],
]) {
  test(`forwards ${path} with exactly one mount prefix removed`, testOptions, async (t) => {
    const upstream = await echoServer(t);
    const app = await startApp(t, {
      backendEndpoint: upstream.url,
      previewStorageWebsiteEndpoint: upstream.url,
    });
    const response = await request(`${app.url}${path}`, { headers: { authorization: "test-authorization" } });
    assert.equal(response.status, 201);
    assert.equal(response.headers["x-preview-fixture"], "upstream");
    const forwarded = JSON.parse(response.body);
    assert.equal(forwarded.url, expected);
    assert.equal(forwarded.method, "GET");
    assert.equal(forwarded.headers.host, new URL(upstream.url).host);
    assert.equal(forwarded.headers.authorization, "test-authorization");
  });
}

test("preserves streamed request bytes, method, and content type on every proxy mount", testOptions, async (t) => {
  const upstream = await echoServer(t);
  const app = await startApp(t, {
    backendEndpoint: upstream.url,
    previewStorageWebsiteEndpoint: upstream.url,
  });
  const chunks = [Buffer.from([0, 255, 128]), Buffer.alloc(128 * 1024, 65), Buffer.from("last chunk")];
  for (const mount of ["api", "proxy", "commit"]) {
    const response = await request(`${app.url}/${mount}/items`, {
      method: "POST",
      headers: { "content-type": "application/octet-stream" },
      chunks,
    });
    const forwarded = JSON.parse(response.body);
    assert.equal(response.status, 201);
    assert.equal(forwarded.method, "POST");
    assert.equal(forwarded.headers["content-type"], "application/octet-stream");
    assert.equal(forwarded.body, Buffer.concat(chunks).toString("base64"));
  }
});

test("selects dynamic targets per request and retains the missing-header fallback", testOptions, async (t) => {
  const backend = await echoServer(t);
  const first = await echoServer(t);
  const second = await echoServer(t);
  const app = await startApp(t, { backendEndpoint: backend.url });
  for (const upstream of [first, second, backend]) {
    const headers = upstream === backend ? {} : { "x-ms-proxy-target": `${upstream.url}/base/` };
    const response = await request(`${app.url}/proxy/items?x=1`, { headers });
    const forwarded = JSON.parse(response.body);
    assert.equal(response.status, 201);
    assert.equal(forwarded.headers.host, new URL(upstream.url).host);
    assert.equal(forwarded.url, upstream === backend ? "/items?x=1" : "/base/items?x=1");
  }
});

test("returns 400 for malformed or unsupported dynamic targets without exposing them", testOptions, async (t) => {
  const log = t.mock.method(console, "error", () => {});
  const app = await startApp(t);
  for (const target of ["not-a-url", "file:///tmp/fixture", "ws://127.0.0.1/fixture"]) {
    const response = await request(`${app.url}/proxy/items`, { headers: { "x-ms-proxy-target": target } });
    assert.equal(response.status, 400);
    assert.equal(log.mock.calls.at(-1).arguments.length, 1);
    assert.ok(!log.mock.calls.at(-1).arguments[0].includes(target));
  }
});

test("returns an empty 200 for API OPTIONS without contacting an upstream", testOptions, async (t) => {
  let calls = 0;
  const upstream = await startServer(t, (req, res) => {
    calls += 1;
    res.end();
  });
  const app = await startApp(t, { backendEndpoint: upstream.url });
  const response = await request(`${app.url}/api/dbs`, { method: "OPTIONS" });
  assert.equal(response.status, 200);
  assert.equal(response.body, "");
  assert.equal(calls, 0);
});

test("does not match paths outside the proxy mount boundaries", testOptions, async (t) => {
  const app = await startApp(t);
  for (const path of ["/apix", "/proxyx", "/commitx"]) {
    const response = await request(`${app.url}${path}`);
    assert.equal(response.status, 404);
  }
});

test("forwards upstream redirects and cookies without following the redirect", testOptions, async (t) => {
  let calls = 0;
  const upstream = await startServer(t, (req, res) => {
    calls += 1;
    res.writeHead(307, { location: "/destination", "set-cookie": ["fixture=one", "fixture=two"] });
    res.end("redirect");
  });
  const app = await startApp(t, {
    backendEndpoint: upstream.url,
    previewStorageWebsiteEndpoint: upstream.url,
  });
  for (const mount of ["api", "proxy", "commit"]) {
    const response = await request(`${app.url}/${mount}/redirect`);
    assert.equal(response.status, 307);
    assert.equal(response.headers.location, "/destination");
    assert.deepEqual(response.headers["set-cookie"], ["fixture=one", "fixture=two"]);
    assert.equal(response.body, "redirect");
  }
  assert.equal(calls, 3);
});

test("preserves the 504 response for connection refusal and logs only the error code", testOptions, async (t) => {
  const log = t.mock.method(console, "error", () => {});
  const upstream = await echoServer(t);
  await new Promise((resolve, reject) => upstream.server.close((error) => (error ? reject(error) : resolve())));
  const app = await startApp(t, { backendEndpoint: upstream.url });
  const response = await request(`${app.url}/api/items`, { headers: { authorization: "test-authorization" } });
  assert.equal(response.status, 504);
  assert.deepEqual(log.mock.calls[0].arguments, ["Preview proxy request failed:", "ECONNREFUSED"]);
});

test("preserves the 502 response for an invalid upstream HTTP response", testOptions, async (t) => {
  t.mock.method(console, "error", () => {});
  const upstream = await listen(
    t,
    createNetServer((socket) => socket.once("data", () => socket.end("INVALID HTTP RESPONSE\r\n\r\n"))),
  );
  const app = await startApp(t, { backendEndpoint: upstream.url });
  const response = await request(`${app.url}/api/items`);
  assert.equal(response.status, 502);
});

test("preserves the 504 response when an upstream disconnects before headers", testOptions, async (t) => {
  const log = t.mock.method(console, "error", () => {});
  const upstream = await startServer(t, (req, res) => res.destroy());
  const app = await startApp(t, { backendEndpoint: upstream.url });
  const response = await request(`${app.url}/api/items`);
  assert.equal(response.status, 504);
  assert.deepEqual(log.mock.calls[0].arguments, ["Preview proxy request failed:", "ECONNRESET"]);
});

test("terminates a truncated upstream response without sending a second response", testOptions, async (t) => {
  t.mock.method(console, "error", () => {});
  let terminate;
  const upstream = await startServer(t, (req, res) => {
    terminate = () => res.destroy();
    res.writeHead(200, { "content-type": "text/plain" });
    res.write("partial response");
  });
  const app = await startApp(t, { backendEndpoint: upstream.url });
  let status;
  await assert.rejects(
    request(`${app.url}/api/items`, {
      onData: (res) => {
        status = res.statusCode;
        terminate();
      },
    }),
    { code: "ECONNRESET" },
  );
  assert.equal(status, 200);
  assert.equal((await request(`${app.url}/not-a-route`)).status, 404);
});

test("cancels the upstream response when the client disconnects", testOptions, async (t) => {
  t.mock.method(console, "error", () => {});
  let closeUpstream;
  const upstreamClosed = new Promise((resolve) => {
    closeUpstream = resolve;
  });
  const upstream = await startServer(t, (req, res) => {
    res.on("close", closeUpstream);
    res.write("streaming response");
  });
  const app = await startApp(t, { backendEndpoint: upstream.url });
  await assert.rejects(
    request(`${app.url}/api/items`, { onData: (res) => res.destroy(new Error("Fixture client disconnect")) }),
    /Fixture client disconnect/,
  );
  await upstreamClosed;
  assert.equal((await request(`${app.url}/not-a-route`)).status, 404);
});

test("redirects master and PR previews using GitHub responses and preserves PR queries", testOptions, async (t) => {
  const calls = [];
  const github = await startServer(t, (req, res) => {
    calls.push(req.url);
    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify(
        req.url.endsWith("/branches/master") ? { commit: { sha: "master-sha" } } : { head: { sha: "pr-sha" } },
      ),
    );
  });
  const app = await startApp(t, { githubApiUrl: `${github.url}/repos/Azure/cosmos-explorer` });
  const master = await request(`${app.url}/`);
  assert.equal(master.status, 302);
  assert.equal(
    master.headers.location,
    "https://dataexplorer-preview.portal.cosmos.azure.com/commit/master-sha/hostedExplorer.html",
  );

  const response = await request(
    `${app.url}/pull/42?feature.test=true&value=a%2Fb&space=a+b&repeat=1&repeat=2&raw=a?b`,
  );
  assert.equal(response.status, 302);
  const portal = new URL(response.headers.location);
  assert.equal(portal.origin, "https://ms.portal.azure.com");
  const explorer = new URL(portal.searchParams.get("dataExplorerSource"));
  assert.equal(explorer.pathname, "/commit/pr-sha/explorer.html");
  assert.equal(explorer.searchParams.get("feature.test"), "true");
  assert.equal(explorer.searchParams.get("value"), "a/b");
  assert.equal(explorer.searchParams.get("space"), "a b");
  assert.deepEqual(explorer.searchParams.getAll("repeat"), ["1", "2"]);
  assert.equal(explorer.searchParams.get("raw"), "a?b");
  assert.deepEqual(calls, ["/repos/Azure/cosmos-explorer/branches/master", "/repos/Azure/cosmos-explorer/pulls/42"]);
});

test("supports a PR redirect with no query and rejects invalid PR numbers before fetching", testOptions, async (t) => {
  const calls = [];
  const app = await startApp(t, {
    fetchGitHub: async (url) => {
      calls.push(url);
      return { json: async () => ({ head: { sha: "pr-sha" } }) };
    },
  });
  const valid = await request(`${app.url}/pull/42`);
  const explorer = new URL(new URL(valid.headers.location).searchParams.get("dataExplorerSource"));
  assert.equal(explorer.search, "");
  for (const pr of ["invalid", "-1", "1%2F2"]) {
    const invalid = await request(`${app.url}/pull/${pr}`);
    assert.equal(invalid.status, 400);
    assert.equal(invalid.body, "Invalid pull request number");
  }
  assert.equal(calls.length, 1);
});

for (const [name, fetchGitHub, errorCode] of [
  [
    "fetch failure",
    async () => {
      throw new Error("Fixture lookup failure");
    },
    "Error",
  ],
  ["malformed GitHub response", async () => ({ json: async () => ({ message: "Fixture not found" }) }), "TypeError"],
  [
    "invalid GitHub JSON",
    async () => ({
      json: async () => {
        throw new SyntaxError("Fixture invalid JSON");
      },
    }),
    "SyntaxError",
  ],
]) {
  test(`returns and logs a 500 for ${name} on both GitHub routes`, testOptions, async (t) => {
    const log = t.mock.method(console, "error", () => {});
    const app = await startApp(t, { fetchGitHub });
    for (const path of ["/", "/pull/42"]) {
      const response = await request(`${app.url}${path}`);
      assert.equal(response.status, 500);
    }
    assert.equal(log.mock.calls.length, 2);
    for (const call of log.mock.calls) {
      assert.equal(call.arguments.length, 2);
      assert.equal(call.arguments[1], errorCode);
    }
  });
}

const spawnEntryPoint = (t, port) => {
  const child = spawn(process.execPath, ["index.js"], {
    cwd: fileURLToPath(new URL(".", import.meta.url)),
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const exited = once(child, "exit");
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill();
      await exited;
    }
  });
  return { child, exited };
};

test("starts the real entry point on PORT and preserves the storage replacement token", testOptions, async (t) => {
  const entryPoint = await readFile(new URL("./index.js", import.meta.url), "utf8");
  assert.ok(entryPoint.includes('const previewStorageWebsiteEndpoint = "_REPLACE_STORAGE_WEBSITE_ENDPOINT_"'));
  const { child } = spawnEntryPoint(t, 0);
  let stdout = "";
  const port = await new Promise((resolve, reject) => {
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      const match = stdout.match(/Preview app listening on port: (\d+)/);
      if (match) {
        resolve(Number(match[1]));
      }
    });
    child.on("error", reject);
    child.on("exit", (code) => reject(new Error(`Preview entry point exited before startup: ${code}`)));
  });
  assert.ok(port > 0);
  const response = await request(`http://127.0.0.1:${port}/api/items`, { method: "OPTIONS" });
  assert.equal(response.status, 200);
  assert.equal(response.body, "");
  const unconfigured = await request(`http://127.0.0.1:${port}/commit/sha/explorer.html`);
  assert.equal(unconfigured.status, 500);
});

test("reports a startup port conflict and exits unsuccessfully", testOptions, async (t) => {
  const occupied = await listen(t, createServer(), false);
  const { child, exited } = spawnEntryPoint(t, new URL(occupied.url).port);
  let stderr = "";
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  const [code] = await exited;
  assert.equal(code, 1);
  assert.match(stderr, /Preview server failed to start: EADDRINUSE/);
});
