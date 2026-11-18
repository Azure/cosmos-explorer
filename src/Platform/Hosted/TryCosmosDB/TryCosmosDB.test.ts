import {
  fetchTrialDetection,
  isAllowedTrialBackend,
  isTrialOwnerAuth,
  extendTrial,
  trialExtensionUrl,
  readTrialDetection,
  TrialOwnerAuth,
  TrialResource,
  trialPortalUrl,
} from "./TryCosmosDB";
import { PortalBackendEndpoints } from "../../../Common/Constants";
import { Response as NodeResponse } from "node-fetch";
import i18n from "../../../i18n";

const resource: TrialResource = {
  accountName: "trial-account",
  resourceGroupName: "trial-group",
  timeLeftInSeconds: 1800,
};
const target = { resourceGroupName: resource.resourceGroupName };
const auth: TrialOwnerAuth = {
  provider: "github",
  token: "test-owner-token",
  expiresAt: Date.now() + 3600000,
  accountName: resource.accountName,
  resourceGroupName: resource.resourceGroupName,
  backendEndpoint: PortalBackendEndpoints.Prod,
};
const detectionCredentials = {
  accountName: resource.accountName,
  masterKey: "test-master-key==",
  backendEndpoint: auth.backendEndpoint,
};
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
Object.defineProperty(globalThis, "Response", { value: NodeResponse, configurable: true });
const successful = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  mockFetch.mockResolvedValue(successful({ isTryCosmosDB: false }));
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it("accepts only authoritative typed metadata and strips extra fields", () => {
  expect(readTrialDetection({ isTryCosmosDB: false, ownerEmail: "not-returned" })).toEqual({ isTryCosmosDB: false });
  expect(
    readTrialDetection({
      isTryCosmosDB: true,
      trialResource: {
        ...resource,
        signInProvider: "github",
        documentEndpoint: "https://trial-account.documents.azure.com/",
        apiKind: 0,
        token: "not-returned",
        accountResourceId: "/subscriptions/not-returned",
      },
    }),
  ).toEqual({
    isTryCosmosDB: true,
    trialResource: resource,
  });
  for (const value of [
    {},
    { isTryCosmosDB: true },
    { isTryCosmosDB: true, trialResource: { ...resource, timeLeftInSeconds: "1800" } },
    { isTryCosmosDB: true, trialResource: { ...resource, resourceGroupName: "" } },
  ]) {
    expect(() => readTrialDetection(value)).toThrow("invalid trial metadata");
  }
});

it("requires unexpired owner credentials from a trusted backend without arbitrary token limits", () => {
  expect(isTrialOwnerAuth(auth)).toBe(true);
  expect(isTrialOwnerAuth({ ...auth, expiresAt: Date.now() })).toBe(false);
  expect(isTrialOwnerAuth({ ...auth, token: "a".repeat(16385) })).toBe(true);
  expect(isTrialOwnerAuth({ ...auth, token: "" })).toBe(false);
  expect(isTrialOwnerAuth({ ...auth, backendEndpoint: "https://other.example/" })).toBe(false);
  expect(isTrialOwnerAuth({ ...auth, backendEndpoint: "https://localhost:1234" })).toBe(false);
  expect(isTrialOwnerAuth({ ...auth, backendEndpoint: `${auth.backendEndpoint}/` })).toBe(false);
  expect(isAllowedTrialBackend(PortalBackendEndpoints.Development)).toBe(true);
  expect(isAllowedTrialBackend("https://evil.example")).toBe(false);
});

it("sends parsed account credentials as JSON without a raw connection string", async () => {
  await fetchTrialDetection(detectionCredentials);
  expect(mockFetch).toHaveBeenCalledWith(
    `${auth.backendEndpoint}/api/connectionstring/trycosmosdb/metadata`,
    expect.objectContaining({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountName: resource.accountName, masterKey: detectionCredentials.masterKey }),
    }),
  );
});

it.each([
  { accountName: "", masterKey: detectionCredentials.masterKey },
  { accountName: resource.accountName, masterKey: "" },
  { accountName: resource.accountName, masterKey: undefined },
])("requires account credentials before sending a trial detection request: %j", async (credentials) => {
  await expect(fetchTrialDetection({ ...detectionCredentials, ...credentials })).rejects.toThrow(
    "An account name and master key are required",
  );
  expect(mockFetch).not.toHaveBeenCalled();
});

it("does not classify HTTP failures as non-trial", async () => {
  mockFetch.mockResolvedValue(new Response("", { status: 503 }));
  await expect(fetchTrialDetection(detectionCredentials)).rejects.toThrow("HTTP 503");
  await expect(
    fetchTrialDetection({ ...detectionCredentials, backendEndpoint: "https://other.example" }),
  ).rejects.toThrow("not allowed");
  await expect(
    fetchTrialDetection({ ...detectionCredentials, backendEndpoint: "https://localhost:1234" }),
  ).rejects.toThrow("not allowed");
  await expect(
    fetchTrialDetection({ ...detectionCredentials, backendEndpoint: `${auth.backendEndpoint}/` }),
  ).rejects.toThrow("not allowed");
  expect(mockFetch).toHaveBeenCalledTimes(1);
});

it("localizes detection and extension errors with the HTTP status preserved", async () => {
  i18n.addResourceBundle("fr", "Resources", {
    tryCosmosDB: {
      statusHttpError: "Statut indisponible (HTTP {{status}}).",
      signInRequired: "Reconnectez-vous pour prolonger ce bac à sable.",
    },
  });
  try {
    await i18n.changeLanguage("fr");
    mockFetch.mockResolvedValue(new Response("", { status: 503 }));
    await expect(fetchTrialDetection(detectionCredentials)).rejects.toThrow("Statut indisponible (HTTP 503).");
    mockFetch.mockResolvedValue(new Response("", { status: 401 }));
    await expect(extendTrial(target, auth)).rejects.toMatchObject({
      message: "Reconnectez-vous pour prolonger ce bac à sable.",
      signInRequired: true,
    });
  } finally {
    await i18n.changeLanguage("en");
    i18n.removeResourceBundle("fr", "Resources");
  }
});

it("uses owner bearer authentication and only the resource-group target", async () => {
  mockFetch.mockResolvedValue(successful({ timeLeftInSeconds: 2592000 }));
  await expect(extendTrial(target, auth)).resolves.toEqual({ timeLeftInSeconds: 2592000 });
  expect(mockFetch).toHaveBeenCalledWith(
    `${auth.backendEndpoint}/api/trycosmosdb/resource/extend`,
    expect.objectContaining({
      method: "POST",
      headers: { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(target),
    }),
  );
  expect(JSON.parse(mockFetch.mock.calls[0][1]?.body as string)).toEqual({
    resourceGroupName: resource.resourceGroupName,
  });
  await expect(extendTrial({ resourceGroupName: "" }, auth)).rejects.toThrow("invalid");
  expect(mockFetch).toHaveBeenCalledTimes(1);
});

it("distinguishes auth rejection, resource-group mismatch and ambiguous successful responses", async () => {
  mockFetch.mockResolvedValue(new Response("", { status: 401 }));
  await expect(extendTrial(target, auth)).rejects.toMatchObject({ signInRequired: true });
  mockFetch.mockResolvedValue(new Response("", { status: 409 }));
  await expect(extendTrial(target, auth)).rejects.toThrow("sandbox changed");
  mockFetch.mockResolvedValue(successful({}));
  await expect(extendTrial(target, auth)).rejects.toThrow("could not be confirmed");
  mockFetch.mockRejectedValue(new Error("network"));
  await expect(extendTrial(target, auth)).rejects.toThrow("could not be confirmed");
});

it("selects the local backend only for matching local Portal URLs", () => {
  jest.replaceProperty(process.env, "NODE_ENV", "development");
  const local = trialPortalUrl(PortalBackendEndpoints.Development);
  expect(local.origin).toBe("https://localhost:12900");
  expect(local.searchParams.get("localBackend")).toBe("true");
  const mpac = trialPortalUrl(PortalBackendEndpoints.Mpac);
  expect(mpac.searchParams.has("localBackend")).toBe(false);
  expect(mpac.searchParams.has("disableMaintenanceMode")).toBe(false);
});

it.each([
  { environment: "local", mode: "development", hostname: "localhost", backend: PortalBackendEndpoints.Development },
  { environment: "MPAC", mode: "development", hostname: "localhost", backend: PortalBackendEndpoints.Mpac },
  {
    environment: "production",
    mode: "production",
    hostname: "cosmos.azure.com",
    backend: PortalBackendEndpoints.Prod,
  },
])("builds a credential-free normal Portal extension destination in $environment", ({ mode, hostname, backend }) => {
  jest.replaceProperty(process.env, "NODE_ENV", mode);
  jest.spyOn(window, "location", "get").mockReturnValue({ ...window.location, hostname });
  const url = trialExtensionUrl(resource, backend);
  expect(url.origin).toBe(hostname === "localhost" ? "https://localhost:12900" : "https://cosmos.azure.com");
  expect(url.pathname).toBe(hostname === "localhost" ? "/" : "/try/");
  expect(url.searchParams.get("disableMaintenanceMode")).toBe("true");
  expect(url.searchParams.get("view")).toBe("account");
  expect(url.searchParams.get("resourceGroupName")).toBe(resource.resourceGroupName);
  expect(url.hash).toBe("#extend");
  expect([...url.searchParams.keys()].sort()).toEqual(
    [
      "disableMaintenanceMode",
      "view",
      "resourceGroupName",
      ...(hostname === "localhost" && backend === PortalBackendEndpoints.Development ? ["localBackend"] : []),
    ].sort(),
  );
});

it.each(["test", "production"])("rejects invalid targets and unsupported Portal environments in %s mode", (mode) => {
  expect(() => trialExtensionUrl({ resourceGroupName: "" }, auth.backendEndpoint)).toThrow("invalid");
  expect(() => trialExtensionUrl(resource, "https://attacker.example")).toThrow("not allowed");
  jest.replaceProperty(process.env, "NODE_ENV", mode);
  expect(() => trialPortalUrl(auth.backendEndpoint)).toThrow("not allowed");
  jest.spyOn(window, "location", "get").mockReturnValue({ ...window.location, hostname: "cosmos.azure.com" });
  expect(() => trialPortalUrl(PortalBackendEndpoints.Mpac)).toThrow("matching");
});
