# Cosmos DB Connectivity Diagnostic Script - README

## Overview

This is a standalone PowerShell diagnostic script that captures network connectivity, private endpoint configuration, and Azure RBAC status for Cosmos DB accounts. It's designed to be run locally on a customer's machine to help troubleshoot HTTP 0.0 and connection errors.

**Key Features:**
- ✅ DNS resolution verification
- ✅ TCP 443 connectivity testing  
- ✅ HTTPS reachability probe
- ✅ Private endpoint detection
- ✅ Private network route analysis
- ✅ Azure CLI optional context (network config, RBAC)
- ✅ Structured JSON output for triage automation
- ✅ Sensitive data redaction for safe sharing
- ✅ Interactive and non-interactive modes

---

## Quick Start

### Prerequisites

- PowerShell 5.0+ (works on Windows, Linux, macOS)
- If querying Azure config: Azure CLI installed and authenticated (`az login`)
- Outbound network access to documents.azure.com

### Option 1: Interactive Mode (Recommended for First Run)

Simplest approach—script prompts for inputs:

```powershell
.\Diagnose-CosmosConnectivity.ps1 -Interactive
```

The script will display a guide showing where to find each input, then prompt:
- Endpoint URL
- Subscription ID
- Resource Group
- Account Name
- (Optional) Private Endpoint IP
- (Optional) VPN Subnet Range

### Option 2: Non-Interactive Mode (Scripted/Automated)

Provide all parameters directly:

```powershell
.\Diagnose-CosmosConnectivity.ps1 `
  -EndpointUrl "https://my-cosmos-account.documents.azure.com" `
  -SubscriptionId "12345678-1234-1234-1234-123456789012" `
  -ResourceGroup "my-resource-group" `
  -AccountName "my-cosmos-account"
```

### Option 3: Non-Interactive with Redaction (Safe for Support)

Output JSON with sensitive data masked:

```powershell
.\Diagnose-CosmosConnectivity.ps1 `
  -EndpointUrl "https://my-cosmos-account.documents.azure.com" `
  -SubscriptionId "12345678-1234-1234-1234-123456789012" `
  -ResourceGroup "my-resource-group" `
  -AccountName "my-cosmos-account" `
  -Redact
```

---

## Detailed Usage

### Getting Your Inputs

#### 1. **Endpoint URL** (Required)
**Location:** Azure Portal → Cosmos DB Account → Overview

1. Go to [Azure Portal](https://portal.azure.com)
2. Search for "Cosmos DB"
3. Click your Cosmos DB account
4. Look for the **"URI"** field in the Overview tab
5. Copy the entire URL (e.g., `https://my-cosmos-account.documents.azure.com`)

**Format:** `https://<account-name>.documents.azure.com` (do NOT include trailing slash or `:443/`)

**Note:** If using a regional endpoint, use the primary endpoint. Private endpoints will have the same hostname with different IP resolution.

---

#### 2. **Subscription ID** (Required)
**Location:** Azure Portal → Subscriptions or Portal → Home

1. Go to [Azure Portal](https://portal.azure.com)
2. Click on "Subscriptions" (or search for it)
3. Find your subscription
4. Copy the **Subscription ID** (looks like `12345678-1234-1234-1234-123456789012`)

**Alternative:** From your Cosmos account page, look at the breadcrumb at the top or search box.

---

#### 3. **Resource Group** (Required)
**Location:** Azure Portal → Cosmos DB Account (top-right corner)

1. Open your Cosmos DB account
2. At the top of the page, you'll see breadcrumbs
3. Look for **"Resource group: <name>"** in the top-right
4. Or on the Overview page, find the **"Resource group"** field

**Example:** `my-production-rg` or `cosmos-resources`

---

#### 4. **Account Name** (Required)
**Location:** Extract from endpoint URL or Azure Portal

**From URL:**
- Endpoint: `https://my-cosmos-account.documents.azure.com`
- Account Name: `my-cosmos-account` (the part before `.documents.azure.com`)

**From Portal:**
- Open Cosmos DB account → Look at the account name in the breadcrumb or page title

---

#### 5. **Private Endpoint IP** (Optional but Recommended)
**Location:** Azure Portal → Cosmos DB Account → Private Endpoint Connections

1. Open your Cosmos DB account
2. Go to **Settings** → **Private Endpoint Connections**
3. If any connections exist, look for **"Private IP address"** column
4. Copy the IP (e.g., `10.123.171.30`)

**When to provide:**
- If your Cosmos account has private endpoints configured
- Otherwise, leave blank (press Enter in interactive mode)

**Format:** `10.x.x.x`, `172.16-31.x.x`, or `192.168.x.x` (RFC 1918 ranges)

---

#### 6. **VPN Subnet Range** (Optional)
**Location:** Ask your network team or VPN client properties

If you're connecting via VPN, your network team should know your VPN subnet CIDR.

**Example:** `10.0.0.0/24` (network: 10.0.0.0–10.0.0.255)

**When to provide:**
- If you're behind a VPN
- If you suspect VPN routing is the issue
- Otherwise, leave blank

---

### Understanding Output

#### Console Summary

After running, you'll see:

```
═════════════════════════════════════════════════════════════════════════════
DIAGNOSTIC COMPLETE
═════════════════════════════════════════════════════════════════════════════

Summary:
  DNS Resolution: ✓ PASS
  TCP Connectivity: ✗ FAIL
  Private Network: Detected (Private Endpoint)
  Classification: FAILURE - tcp_connectivity_blocked

Full report saved to: cosmos-diagnostic-20260513_143045.json

Summary:
TCP 443 connection failed to private endpoint. Network path is blocked.

Recommended Actions:
  1. Verify VPN connectivity and that your client subnet can route to the private endpoint subnet
  2. Ask your network team to verify routing from DESKTOP-ABC123 to private endpoint 10.123.171.30
  3. Check Azure network security groups (NSGs) rules for port 443 inbound
  4. Verify Azure Virtual Network peering and User Defined Routes (UDRs)
  5. Check if corporate firewall/NVA is blocking the connection
  6. Manually run: Test-NetConnection -ComputerName my-cosmos-account.documents.azure.com -Port 443

Full JSON Report:
...
```

#### JSON Output File

A file like `cosmos-diagnostic-20260513_143045.json` is automatically saved in the current directory.

**Use this file to:**
- Share with support (can use `-Redact` to mask sensitive data)
- Parse with automation tools
- Retain diagnostic history

---

## Common Scenarios

### Scenario 1: "I can't connect to Cosmos DB from my machine"

**Run this:**
```powershell
.\Diagnose-CosmosConnectivity.ps1 -Interactive
```

**Interpret results:**
- If `dns_resolution_failed` → Check VPN/proxy DNS settings
- If `tcp_connectivity_blocked` → Ask network team to check firewall/NSG rules  
- If `network_connectivity_healthy` → Issue is auth/RBAC, not network

---

### Scenario 2: "Private endpoint isn't working"

**Run this:**
```powershell
.\Diagnose-CosmosConnectivity.ps1 `
  -EndpointUrl "https://my-cosmos.documents.azure.com" `
  -SubscriptionId "your-sub-id" `
  -ResourceGroup "your-rg" `
  -AccountName "your-account" `
  -PrivateEndpointIP "10.123.171.30"
```

**Interpret results:**
- If resolved IP matches private endpoint IP but TCP fails → VPN route blocked
- If resolved IP differs from provided IP → Route misconfiguration
- If network is healthy → Check private DNS zone configuration

---

### Scenario 3: "How do I share this with support safely?"

**Run with redaction:**
```powershell
.\Diagnose-CosmosConnectivity.ps1 `
  -EndpointUrl "https://my-cosmos.documents.azure.com" `
  -SubscriptionId "your-sub-id" `
  -ResourceGroup "your-rg" `
  -AccountName "your-account" `
  -Redact
```

Then share the generated JSON file. Sensitive data (subscription ID, usernames, tenant ID) will be masked as `REDACTED`.

---

### Scenario 4: "I need the diagnostics in a pipeline"

**Non-interactive with JSON output capture:**
```powershell
$json = .\Diagnose-CosmosConnectivity.ps1 `
  -EndpointUrl "https://my-cosmos.documents.azure.com" `
  -SubscriptionId "your-sub-id" `
  -ResourceGroup "your-rg" `
  -AccountName "your-account" 2>&1 `
  | Select-String -Pattern '^\{' -SimpleMatch | ConvertFrom-Json

# Now use $json in automation
if ($json.classification.code -eq "network_connectivity_healthy") {
    Write-Host "Network OK, escalating to app team"
} else {
    Write-Host "Network issue: $($json.classification.summary)"
}
```

---

## Classification Codes

The script produces one of these classification codes:

| Code | Meaning |
|------|---------|
| `network_connectivity_healthy` | ✓ Network works. If errors, check auth/RBAC. |
| `dns_resolution_failed` | ✗ Cannot resolve endpoint hostname. |
| `tcp_connectivity_blocked` | ✗ DNS works, but TCP 443 blocked. |
| `private_endpoint_network_path_blocked` | ✗ Private endpoint detected, TCP fails. |
| `rbac_insufficient` | ⚠ Network OK, but RBAC permissions missing. |
| `azure_config_check_skipped` | ⚠ Azure CLI not authenticated. |

See [CLASSIFICATION_MATRIX.md](./CLASSIFICATION_MATRIX.md) for detailed playbooks and support guidance.

---

## Advanced Usage

### Running Specific Checks

The script always runs all checks, but you can parse the JSON to focus on specific ones:

```powershell
# Get just DNS results
$report = Get-Content cosmos-diagnostic-*.json | ConvertFrom-Json
$report.diagnostics.dns | ConvertTo-Json

# Get classification only
$report.classification | ConvertTo-Json

# Check if RBAC is sufficient
$report.diagnostics.rbac.classification
```

---

### Integration with Support Ticketing

When opening a support case:

1. **Run the script** (interactive mode is fine)
2. **Include the generated JSON file** in your ticket
3. **Or use `-Redact` flag** if sharing with external support

Example ticket text:
```
Title: Cosmos DB Connection Errors

Body:
Experiencing connection errors to my Cosmos DB account.
Attached diagnostic results (cosmos-diagnostic-*.json).

Network Status: [paste classification.status]
Issue Code: [paste classification.code]
Endpoint: [paste target.hostname]
```

---

### Troubleshooting the Script Itself

#### Script won't run (permission denied)

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then re-run the script.

#### "Azure CLI not found" but I need RBAC checks

Install Azure CLI:
- Windows: https://learn.microsoft.com/en-us/cli/azure/install-azure-cli-windows
- Mac: `brew install azure-cli`
- Linux: Follow docs at https://learn.microsoft.com/en-us/cli/azure/install-azure-cli-linux

Then:
```powershell
az login
```

Re-run the script.

#### Endpoint validation error

**Error:** "Invalid format. Expected: https://<account-name>.documents.azure.com"

**Fix:** Remove trailing slash or port from URL:
- ❌ `https://my-cosmos.documents.azure.com/` (trailing slash)
- ❌ `https://my-cosmos.documents.azure.com:443/` (with port)
- ✅ `https://my-cosmos.documents.azure.com` (correct)

---

## File Outputs

### Generated Files

After running, the script creates:

**`cosmos-diagnostic-<timestamp>.json`**
- Full diagnostic report in JSON format
- Machine-readable for automation
- Can be shared with support
- Keep for troubleshooting history

---

## JSON Schema

For details on JSON structure, field definitions, and sample outputs, see [DIAGNOSTIC_SCHEMA.md](./DIAGNOSTIC_SCHEMA.md).

---

## Support Routing

Based on classification code, route as follows:

| Classification | Route To |
|---|---|
| `network_connectivity_healthy` | Application/Auth team—network verified working |
| `dns_resolution_failed` | VPN/Network team—DNS issue |
| `tcp_connectivity_blocked` (public IP) | Firewall/ISP team—outbound port blocked |
| `private_endpoint_network_path_blocked` | Network team—PE routing issue |
| `rbac_insufficient` | Cosmos DB Access Control team |
| `azure_config_check_skipped` | Customer: Run `az login` first |

---

## Version

**Script Version:** 1.0.0  
**Schema Version:** 1.0.0  
**Last Updated:** 2026-05-13

---

## License

This script is provided as-is for diagnosing Cosmos DB connectivity issues. See [LICENSE](../../LICENSE) for terms.

---

## Next Steps

1. **Run the script:** `.\Diagnose-CosmosConnectivity.ps1 -Interactive`
2. **Review output:** Check the JSON report and console summary
3. **Follow recommended actions** based on the classification code
4. **Share with support** if needed (use `-Redact` for sensitive data masking)

For questions or issues with the script itself, contact the Cosmos DB team.
