import { PortalBackendEndpoints } from "../../../Common/Constants";
import { Keys, t } from "Localization";

export type SignInProvider = "microsoft" | "github";

export interface TrialTarget {
  resourceGroupName: string;
}

export interface TrialResource {
  accountName: string;
  resourceGroupName: string;
  timeLeftInSeconds: number;
}

export interface TrialOwnerAuth {
  provider: SignInProvider;
  token: string;
  expiresAt: number;
  accountName: string;
  resourceGroupName: string;
  backendEndpoint: string;
}

export type TrialDetection = { isTryCosmosDB: false } | { isTryCosmosDB: true; trialResource: TrialResource };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const isSignInProvider = (value: unknown): value is SignInProvider => value === "microsoft" || value === "github";
const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

export function isTrialTarget(value: unknown): value is TrialTarget {
  return isObject(value) && isNonEmptyString(value.resourceGroupName);
}

export function isAllowedTrialBackend(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }
  const endpoints: string[] = [
    PortalBackendEndpoints.Prod,
    PortalBackendEndpoints.Mpac,
    PortalBackendEndpoints.Development,
  ];
  return endpoints.includes(value);
}

export function isTrialOwnerAuth(value: unknown): value is TrialOwnerAuth {
  return (
    isObject(value) &&
    isSignInProvider(value.provider) &&
    isNonEmptyString(value.token) &&
    isFiniteNumber(value.expiresAt) &&
    value.expiresAt > Date.now() &&
    isNonEmptyString(value.accountName) &&
    isNonEmptyString(value.resourceGroupName) &&
    isAllowedTrialBackend(value.backendEndpoint)
  );
}

export function readTrialDetection(value: unknown): TrialDetection {
  if (isObject(value) && value.isTryCosmosDB === false) {
    return { isTryCosmosDB: false };
  }
  if (isObject(value) && value.isTryCosmosDB === true) {
    const resource = value.trialResource;
    if (
      isObject(resource) &&
      isNonEmptyString(resource.accountName) &&
      isNonEmptyString(resource.resourceGroupName) &&
      isFiniteNumber(resource.timeLeftInSeconds)
    ) {
      return {
        isTryCosmosDB: true,
        trialResource: {
          accountName: resource.accountName,
          resourceGroupName: resource.resourceGroupName,
          timeLeftInSeconds: resource.timeLeftInSeconds,
        },
      };
    }
  }
  throw new Error(t(Keys.tryCosmosDB.metadataInvalid));
}

export async function fetchTrialDetection(
  connection: { accountName: string; masterKey?: string; backendEndpoint: string },
  signal?: AbortSignal,
): Promise<TrialDetection> {
  if (!connection.accountName || !connection.masterKey) {
    throw new Error(t(Keys.tryCosmosDB.detectionCredentialsRequired));
  }
  if (!isAllowedTrialBackend(connection.backendEndpoint)) {
    throw new Error(t(Keys.tryCosmosDB.backendNotAllowed));
  }
  const response = await fetch(`${connection.backendEndpoint}/api/connectionstring/trycosmosdb/metadata`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accountName: connection.accountName, masterKey: connection.masterKey }),
    signal,
  });
  if (!response.ok) {
    throw new Error(t(Keys.tryCosmosDB.statusHttpError, { status: response.status }));
  }
  let metadata: unknown;
  try {
    metadata = await response.json();
  } catch {
    throw new Error(t(Keys.tryCosmosDB.metadataInvalid));
  }
  return readTrialDetection(metadata);
}

export class TrialOperationError extends Error {
  constructor(
    message: string,
    public readonly signInRequired = false,
    public readonly refreshRequired = false,
  ) {
    super(message);
    this.name = "TrialOperationError";
  }
}

export async function extendTrial(target: TrialTarget, auth: TrialOwnerAuth): Promise<{ timeLeftInSeconds: number }> {
  if (!isTrialTarget(target)) {
    throw new TrialOperationError(t(Keys.tryCosmosDB.resourceGroupInvalid));
  }
  if (!isTrialOwnerAuth(auth)) {
    throw new TrialOperationError(t(Keys.tryCosmosDB.signInRequired), true);
  }
  let response: Response;
  try {
    response = await fetch(`${auth.backendEndpoint}/api/trycosmosdb/resource/extend`, {
      method: "POST",
      headers: { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ resourceGroupName: target.resourceGroupName }),
    });
  } catch {
    throw new TrialOperationError(t(Keys.tryCosmosDB.operationUnconfirmed), false, true);
  }
  if (response.status === 401) {
    throw new TrialOperationError(t(Keys.tryCosmosDB.signInRequired), true);
  }
  if (!response.ok) {
    const message =
      response.status === 409
        ? t(Keys.tryCosmosDB.sandboxChanged)
        : response.status === 403 || response.status === 404
        ? t(Keys.tryCosmosDB.identityNotAllowed)
        : t(Keys.tryCosmosDB.operationHttpError, { status: response.status });
    throw new TrialOperationError(
      message,
      response.status === 403 || response.status === 404,
      response.status === 409 || response.status >= 500,
    );
  }
  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new TrialOperationError(t(Keys.tryCosmosDB.extensionUnconfirmed), false, true);
  }
  if (!isObject(result) || !isFiniteNumber(result.timeLeftInSeconds) || result.timeLeftInSeconds <= 0) {
    throw new TrialOperationError(t(Keys.tryCosmosDB.extensionUnconfirmed), false, true);
  }
  return { timeLeftInSeconds: result.timeLeftInSeconds };
}

export function trialPortalUrl(backendEndpoint: string): URL {
  if (!isAllowedTrialBackend(backendEndpoint)) {
    throw new Error(t(Keys.tryCosmosDB.backendNotAllowed));
  }
  const url = new URL(
    window.location.hostname === "localhost" ? "https://localhost:12900/" : "https://cosmos.azure.com/try/",
  );
  if (url.hostname === "localhost") {
    if (process.env.NODE_ENV !== "development") {
      throw new Error(t(Keys.tryCosmosDB.portalNotAllowed));
    }
    if (backendEndpoint === PortalBackendEndpoints.Development) {
      url.searchParams.set("localBackend", "true");
    }
  } else if (backendEndpoint !== PortalBackendEndpoints.Prod) {
    throw new Error(t(Keys.tryCosmosDB.environmentMismatch));
  }
  return url;
}

export function trialExtensionUrl(resource: TrialTarget, backendEndpoint: string): URL {
  if (!isTrialTarget(resource)) {
    throw new Error(t(Keys.tryCosmosDB.resourceGroupInvalid));
  }
  const url = trialPortalUrl(backendEndpoint);
  url.searchParams.set("disableMaintenanceMode", "true");
  url.searchParams.set("view", "account");
  url.searchParams.set("resourceGroupName", resource.resourceGroupName);
  url.hash = "extend";
  return url;
}
