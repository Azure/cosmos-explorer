import { AccountKind, CapabilityNames } from "../../Common/Constants";
import { AccessInputMetadata, ApiKind } from "../../Contracts/DataModels";
import { DefaultExperienceUtility } from "../../Shared/DefaultExperienceUtility";
import { userContext } from "../../UserContext";

export function getDatabaseAccountPropertiesFromMetadata(metadata: AccessInputMetadata): unknown {
  let properties = { documentEndpoint: metadata.documentEndpoint };
  const apiExperience = DefaultExperienceUtility.getDefaultExperienceFromApiKind(metadata.apiKind);

  if (apiExperience === "Cassandra") {
    properties = Object.assign(properties, {
      cassandraEndpoint: metadata.apiEndpoint,
      capabilities: [{ name: CapabilityNames.EnableCassandra }],
    });
  } else if (apiExperience === "Tables") {
    properties = Object.assign(properties, {
      tableEndpoint: metadata.apiEndpoint,
      capabilities: [{ name: CapabilityNames.EnableTable }],
    });
  } else if (apiExperience === "Gremlin") {
    properties = Object.assign(properties, {
      gremlinEndpoint: metadata.apiEndpoint,
      capabilities: [{ name: CapabilityNames.EnableGremlin }],
    });
  } else if (apiExperience === "Mongo") {
    if (metadata.apiKind === ApiKind.MongoDBCompute) {
      properties = Object.assign(properties, {
        mongoEndpoint: metadata.mongoEndpoint,
      });
    }
  }
  return properties;
}

export function getDatabaseAccountKindFromExperience(apiExperience: typeof userContext.apiType): AccountKind {
  if (apiExperience === "Mongo") {
    return AccountKind.MongoDB;
  }

  return AccountKind.GlobalDocumentDB;
}

export function extractMasterKeyfromConnectionString(connectionString: string): string | undefined {
  // Only Gremlin uses the actual master key for connection to cosmos
  const matchedParts = connectionString.match("AccountKey=(.*);ApiKind=Gremlin;$");
  return (matchedParts && matchedParts.length > 1 && matchedParts[1]) || undefined;
}

// Extracts the account key from any Cosmos connection string. The account key value cannot contain a
// semicolon, so we capture everything up to the next connection-string delimiter.
export function extractAccountKeyFromConnectionString(connectionString: string): string | undefined {
  const matchedParts = connectionString?.match(/AccountKey=([^;]*)/);
  return (matchedParts && matchedParts.length > 1 && matchedParts[1]) || undefined;
}

// SQL, Tables, and Gremlin can sign data-plane requests client-side with the account key, so they do
// not need the Portal Backend proxy for connection-string login. Mongo and Cassandra still require the
// proxy because they use wire protocols the browser cannot speak directly.
export function isDirectConnectionStringLoginApi(apiKind: ApiKind): boolean {
  return apiKind === ApiKind.SQL || apiKind === ApiKind.Table || apiKind === ApiKind.Graph;
}

// DNS zones a SQL, Tables, or Gremlin connection-string endpoint host is allowed to belong to. Mirrors
// the allowlist enforced by the Portal Backend's
// ConnectionStringAccessProvider.ValidateHostAndAccount for the direct-login APIs. Both the newer
// `table.cosmos.azure.com` and legacy `table.cosmosdb.azure.com` Tables zones are accepted.
const directLoginAllowlistedEndpointZones = [
  "documents.azure.com",
  "table.cosmos.azure.com",
  "table.cosmosdb.azure.com",
];

// Returns the substring of `value` starting at `startIndex` up to the first ':', '/', or '?'.
// Mirrors ExtractHostToken in the Portal Backend.
function extractHostToken(value: string, startIndex: number): string {
  let end = value.length;
  for (let i = startIndex; i < value.length; i++) {
    const c = value[i];
    if (c === ":" || c === "/" || c === "?") {
      end = i;
      break;
    }
  }
  return value.substring(startIndex, end);
}

// Extracts the endpoint host from a connection string, mirroring ExtractEndpointHost in the Portal
// Backend. Handles AccountEndpoint/TableEndpoint (URI or bare host), HostName, and mongodb:// segments.
export function extractEndpointHostFromConnectionString(connectionString: string): string | undefined {
  for (const part of connectionString.split(";")) {
    const trimmed = part.trim();

    if (trimmed.toLowerCase().startsWith("mongodb://")) {
      const atIndex = trimmed.indexOf("@");
      if (atIndex >= 0 && atIndex < trimmed.length - 1) {
        return extractHostToken(trimmed, atIndex + 1);
      }
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex < 0 || equalsIndex === trimmed.length - 1) {
      continue;
    }

    const key = trimmed.substring(0, equalsIndex).trim().toLowerCase();
    const value = trimmed.substring(equalsIndex + 1).trim();

    if (key === "accountendpoint" || key === "tableendpoint") {
      try {
        return new URL(value).hostname;
      } catch {
        // Value may be a bare host without a scheme.
        return extractHostToken(value, 0);
      }
    }

    if (key === "hostname") {
      return extractHostToken(value, 0);
    }
  }

  return undefined;
}

// Client-side equivalent of the Portal Backend's ConnectionStringAccessProvider.ValidateHostAndAccount,
// scoped to the direct-login APIs (SQL, Tables, Gremlin). Ensures the connection string parses to an
// account name, exposes an endpoint host in an allowlisted DNS zone, that the account name matches the
// first DNS label of that host, and that an account key is present. Returns an error message when
// invalid, or undefined when the connection string is valid for direct login.
export function validateDirectConnectionStringLogin(
  connectionString: string,
  metadata: AccessInputMetadata,
): string | undefined {
  if (!connectionString) {
    return "Connection string is missing.";
  }

  if (!metadata || !metadata.accountName) {
    return "Account name is missing from the connection string.";
  }

  const host = extractEndpointHostFromConnectionString(connectionString);
  if (!host) {
    return "Endpoint host is missing from the connection string.";
  }

  // The host must belong to one of the allowlisted runtime endpoint zones.
  const isAllowlistedHost = directLoginAllowlistedEndpointZones.some((zone) =>
    host.toLowerCase().endsWith(`.${zone.toLowerCase()}`),
  );
  if (!isAllowlistedHost) {
    return "Endpoint host is not allowed.";
  }

  // The account name must be the first DNS label of the host.
  if (host.split(".")[0].toLowerCase() !== metadata.accountName.toLowerCase()) {
    return "Account name does not match the endpoint host.";
  }

  // Direct login signs requests with the account key, so it must be present in the connection string.
  if (!extractAccountKeyFromConnectionString(connectionString)) {
    return "Account key is missing from the connection string.";
  }

  return undefined;
}
