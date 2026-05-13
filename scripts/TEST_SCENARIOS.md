# Cosmos DB Connectivity Diagnostic - Test Scenarios

## Overview

This document defines test scenarios, expected outcomes, and validation procedures for the diagnostic script. Use these to verify script functionality across different network configurations.

---

## Test Infrastructure Setup

### Prerequisites
- Test Cosmos DB accounts in multiple configurations:
  - Public endpoint only
  - Private endpoint only
  - Both public + private endpoints
- Test networks:
  - Clean network (no corporate proxy/VPN)
  - Behind corporate proxy
  - Behind VPN (if possible)
  - Restricted network (firewall blocking 443)

---

## Test Scenarios

### Scenario 1: Healthy Public Endpoint (All Checks Pass)

**Setup:**
- Cosmos account with public endpoint enabled
- Running from clean network (no VPN/proxy)
- Azure CLI authenticated (optional)

**Run:**
```powershell
.\Diagnose-CosmosConnectivity.ps1 `
  -EndpointUrl "https://test-public-01.documents.azure.com" `
  -SubscriptionId "12345678-1234-1234-1234-123456789012" `
  -ResourceGroup "test-cosmos-rg" `
  -AccountName "test-public-01"
```

**Expected Results:**
- ✅ DNS resolution: `succeeded = true`
- ✅ TCP connectivity: `succeeded = true`
- ✅ HTTPS probe: `statusCode = 401` (expected without auth)
- ✅ Private network: `isPrivateRange = false`
- ✅ Classification: `status = "success"`, `code = "network_connectivity_healthy"`

**Validation Checklist:**
- [ ] Console shows "✓ PASS" for DNS and TCP
- [ ] Recommended Actions mention checking RBAC/auth
- [ ] JSON file created successfully
- [ ] Latency values are reasonable (< 1000ms)

---

### Scenario 2: DNS Resolution Failure

**Setup:**
- Network with DNS resolver that blocks documents.azure.com
- OR simulate by providing invalid hostname

**Run:**
```powershell
.\Diagnose-CosmosConnectivity.ps1 `
  -EndpointUrl "https://invalid-account-xyz123.documents.azure.com" `
  -SubscriptionId "12345678-1234-1234-1234-123456789012" `
  -ResourceGroup "test-cosmos-rg" `
  -AccountName "invalid-account"
```

**Expected Results:**
- ❌ DNS resolution: `succeeded = false`, `error = "No such host is known"`
- ❌ TCP connectivity: `succeeded = false`
- ❌ Classification: `status = "failure"`, `code = "dns_resolution_failed"`

**Validation Checklist:**
- [ ] Console shows "✗ FAIL" for DNS
- [ ] Error message is clear
- [ ] Root cause in classification mentions DNS/VPN/proxy
- [ ] Recommended actions include running manual `nslookup`
- [ ] JSON contains error details

---

### Scenario 3: TCP Blocked (Public Endpoint)

**Setup:**
- Network with firewall blocking outbound port 443 to documents.azure.com
- DNS resolves successfully but TCP fails

**Run:**
```powershell
.\Diagnose-CosmosConnectivity.ps1 `
  -EndpointUrl "https://test-public-02.documents.azure.com" `
  -SubscriptionId "12345678-1234-1234-1234-123456789012" `
  -ResourceGroup "test-cosmos-rg" `
  -AccountName "test-public-02"
```

**Expected Results:**
- ✅ DNS resolution: `succeeded = true`
- ❌ TCP connectivity: `succeeded = false`, `error = "Connection timeout after 5000ms"`
- ❌ HTTPS probe: `statusCode = null`, `error contains "timeout"`
- ❌ Private network: `isPrivateRange = false`
- ❌ Classification: `status = "failure"`, `code = "tcp_connectivity_blocked"`

**Validation Checklist:**
- [ ] DNS shows success, TCP shows timeout
- [ ] Console summary distinguishes DNS success from TCP failure
- [ ] Root cause mentions firewall/ISP/proxy
- [ ] Recommended actions include corporate network contact
- [ ] Timeout latency is approximately 5000ms

---

### Scenario 4: Healthy Private Endpoint

**Setup:**
- Cosmos account with private endpoint configured
- Client connected to VPN that can route to PE
- PE IP known and provided

**Run:**
```powershell
.\Diagnose-CosmosConnectivity.ps1 `
  -EndpointUrl "https://test-private-01.documents.azure.com" `
  -SubscriptionId "12345678-1234-1234-1234-123456789012" `
  -ResourceGroup "test-cosmos-rg" `
  -AccountName "test-private-01" `
  -PrivateEndpointIP "10.123.171.30"
```

**Expected Results:**
- ✅ DNS resolution: `succeeded = true`, `addresses = ["10.123.171.30"]`
- ✅ TCP connectivity: `succeeded = true`
- ✅ Private network: `isPrivateRange = true`, `matchesExpectedPrivateEndpoint = true`
- ✅ Azure config: `publicNetworkAccessRestricted = true` (if checked)
- ✅ Classification: `status = "success"`, `code = "network_connectivity_healthy"`

**Validation Checklist:**
- [ ] DNS resolves to private IP (10.x)
- [ ] TCP succeeds to private IP
- [ ] Indicators correctly identify private endpoint
- [ ] Expected PE IP matches resolved IP
- [ ] Classification recognizes healthy private path

---

### Scenario 5: Private Endpoint Network Path Blocked

**Setup:**
- Private endpoint configured
- Client on VPN but routing to PE subnet is blocked
- DNS resolves to PE IP but TCP times out

**Run:**
```powershell
.\Diagnose-CosmosConnectivity.ps1 `
  -EndpointUrl "https://test-private-02.documents.azure.com" `
  -SubscriptionId "12345678-1234-1234-1234-123456789012" `
  -ResourceGroup "test-cosmos-rg" `
  -AccountName "test-private-02" `
  -PrivateEndpointIP "10.123.171.30"
```

**Expected Results:**
- ✅ DNS resolution: `succeeded = true`, `addresses = ["10.123.171.30"]`
- ❌ TCP connectivity: `succeeded = false`, `error = "Connection timeout after 5000ms"`
- ✅ Private network: `isPrivateRange = true`, `matchesExpectedPrivateEndpoint = true`, `vpnRouteWarning != null`
- ❌ Classification: `status = "failure"`, `code = "private_endpoint_network_path_blocked"`

**Validation Checklist:**
- [ ] DNS resolves to expected PE IP
- [ ] TCP to PE IP fails with timeout
- [ ] VPN route warning is populated
- [ ] Classification correctly identifies PE path issue
- [ ] Recommended actions mention network team + routing
- [ ] Source IP is captured (if available)

---

### Scenario 6: RBAC Insufficient

**Setup:**
- Network connectivity is working
- Azure CLI authenticated as user with limited RBAC (e.g., only Reader role)
- Account queried successfully

**Run:**
```powershell
az login  # Login as limited user first
.\Diagnose-CosmosConnectivity.ps1 `
  -EndpointUrl "https://test-rbac-01.documents.azure.com" `
  -SubscriptionId "12345678-1234-1234-1234-123456789012" `
  -ResourceGroup "test-cosmos-rg" `
  -AccountName "test-rbac-01"
```

**Expected Results:**
- ✅ DNS resolution: `succeeded = true`
- ✅ TCP connectivity: `succeeded = true`
- ✅ HTTPS probe: `statusCode = 401` or `200`
- ❌ RBAC: `classification = "insufficient"`, `canReadAccount = false`
- ⚠️ Classification: `status = "warning"`, `code = "rbac_insufficient"`

**Validation Checklist:**
- [ ] Network checks all pass
- [ ] RBAC assessment shows limited permissions
- [ ] Classification code is `rbac_insufficient`
- [ ] Recommended actions mention role assignment
- [ ] Error message explains what permissions are missing

---

### Scenario 7: Azure CLI Not Authenticated

**Setup:**
- All network checks work fine
- Azure CLI not installed OR not authenticated

**Run:**
```powershell
# Without running az login first
.\Diagnose-CosmosConnectivity.ps1 `
  -EndpointUrl "https://test-public-03.documents.azure.com" `
  -SubscriptionId "12345678-1234-1234-1234-123456789012" `
  -ResourceGroup "test-cosmos-rg" `
  -AccountName "test-public-03"
```

**Expected Results:**
- ✅ DNS resolution: `succeeded = true`
- ✅ TCP connectivity: `succeeded = true`
- ⚠️ Azure CLI: `authenticated = false`, `error = "Not authenticated with Azure CLI. Run 'az login' to proceed."`
- ⚠️ Azure config: `checked = false`, `error = "Skipped"`
- ⚠️ Classification: May reference `azure_config_check_skipped` in warnings

**Validation Checklist:**
- [ ] Network checks complete normally
- [ ] Azure CLI context shows unauthenticated
- [ ] Console warning mentions `az login`
- [ ] Recommended actions suggest re-running after authentication
- [ ] Script doesn't crash; gracefully continues

---

### Scenario 8: Interactive Mode Input Flow

**Setup:**
- User runs script with -Interactive flag
- Has all inputs ready

**Run:**
```powershell
.\Diagnose-CosmosConnectivity.ps1 -Interactive
```

**Expected Sequence:**
1. Show input instructions with Portal navigation guide
2. Prompt: "Endpoint URL (e.g., https://my-cosmos.documents.azure.com)"
3. Validate input format; re-prompt if invalid
4. Prompt: "Subscription ID (12345678-...)"
5. Validate GUID format; re-prompt if invalid
6. Prompt: "Resource Group name"
7. Prompt: "Account Name"
8. Prompt: "Private Endpoint IP (optional, press Enter to skip)"
9. Prompt: "VPN Subnet Range (optional, press Enter to skip)"
10. Run diagnostics
11. Display results

**Validation Checklist:**
- [ ] Input instructions are clear and helpful
- [ ] Format validation rejects invalid inputs
- [ ] Optional fields can be skipped (Enter key)
- [ ] All inputs accepted without error
- [ ] Diagnostics run successfully after inputs collected

---

### Scenario 9: Non-Interactive with Redaction

**Setup:**
- Run with -Redact flag
- Collect JSON output

**Run:**
```powershell
$json = .\Diagnose-CosmosConnectivity.ps1 `
  -EndpointUrl "https://test-public-04.documents.azure.com" `
  -SubscriptionId "12345678-1234-1234-1234-123456789012" `
  -ResourceGroup "test-cosmos-rg" `
  -AccountName "test-public-04" `
  -Redact 2>&1 | Select-String -Pattern '^\{' -SimpleMatch | ConvertFrom-Json
```

**Expected Results:**
- ✅ JSON output completes successfully
- ✅ Target section: `subscriptionId = "REDACTED-SUBSCRIPTION-ID"`
- ✅ Target section: `resourceGroup = "REDACTED"`
- ✅ Target section: `accountName = "REDACTED"`
- ✅ Hostname is NOT redacted (needed for triage): `hostname = "test-public-04.documents.azure.com"`
- ✅ Azure CLI: `currentUser = "REDACTED-USER-NAME"`
- ✅ Azure CLI: `currentTenant = "REDACTED-TENANT-ID"`

**Validation Checklist:**
- [ ] Sensitive fields masked as "REDACTED-*"
- [ ] Hostname NOT masked
- [ ] JSON still parseable
- [ ] Redaction doesn't break classification
- [ ] All RBAC role names preserved (not redacted)

---

### Scenario 10: Private Endpoint IP Mismatch

**Setup:**
- Private endpoint exists but expected IP is different from resolved IP
- Can happen if PE reconfigured or DNS zone stale

**Run:**
```powershell
.\Diagnose-CosmosConnectivity.ps1 `
  -EndpointUrl "https://test-private-03.documents.azure.com" `
  -SubscriptionId "12345678-1234-1234-1234-123456789012" `
  -ResourceGroup "test-cosmos-rg" `
  -AccountName "test-private-03" `
  -PrivateEndpointIP "10.123.171.99"  # Expected IP (not matching actual)
```

**Expected Results (if actual PE IP is 10.123.171.30):**
- ✅ DNS resolution: `succeeded = true`, `addresses = ["10.123.171.30"]`
- ✅ TCP connectivity: `succeeded = true` (connects to actual PE)
- ⚠️ Private network: `matchesExpectedPrivateEndpoint = false`, `indicators contains "WARNING: Resolved to 10.123.171.30 but expected ..."`
- ⚠️ Classification: May include `private_endpoint_mismatch` warning

**Validation Checklist:**
- [ ] Mismatch detected
- [ ] Warning includes both expected and actual IPs
- [ ] TCP still attempts with actual resolved IP
- [ ] Classification identifies discrepancy
- [ ] Recommended actions mention checking PE config

---

### Scenario 11: Latency Metrics

**Setup:**
- Healthy connection
- Measure and log latency values

**Run:**
```powershell
$json = .\Diagnose-CosmosConnectivity.ps1 -EndpointUrl "..." -SubscriptionId "..." ... 2>&1 | 
  Select-String -Pattern '^\{' | ConvertFrom-Json
$json.diagnostics.dns.latencyMs
$json.diagnostics.tcp.latencyMs
$json.diagnostics.https.latencyMs
```

**Expected Results:**
- DNS latency: 10-100ms (typical)
- TCP latency: 20-200ms (depends on network)
- HTTPS latency: 50-500ms (full round trip)
- All values > 0 and < 10000 (reasonable)

**Validation Checklist:**
- [ ] Latency values are integers (milliseconds)
- [ ] Values are reasonable for network conditions
- [ ] No values are unrealistic (0 or > 60000)
- [ ] Timeouts show latencyMs = 0

---

### Scenario 12: Multiple Endpoints (Batch Testing)

**Setup:**
- Multiple accounts to test
- Non-interactive batch mode

**Run:**
```powershell
$accounts = @(
  @{Url="https://account1.documents.azure.com"; Sub="..."; RG="rg1"; Name="account1"},
  @{Url="https://account2.documents.azure.com"; Sub="..."; RG="rg2"; Name="account2"},
  @{Url="https://account3.documents.azure.com"; Sub="..."; RG="rg3"; Name="account3"}
)

$results = @()
foreach ($acct in $accounts) {
  $json = .\Diagnose-CosmosConnectivity.ps1 @acct 2>&1 | 
    Select-String -Pattern '^\{' | ConvertFrom-Json
  $results += @{
    Account = $acct.Name
    Classification = $json.classification.code
    DNS = $json.diagnostics.dns.succeeded
    TCP = $json.diagnostics.tcp.succeeded
  }
}
$results | Format-Table
```

**Expected Results:**
- All accounts processed without error
- JSON output captured for each
- Results table shows aggregated status
- Classification codes vary based on network conditions

**Validation Checklist:**
- [ ] Batch processing completes
- [ ] All JSON files created
- [ ] No cross-account contamination
- [ ] Timestamp differs for each run

---

## Regression Test Checklist

Use this checklist before each release:

- [ ] **Script Execution**
  - [ ] Interactive mode completes
  - [ ] Non-interactive mode with all parameters
  - [ ] Redaction flag works
  - [ ] Help/documentation displays correctly

- [ ] **Network Diagnostics**
  - [ ] DNS resolution succeeds on good network
  - [ ] DNS resolution fails on blocked network
  - [ ] TCP succeeds on open port
  - [ ] TCP times out on blocked port
  - [ ] HTTPS probe returns status code

- [ ] **Private Endpoints**
  - [ ] Detects private IP ranges correctly
  - [ ] Compares against expected PE IP
  - [ ] Handles PE IP mismatches gracefully

- [ ] **Azure Integration**
  - [ ] Works with authenticated Azure CLI
  - [ ] Gracefully handles unauthenticated state
  - [ ] Queries account config successfully
  - [ ] RBAC assessment runs

- [ ] **JSON Output**
  - [ ] Valid JSON syntax
  - [ ] All expected fields present
  - [ ] Field values are correct types
  - [ ] Redacted fields are properly masked

- [ ] **Classification**
  - [ ] Success code for healthy network
  - [ ] DNS failure code for DNS issues
  - [ ] TCP failure code for blocked ports
  - [ ] PE path blocked code for PE issues
  - [ ] RBAC code for permission issues

- [ ] **Documentation**
  - [ ] Recommended actions are actionable
  - [ ] Error messages are helpful
  - [ ] Output is readable and organized

- [ ] **Edge Cases**
  - [ ] Invalid URL format rejected
  - [ ] Invalid GUID format rejected
  - [ ] Timeout handling works
  - [ ] No unhandled exceptions

---

## Performance Expectations

| Operation | Expected Time | Timeout |
|-----------|---|---|
| DNS resolution | 10-100ms | 5000ms |
| TCP connect | 20-200ms | 5000ms |
| HTTPS probe | 50-500ms | 5000ms |
| Azure CLI queries | 1-5 seconds | 10000ms |
| Full script (good network) | 10-20 seconds | N/A |
| Full script (blocked port) | ~5 seconds | N/A |

---

## Success Criteria

A test scenario passes if:
1. ✅ Script completes without unhandled exceptions
2. ✅ JSON output is valid and contains all expected fields
3. ✅ Classification code matches expected scenario
4. ✅ Recommended actions are relevant to the issue
5. ✅ Latency values are reasonable
6. ✅ Redaction (if enabled) properly masks sensitive fields

---

## Sign-Off

**QA Tester:** _________________ **Date:** _________

**Reviewed By:** _________________ **Date:** _________

**Approved for Release:** _________________ **Date:** _________

---

## Version

- **Script Version:** 1.0.0
- **Test Plan Version:** 1.0.0
- **Last Updated:** 2026-05-13
