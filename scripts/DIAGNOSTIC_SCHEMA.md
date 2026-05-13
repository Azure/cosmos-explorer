# Cosmos DB Connectivity Diagnostic - JSON Schema v1.0

## Overview
The diagnostic script outputs a structured JSON report containing network connectivity, private network configuration, and RBAC assessment data. This schema is stable and versioned to support parsing and triage automation.

## Root Object

```json
{
  "version": "1.0.0",                    // Schema version (semantic versioning)
  "timestamp": "2026-05-13T14:30:45.123Z",  // ISO 8601 UTC timestamp
  "target": {...},                       // Account and subscription context
  "execution": {...},                    // Script execution environment
  "diagnostics": {...},                  // All diagnostic results
  "classification": {...}                // Automated classification and recommendations
}
```

---

## Target Object
Account and subscription identifiers.

```json
{
  "target": {
    "endpointUrl": "https://my-cosmos-account.documents.azure.com",
    "hostname": "my-cosmos-account.documents.azure.com",
    "subscriptionId": "12345678-1234-1234-1234-123456789012",  // May be "REDACTED" if --Redact flag used
    "resourceGroup": "my-rg",                                   // May be "REDACTED"
    "accountName": "my-cosmos-account"                          // May be "REDACTED"
  }
}
```

---

## Execution Object
Environment where script ran.

```json
{
  "execution": {
    "hostname": "DESKTOP-ABC123",           // Machine name
    "platform": "Windows 10",               // OS name and version
    "powershellVersion": "7.3.0"           // PowerShell version
  }
}
```

---

## Diagnostics Object
All diagnostic results grouped by category.

```json
{
  "diagnostics": {
    "dns": { ... },                  // DNS resolution results
    "tcp": { ... },                  // TCP 443 connectivity results
    "https": { ... },                // HTTPS probe results
    "privateNetwork": { ... },       // Private endpoint indicators
    "azureNetworkConfig": { ... },   // ARM-sourced network configuration
    "rbac": { ... },                 // RBAC assessment
    "azureCli": { ... }              // Azure CLI context
  }
}
```

### DNS Results

```json
{
  "dns": {
    "hostname": "my-cosmos-account.documents.azure.com",
    "succeeded": true,                     // true = hostname resolved
    "addresses": [
      "52.180.123.45",                    // Resolved IPv4 addresses
      "2607:f8b0:4005:806::200e"         // IPv6 if available
    ],
    "error": null,                         // Error message if resolution failed
    "dnsServers": [
      "8.8.8.8",                         // Detected DNS servers
      "8.8.4.4"
    ],
    "latencyMs": 145                      // DNS query latency in milliseconds
  }
}
```

**Classification logic:**
- `succeeded: false` → DNS failure, likely network or DNS configuration issue
- `succeeded: true` with `addresses` containing private IP (10.x, 172.16-31.x, 192.168.x) → Private endpoint
- `succeeded: true` with `addresses` containing public IP → Public endpoint

### TCP Connectivity Results

```json
{
  "tcp": {
    "hostname": "my-cosmos-account.documents.azure.com",
    "port": 443,
    "succeeded": true,                    // true = TCP 443 connection established
    "error": null,                        // Error message if connection failed (e.g., "Connection timeout after 5000ms")
    "latencyMs": 87,                      // Connection latency
    "sourceIp": "192.168.1.100"          // Local IP used for connection attempt
  }
}
```

**Classification logic:**
- `succeeded: false` with DNS resolved → Network path blocked
- `error` contains "timeout" → VPN/firewall/NVA may be dropping packets
- `error` contains "refused" → Target may be rejecting connections

### HTTPS Probe Results

```json
{
  "https": {
    "url": "https://my-cosmos-account.documents.azure.com",
    "succeeded": true,                    // true = HTTP 200-299 response
    "statusCode": 401,                    // HTTP status code (401 expected without auth)
    "error": null,                        // TLS/connection errors
    "latencyMs": 234                      // Full request round-trip latency
  }
}
```

**Classification logic:**
- `succeeded: true` (any 2xx/4xx status) → Can reach endpoint
- `statusCode: 401` → Expected (no credentials), network is healthy
- `error` contains "certificate" or "TLS" → Certificate validation issue
- `error` and `succeeded: false` → Network or firewall blocking TLS

### Private Network Indicators

```json
{
  "privateNetwork": {
    "isPrivateRange": true,                // true if any resolved IP is RFC 1918
    "indicators": [
      "Resolved to RFC 1918 private IP range (10.123.171.30)",
      "Matches expected private endpoint IP (10.123.171.30)"
    ],
    "matchesExpectedPrivateEndpoint": true, // true if resolved IP matches PrivateEndpointIP parameter
    "vpnRouteWarning": null                // Warning if VPN subnet routing appears blocked
  }
}
```

### Azure Network Configuration

```json
{
  "azureNetworkConfig": {
    "checked": true,                      // true if successfully queried via Azure CLI
    "publicNetworkAccessRestricted": true, // true if public network access is disabled
    "privateEndpoints": [
      {
        "id": "/subscriptions/.../privateEndpointConnections/my-pe-connection",
        "state": "Approved"               // Status: Approved, Pending, Rejected
      }
    ],
    "vnetRules": [ ],                     // Virtual network rules (firewall)
    "error": null                         // Error if Azure CLI query failed
  }
}
```

### RBAC Assessment

```json
{
  "rbac": {
    "checked": true,                      // true if RBAC checked successfully
    "canReadAccount": true,               // true if caller can read account properties
    "canManageAccount": false,            // true if caller has Contributor/Owner
    "canExecuteDataPlaneOps": true,       // true if caller likely has data-plane roles
    "roleAssignments": [
      {
        "roleDefinitionName": "Cosmos DB Operator",
        "principalName": "user@example.com"
      }
    ],
    "classification": "partial",          // Enum: "sufficient", "partial", "insufficient", "unknown"
    "error": null                         // Error message if check failed
  }
}
```

### Azure CLI Context

```json
{
  "azureCli": {
    "installed": true,                    // true if Azure CLI is installed
    "authenticated": true,                // true if 'az login' was successful
    "currentUser": "user@example.com",    // May be "REDACTED-USER-NAME"
    "currentTenant": "12345678-1234-1234-1234-123456789012",  // May be "REDACTED-TENANT-ID"
    "currentSubscription": "abcdef01-2345-6789-abcd-ef0123456789",
    "error": null                         // Error if CLI not installed or not authenticated
  }
}
```

---

## Classification Object
Automated classification with recommendations.

```json
{
  "classification": {
    "status": "failure",                  // Enum: "success", "failure", "warning", "unknown"
    "code": "tcp_connectivity_blocked",  // Machine-readable classification code
    "summary": "DNS resolution succeeded but TCP 443 connection failed. Network path is blocked.",
    "rootCause": "Private endpoint configured but network path blocked (VPN routing, firewall/NVA, NSG, UDR, or peering issue)",
    "recommendedActions": [
      "1. Verify VPN connectivity and that your client subnet can route to the private endpoint subnet",
      "2. Ask your network team to verify routing between DESKTOP-ABC123 and private endpoint 10.123.171.30",
      "3. Check Azure network security groups (NSGs) rules for port 443 inbound",
      "4. Verify Azure Virtual Network peering and User Defined Routes (UDRs)",
      "5. Check if corporate firewall/NVA is blocking the connection",
      "6. Manually run: Test-NetConnection -ComputerName my-cosmos-account.documents.azure.com -Port 443"
    ]
  }
}
```

### Classification Codes Reference

| Code | Status | Meaning | Likely Cause |
|------|--------|---------|--------------|
| `dns_resolution_failed` | failure | Hostname cannot resolve | DNS misconfiguration, proxy redirect, network unreachable |
| `tcp_connectivity_blocked` | failure | DNS works, TCP 443 fails | Firewall, VPN routing, NVA, NSG, private path blocked |
| `private_endpoint_network_path_blocked` | failure | Private endpoint detected, TCP fails | VPN → private endpoint routing broken |
| `network_connectivity_healthy` | success | DNS and TCP both work | Network is healthy; check auth/RBAC if operations fail |
| `rbac_insufficient` | warning | Network OK, but RBAC limited | User lacks data-plane roles |
| `private_endpoint_mismatch` | warning | Resolved to different IP than expected | Private endpoint routing may be asymmetric or misconfigured |
| `azure_config_check_skipped` | warning | Azure CLI not authenticated | Can't validate ARM-level network configuration |

---

## Redacted Output

When script is invoked with `-Redact` flag:

```json
{
  "target": {
    "endpointUrl": "REDACTED",
    "hostname": "my-cosmos-account.documents.azure.com",  // Hostname kept (needed for triage)
    "subscriptionId": "REDACTED-SUBSCRIPTION-ID",
    "resourceGroup": "REDACTED",
    "accountName": "REDACTED"
  },
  "diagnostics": {
    "azureCli": {
      "currentUser": "REDACTED-USER-NAME",
      "currentTenant": "REDACTED-TENANT-ID"
    },
    "rbac": {
      "roleAssignments": [
        {
          "roleDefinitionName": "Cosmos DB Operator",
          "principalName": "REDACTED-PRINCIPAL-NAME"
        }
      ]
    }
  }
}
```

---

## Sample Outputs

### Scenario 1: Network Healthy (Public Endpoint)

```json
{
  "version": "1.0.0",
  "timestamp": "2026-05-13T14:30:45Z",
  "target": {
    "endpointUrl": "https://my-cosmos.documents.azure.com",
    "hostname": "my-cosmos.documents.azure.com",
    "subscriptionId": "12345678-1234-1234-1234-123456789012",
    "resourceGroup": "my-rg",
    "accountName": "my-cosmos"
  },
  "diagnostics": {
    "dns": {
      "hostname": "my-cosmos.documents.azure.com",
      "succeeded": true,
      "addresses": ["52.180.123.45"],
      "error": null,
      "latencyMs": 12
    },
    "tcp": {
      "hostname": "my-cosmos.documents.azure.com",
      "port": 443,
      "succeeded": true,
      "error": null,
      "latencyMs": 45,
      "sourceIp": "192.168.1.100"
    },
    "https": {
      "url": "https://my-cosmos.documents.azure.com",
      "succeeded": true,
      "statusCode": 401,
      "error": null,
      "latencyMs": 78
    },
    "privateNetwork": {
      "isPrivateRange": false,
      "indicators": [],
      "matchesExpectedPrivateEndpoint": false,
      "vpnRouteWarning": null
    }
  },
  "classification": {
    "status": "success",
    "code": "network_connectivity_healthy",
    "summary": "Network connectivity is healthy. DNS resolves and TCP 443 is reachable.",
    "rootCause": null,
    "recommendedActions": [
      "✓ Local network connectivity is working",
      "If Cosmos DB operations still fail, check:",
      "  - RBAC/authentication permissions",
      "  - Account firewall IP rules (if enabled)",
      "  - Data plane token expiry",
      "  - Application-level issues (connection strings, SDK versions)"
    ]
  }
}
```

### Scenario 2: Private Endpoint Path Blocked

```json
{
  "version": "1.0.0",
  "timestamp": "2026-05-13T14:35:22Z",
  "target": {
    "endpointUrl": "https://my-cosmos-pe.documents.azure.com",
    "hostname": "my-cosmos-pe.documents.azure.com",
    "subscriptionId": "12345678-1234-1234-1234-123456789012",
    "resourceGroup": "my-rg",
    "accountName": "my-cosmos-pe"
  },
  "diagnostics": {
    "dns": {
      "hostname": "my-cosmos-pe.documents.azure.com",
      "succeeded": true,
      "addresses": ["10.123.171.30"],
      "error": null,
      "latencyMs": 8
    },
    "tcp": {
      "hostname": "my-cosmos-pe.documents.azure.com",
      "port": 443,
      "succeeded": false,
      "error": "Connection timeout after 5000ms",
      "latencyMs": 0,
      "sourceIp": null
    },
    "privateNetwork": {
      "isPrivateRange": true,
      "indicators": [
        "Resolved to RFC 1918 private IP range (10.123.171.30)",
        "Matches expected private endpoint IP (10.123.171.30)"
      ],
      "matchesExpectedPrivateEndpoint": true,
      "vpnRouteWarning": "Private endpoint IP detected but TCP 443 failed. Likely VPN → PE route blocked."
    }
  },
  "classification": {
    "status": "failure",
    "code": "private_endpoint_network_path_blocked",
    "summary": "DNS resolution succeeded but TCP 443 connection failed to private endpoint. Network path is blocked.",
    "rootCause": "Private endpoint network path blocked (VPN routing, firewall/NVA, NSG, UDR, or peering issue)",
    "recommendedActions": [
      "1. Verify VPN connectivity and that your client subnet can route to the private endpoint subnet",
      "2. Ask your network team to verify routing from 10.249.14.218 to private endpoint 10.123.171.30",
      "3. Check Azure network security groups (NSGs) rules for port 443 inbound on private endpoint subnet",
      "4. Verify Azure Virtual Network peering and User Defined Routes (UDRs)",
      "5. Check if corporate firewall/NVA is blocking the connection",
      "6. Manually run: Test-NetConnection -ComputerName my-cosmos-pe.documents.azure.com -Port 443"
    ]
  }
}
```

### Scenario 3: DNS Resolution Failed

```json
{
  "version": "1.0.0",
  "timestamp": "2026-05-13T14:40:10Z",
  "target": {
    "endpointUrl": "https://my-cosmos-invalid.documents.azure.com",
    "hostname": "my-cosmos-invalid.documents.azure.com"
  },
  "diagnostics": {
    "dns": {
      "hostname": "my-cosmos-invalid.documents.azure.com",
      "succeeded": false,
      "addresses": [],
      "error": "No such host is known",
      "dnsServers": ["8.8.8.8"],
      "latencyMs": 2342
    },
    "tcp": {
      "hostname": "my-cosmos-invalid.documents.azure.com",
      "port": 443,
      "succeeded": false,
      "error": "No such host is known",
      "latencyMs": 0,
      "sourceIp": null
    }
  },
  "classification": {
    "status": "failure",
    "code": "dns_resolution_failed",
    "summary": "DNS resolution failed. The Cosmos DB endpoint hostname cannot be resolved.",
    "rootCause": "DNS configuration, VPN/proxy DNS redirect, or network connectivity issue",
    "recommendedActions": [
      "1. Check if you are connected to corporate VPN or proxy that intercepts DNS",
      "2. Manually run: nslookup my-cosmos-invalid.documents.azure.com",
      "3. If nslookup fails, check with your network team or ISP",
      "4. Try pinging the endpoint or using nslookup with alternate DNS: nslookup my-cosmos-invalid.documents.azure.com 8.8.8.8"
    ]
  }
}
```

---

## Parsing Guidelines

Implementers parsing this JSON should:

1. **Always check version**: Fields may differ in future versions. Parse defensively.
2. **Use classification.code not status**: Status is user-facing; code is machine-readable for routing and automation.
3. **Check diagnostics.azureCli.authenticated**: If false, Azure configuration checks are unreliable.
4. **Prioritize classification.recommendedActions**: Contains context-specific guidance.
5. **Redacted fields**: May be null or "REDACTED" strings. Do not assume structure.
6. **Latency fields**: Milliseconds, may be 0 if unavailable.
7. **Handle missing fields**: Especially in older versions or on non-Windows platforms.

---

## Version History

### v1.0.0 (2026-05-13)
- Initial schema
- Includes DNS, TCP, HTTPS, private network, Azure config, and RBAC checks
- Classification codes stable
- Redaction support
